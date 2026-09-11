/**
 * Merges Tailwind CSS class names, resolving conflicts via tailwind-merge.
 * Central utility so every component gets consistent, non-conflicting classes.
 *
 * @param inputs — class values to merge (strings, objects, arrays)
 * @returns — a single deduplicated class string
 *
 * @example
 * ```typescript
 * cn("px-4 py-2", "px-6") // => "py-2 px-6"
 * ```
 */
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
