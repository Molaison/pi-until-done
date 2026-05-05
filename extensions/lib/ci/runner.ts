import { OUTPUT_TRUNCATION_CHARS, OUTPUT_TRUNCATION_MARKER } from "./constants";
import type { CiCheck, CiResult } from "./types";

type SpawnLike = ReturnType<typeof Bun.spawn>;

const decoder = new TextDecoder();

const isWin = process.platform === "win32";

interface ProcState {
	proc: SpawnLike;
	readers: ReadableStreamDefaultReader<Uint8Array>[];
	killed: boolean;
}

const drainCaptured = async (
	stream: unknown,
	state: ProcState,
): Promise<string> => {
	if (!stream || typeof stream !== "object" || !("getReader" in stream))
		return "";
	const reader = (stream as ReadableStream<Uint8Array>).getReader();
	state.readers.push(reader);
	let out = "";
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			out += decoder.decode(value, { stream: true });
		}
	} catch {
		// reader was cancelled by killTree — return what we have so far
	}
	return out + decoder.decode();
};

const truncate = (s: string): string =>
	s.length <= OUTPUT_TRUNCATION_CHARS
		? s
		: OUTPUT_TRUNCATION_MARKER + s.slice(-OUTPUT_TRUNCATION_CHARS);

const startSpawn = (argv: string[], cwd: string): SpawnLike =>
	Bun.spawn(argv, {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
		// On Unix, put the spawn in its own process group so SIGKILL on the
		// negative pid takes the whole descendant tree. Without this, killing
		// only the shell wrapper leaves orphaned children holding the
		// stdout/stderr pipes open and `proc.exited` blocks until the orphan
		// finishes naturally (e.g. a 5s `sleep 5` waits the whole 5s).
		// Windows has no process groups — we cancel the readers instead.
		...(isWin ? {} : { detached: true }),
	});

const killTree = (state: ProcState): void => {
	state.killed = true;
	const { proc } = state;
	if (!isWin) {
		try {
			process.kill(-proc.pid, "SIGKILL");
		} catch {
			try {
				proc.kill("SIGKILL");
			} catch {
				/* best-effort */
			}
		}
	} else {
		try {
			proc.kill("SIGKILL");
		} catch {
			/* best-effort */
		}
	}
	// Cancel any captured pipe readers so `drainCaptured` returns immediately
	// even when an orphan still holds the writer side. This is the only
	// portable way to force-resolve the drain on Windows (no process groups).
	for (const reader of state.readers) {
		reader.cancel().catch(() => {});
	}
};

const armTimeout = (state: ProcState, timeoutMs: number): NodeJS.Timeout =>
	setTimeout(() => killTree(state), timeoutMs);

const armAbort = (
	state: ProcState,
	signal: AbortSignal | undefined,
): (() => void) => {
	if (!signal) return () => {};
	const onAbort = () => killTree(state);
	if (signal.aborted) {
		killTree(state);
		return () => {};
	}
	signal.addEventListener("abort", onAbort, { once: true });
	return () => signal.removeEventListener("abort", onAbort);
};

const collect = async (
	state: ProcState,
): Promise<{ exit: number; output: string }> => {
	const [stdout, stderr, exit] = await Promise.all([
		drainCaptured(state.proc.stdout, state),
		drainCaptured(state.proc.stderr, state),
		state.proc.exited,
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
	const state: ProcState = { proc, readers: [], killed: false };
	const timer = armTimeout(state, check.timeoutMs);
	const detachAbort = armAbort(state, signal);
	try {
		const { exit, output } = await collect(state);
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
