import { TResponseData } from "@formbricks/types/responses";
import { MAX_OTHER_OPTION_LENGTH } from "@/lib/constants";
import { getLocalizedValue } from "@/lib/i18n/utils";

type TQuestionWithOtherOptionValidation = {
  id: string;
  type: string;
  choices?: unknown[];
};

/**
 * Checks if a response value exceeds the maximum length for free-form 'other' options.
 *
 * @param value — The submitted value to check
 * @param choices — The predefined choices for comparison
 * @param questionId — The question ID for error context
 * @param language — The response language for localized comparison
 * @returns — The questionId if validation fails, undefined otherwise
 */
export const validateOtherOptionLength = (
  value: string,
  choices: unknown[],
  questionId: string,
  language?: string
): string | undefined => {
  // Check if this is an "other" option (not in predefined choices)
  const matchingChoice = choices.find(
    (choice) =>
      typeof choice === "object" &&
      choice !== null &&
      "label" in choice &&
      typeof choice.label === "object" &&
      choice.label !== null &&
      getLocalizedValue(choice.label as Record<string, string>, language ?? "default") === value
  );

  // If this is an "other" option with value that's too long, reject the response
  if (!matchingChoice && value.length > MAX_OTHER_OPTION_LENGTH) {
    return questionId;
  }
};

/**
 * Validates that all multiple-choice 'other' option responses in a dataset are within length limits.
 *
 * @param options — Object containing responseData, surveyQuestions, and responseLanguage
 * @returns — The questionId of the first violation, or undefined if all pass
 */
export const validateOtherOptionLengthForMultipleChoice = ({
  responseData,
  surveyQuestions,
  responseLanguage,
}: {
  responseData?: TResponseData;
  surveyQuestions: TQuestionWithOtherOptionValidation[];
  responseLanguage?: string;
}): string | undefined => {
  if (!responseData) return undefined;
  for (const [questionId, answer] of Object.entries(responseData)) {
    const question = surveyQuestions.find((q) => q.id === questionId);
    if (!question) continue;

    const isMultiChoice = question.type === "multipleChoiceMulti" || question.type === "multipleChoiceSingle";

    if (!isMultiChoice || !question.choices) continue;

    const error = validateAnswer(answer, question.choices, questionId, responseLanguage);
    if (error) return error;
  }

  return undefined;
};

function validateAnswer(
  answer: unknown,
  choices: unknown[],
  questionId: string,
  language?: string
): string | undefined {
  if (typeof answer === "string") {
    return validateOtherOptionLength(answer, choices, questionId, language);
  }

  if (Array.isArray(answer)) {
    for (const item of answer) {
      if (typeof item === "string") {
        const result = validateOtherOptionLength(item, choices, questionId, language);
        if (result) return result;
      }
    }
  }

  return undefined;
}
