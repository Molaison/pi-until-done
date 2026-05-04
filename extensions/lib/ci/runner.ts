import type { CiCheck, CiResult } from "./types";

type SpawnLike = ReturnType<typeof Bun.spawn>;

const decoder = new TextDecoder();

const drainStream = async (stream: unknown): Promise<string> => {
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

const startSpawn = (argv: string[], cwd: string): SpawnLike =>
	Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "pipe" });

const armTimeout = (proc: SpawnLike, timeoutMs: number): NodeJS.Timeout =>
	setTimeout(() => proc.kill(), timeoutMs);

const collect = async (proc: SpawnLike): Promise<{ exit: number; output: string }> => {
	const [stdout, stderr, exit] = await Promise.all([
		drainStream(proc.stdout),
		drainStream(proc.stderr),
		proc.exited,
	]);
	return { exit, output: `${stdout}${stderr}` };
};

export const runOne = async (check: CiCheck, cwd: string): Promise<CiResult> => {
	const started = Date.now();
	const command = check.argv.join(" ");
	const proc = startSpawn(check.argv, cwd);
	const timer = armTimeout(proc, check.timeoutMs);
	try {
		const { exit, output } = await collect(proc);
		clearTimeout(timer);
		return {
			verb: check.verb,
			command,
			skipped: false,
			ok: exit === 0,
			exitCode: exit,
			output: output.slice(-4000),
			durationMs: Date.now() - started,
		};
	} catch (e) {
		clearTimeout(timer);
		return {
			verb: check.verb,
			command,
			skipped: false,
			ok: false,
			exitCode: null,
			output: e instanceof Error ? e.message : String(e),
			durationMs: Date.now() - started,
		};
	}
};

export const runAll = async (
	checks: readonly CiCheck[],
	cwd: string,
): Promise<CiResult[]> => Promise.all(checks.map((c) => runOne(c, cwd)));
