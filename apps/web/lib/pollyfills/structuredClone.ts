/** Re-export of the global `structuredClone` for environments where it is not available (legacy runtimes). */
const structuredCloneExport = globalThis.structuredClone;

export { structuredCloneExport as structuredClone };
