import { TResponseDataValue } from "@formbricks/types/responses";

/** Checks whether a response data value is non-empty (string with content, non-empty array, number, or non-empty object). */
export const isValidValue = (value: TResponseDataValue) => {
  return (
    (typeof value === "string" && value.trim() !== "") ||
    (Array.isArray(value) && value.length > 0) ||
    typeof value === "number" ||
    (typeof value === "object" && Object.entries(value).length > 0)
  );
};

/** Returns true if the submission time is more than 5 minutes ago — used to determine whether an in-progress response can be deleted. */
export const isSubmissionTimeMoreThan5Minutes = (submissionTimeISOString: Date) => {
  const submissionTime: Date = new Date(submissionTimeISOString);
  const currentTime: Date = new Date();
  const timeDifference: number = (currentTime.getTime() - submissionTime.getTime()) / (1000 * 60); // Convert milliseconds to minutes
  return timeDifference > 5;
};
