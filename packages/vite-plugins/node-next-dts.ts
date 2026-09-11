/**
 * Regex matching static import specifiers — used to find bare module paths
 * (without file extensions) in .d.ts files.
 */
const RELATIVE_DTS_SPECIFIER =
  /(?<prefix>(?:from|import)\s*["'])(?<pathPart>\.\.?(?:\/[^/"'()?#]+)+)(?<suffix>(?:[?#][^"'()]*)?)(?<quote>["'])/g;
/**
 * Regex matching dynamic import() specifiers — same purpose as above but for
 * lazy imports.
 */
const DYNAMIC_IMPORT_DTS_SPECIFIER =
  /(?<prefix>import\(\s*["'])(?<pathPart>\.\.?(?:\/[^/"'()?#]+)+)(?<suffix>(?:[?#][^"'()]*)?)(?<quote>["']\s*\))/g;

/**
 * Matches paths that already have a file extension — these are left as-is.
 */
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

/**
 * Appends `.js` to a bare module path so it conforms to NodeNext module
 * resolution (which requires explicit extensions).
 *
 * @param pathPart — The import path (e.g. "./foo")
 * @param suffix — Optional query/hash suffix to preserve
 * @returns — Path with `.js` appended if no extension exists
 */
const toNodeNextSpecifier = (pathPart: string, suffix = ""): string => {
  if (!pathPart || HAS_EXTENSION.test(pathPart)) {
    return `${pathPart}${suffix}`;
  }

  return `${pathPart}.js${suffix}`;
};

/**
 * Rewrites bare-specifier imports in `.d.ts` files to include `.js` extensions,
 * making them compatible with NodeNext / moduleResolution bundler modes used
 * by modern TypeScript and Vite.
 *
 * @param filePath — Path to the .d.ts file (used to skip non-.d.ts files)
 * @param content — Raw file content to rewrite
 * @returns — The original (or rewritten) file path and content
 */
export const rewriteNodeNextDtsSpecifiers = (
  filePath: string,
  content: string
): { filePath: string; content: string } => {
  if (!filePath.endsWith(".d.ts")) {
    return { filePath, content };
  }

  const rewrittenContent = content
    .replace(
      RELATIVE_DTS_SPECIFIER,
      (_match: string, prefix: string, pathPart: string, suffix: string, quote: string) => {
        return `${prefix}${toNodeNextSpecifier(pathPart, suffix)}${quote}`;
      }
    )
    .replace(
      DYNAMIC_IMPORT_DTS_SPECIFIER,
      (_match: string, prefix: string, pathPart: string, suffix: string, quote: string) => {
        return `${prefix}${toNodeNextSpecifier(pathPart, suffix)}${quote}`;
      }
    );

  return { filePath, content: rewrittenContent };
};
