import { ZodError } from "zod";

/**
 * Converts a Zod validation error into a flat key→message map where each
 * key is the dot-joined path of the failed field.
 */
export const transformErrorToDetails = (error: ZodError<any>): { [key: string]: string } => {
  const details: { [key: string]: string } = {};
  for (const issue of error.issues) {
    details[issue.path.join(".")] = issue.message;
  }
  return details;
};
