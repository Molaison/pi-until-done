/** Host-version-tolerant loader for Pi's completeSimple dispatch API. */
type CompleteSimpleFn = typeof import("@earendil-works/pi-ai/compat").completeSimple;

const MODULE_NOT_FOUND_CODES = new Set(["ERR_PACKAGE_PATH_NOT_EXPORTED", "ERR_MODULE_NOT_FOUND", "MODULE_NOT_FOUND"]);

function isModuleNotFound(error: unknown): boolean {
	for (
		let current: unknown = error, depth = 0;
		current != null && depth < 16;
		current = (current as { cause?: unknown }).cause, depth++
	) {
		if (
			typeof current === "object"
			&& MODULE_NOT_FOUND_CODES.has((current as { code?: unknown }).code as string)
		) {
			return true;
		}
	}
	return false;
}

export async function loadCompleteSimple(): Promise<CompleteSimpleFn> {
	let module: { completeSimple?: CompleteSimpleFn };
	try {
		module = (await import("@earendil-works/pi-ai/compat")) as { completeSimple?: CompleteSimpleFn };
	} catch (error) {
		if (!isModuleNotFound(error)) throw error;
		module = (await import("@earendil-works/pi-ai")) as { completeSimple?: CompleteSimpleFn };
	}
	if (typeof module.completeSimple !== "function") {
		throw new Error("pi-ai does not expose completeSimple on /compat or the package root");
	}
	return module.completeSimple;
}
