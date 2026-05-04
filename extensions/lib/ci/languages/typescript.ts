import { miseExec } from "../factories";
import type { LanguageProfile } from "./types";

export const TYPESCRIPT_BUN: LanguageProfile = {
	id: "typescript-bun",
	markers: ["bun.lock", "bun.lockb"],
	checks: [
		miseExec("typecheck", ["bun", "x", "tsc", "--noEmit"]),
		miseExec("lint", ["bun", "x", "biome", "check", "--reporter=summary"]),
		miseExec("format", ["bun", "x", "biome", "format", "--reporter=summary"]),
		miseExec("test", ["bun", "test"]),
	],
};

export const NODE_PNPM: LanguageProfile = {
	id: "node-pnpm",
	markers: ["pnpm-lock.yaml"],
	checks: [
		miseExec("typecheck", ["pnpm", "exec", "tsc", "--noEmit"]),
		miseExec("test", ["pnpm", "test"]),
	],
};

export const NODE_NPM: LanguageProfile = {
	id: "node-npm",
	markers: ["package-lock.json"],
	checks: [
		miseExec("typecheck", ["npx", "tsc", "--noEmit"]),
		miseExec("test", ["npm", "test"]),
	],
};

export const NODE_YARN: LanguageProfile = {
	id: "node-yarn",
	markers: ["yarn.lock"],
	checks: [
		miseExec("typecheck", ["yarn", "exec", "tsc", "--noEmit"]),
		miseExec("test", ["yarn", "test"]),
	],
};

export const DENO: LanguageProfile = {
	id: "deno",
	markers: ["deno.json", "deno.jsonc", "deno.lock"],
	checks: [
		miseExec("typecheck", ["deno", "check", "**/*.ts"]),
		miseExec("lint", ["deno", "lint"]),
		miseExec("format", ["deno", "fmt", "--check"]),
		miseExec("test", ["deno", "test", "--quiet"]),
	],
};
