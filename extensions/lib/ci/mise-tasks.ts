import type { CiVerb } from "./types";

const TASK_LIST_TIMEOUT_MS = 5_000;
const KNOWN_VERBS: readonly CiVerb[] = [
	"typecheck",
	"lint",
	"format",
	"compile",
	"test",
	"build",
];

interface TaskListEntry {
	name?: string;
}

const decoder = new TextDecoder();

const parseNames = (json: string): Set<string> => {
	try {
		const data = JSON.parse(json);
		if (!Array.isArray(data)) return new Set();
		return new Set(
			(data as TaskListEntry[]).map((t) => t?.name).filter((n): n is string => !!n),
		);
	} catch {
		return new Set();
	}
};

const drain = async (stream: unknown): Promise<string> => {
	if (!stream || typeof stream !== "object" || !("getReader" in stream)) return "";
	const reader = (stream as ReadableStream<Uint8Array>).getReader();
	let out = "";
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		out += decoder.decode(value, { stream: true });
	}
	return out + decoder.decode();
};

export const fetchMiseTaskNames = async (cwd: string): Promise<Set<string>> => {
	try {
		const proc = Bun.spawn(["mise", "tasks", "ls", "--json"], {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		const timer = setTimeout(() => proc.kill(), TASK_LIST_TIMEOUT_MS);
		const [out, exit] = await Promise.all([drain(proc.stdout), proc.exited]);
		clearTimeout(timer);
		if (exit !== 0) return new Set();
		return parseNames(out);
	} catch {
		return new Set();
	}
};

export const matchedVerbs = (taskNames: Set<string>): CiVerb[] =>
	KNOWN_VERBS.filter((v) => taskNames.has(v));
