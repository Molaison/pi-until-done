/**
 * Build smoke test — verify the runtime entrypoint resolves and every
 * module it transitively imports can be loaded by Bun without throwing.
 *
 * Cross-platform safe: no shell-quoting, no inline JS strings. Just a
 * `.ts` file Bun can run with `bun tests/build-smoke.ts`.
 */
const mod = await import("../extensions/until-done.ts");

if (typeof mod.default !== "function") {
	console.error("build-smoke: expected default export to be a function");
	process.exit(1);
}

console.log("build ok");
