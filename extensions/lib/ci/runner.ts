import { OUTPUT_TRUNCATION_CHARS, OUTPUT_TRUNCATION_MARKER } from "./constants";
import type { CiCheck, CiResult } from "./types";

type SpawnLike = ReturnType<typeof Bun.spawn>;

const decoder = new TextDecoder();

const drainStream = async (stream: unknown): Promise<string> => {
	if (!stream || typeof stream !== "object" || !("getReader" in stream))
		return "";
	const reader = (stream as ReadableStream<Uint8Array>).getReader();
	let out = "";
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		out += decoder.decode(value, { stream: true });
	}
	return out + decoder.decode();
};

const truncate = (s: string): string =>
	s.length <= OUTPUT_TRUNCATION_CHARS
		? s
		: OUTPUT_TRUNCATION_MARKER + s.slice(-OUTPUT_TRUNCATION_CHARS);

const isWin = process.platform === "win32";

const startSpawn = (argv: string[], cwd: string): SpawnLike =>
	Bun.spawn(argv, {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
		// On Unix, put the spawn in a new process group so we can SIGKILL
		// the whole tree on timeout/abort — without this, killing only the
		// shell wrapper leaves orphaned descendants holding the stdout/stderr
		// pipes open and `proc.exited` waits for them to finish naturally.
		// Windows has no process groups; rely on the per-process kill.
		...(isWin ? {} : { detached: true }),
	});

const killTree = (proc: SpawnLike): void => {
	if (!isWin) {
		try {
			// Negative pid → entire process group (set up by detached: true)
			process.kill(-proc.pid, "SIGKILL");
			return;
		} catch {
			// Group may have already exited; fall through to single-proc kill
		}
	}
	try {
		proc.kill("SIGKILL");
	} catch {
		// best-effort
	}
};

const armTimeout = (proc: SpawnLike, timeoutMs: number): NodeJS.Timeout =>
	setTimeout(() => killTree(proc), timeoutMs);

const armAbort = (
	proc: SpawnLike,
	signal: AbortSignal | undefined,
): (() => void) => {
	if (!signal) return () => {};
	const onAbort = () => killTree(proc);
	if (signal.aborted) {
		killTree(proc);
		return () => {};
	}
	signal.addEventListener("abort", onAbort, { once: true });
	return () => signal.removeEventListener("abort", onAbort);
};

const collect = async (
	proc: SpawnLike,
): Promise<{ exit: number; output: string }> => {
	const [stdout, stderr, exit] = await Promise.all([
		drainStream(proc.stdout),
		drainStream(proc.stderr),
		proc.exited,
	]);
	return { exit, output: `${stdout}${stderr}` };
};

export const runOne = async (
	check: CiCheck,
	cwd: string,
	signal?: AbortSignal,
): Promise<CiResult> => {
	const started = Date.now();
	const command = check.argv.join(" ");
	const proc = startSpawn(check.argv, cwd);
	const timer = armTimeout(proc, check.timeoutMs);
	const detachAbort = armAbort(proc, signal);
	try {
		const { exit, output } = await collect(proc);
		clearTimeout(timer);
		detachAbort();
		return {
			verb: check.verb,
			command,
			skipped: false,
			ok: exit === 0,
			exitCode: exit,
			output: truncate(output),
			durationMs: Date.now() - started,
		};
	} catch (e) {
		clearTimeout(timer);
		detachAbort();
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
	signal?: AbortSignal,
): Promise<CiResult[]> =>
	Promise.all(checks.map((c) => runOne(c, cwd, signal)));
