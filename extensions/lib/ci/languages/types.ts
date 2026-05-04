import type { CiCheck } from "../types";

export interface LanguageProfile {
	id: string;
	markers: readonly string[];
	checks: readonly CiCheck[];
}
