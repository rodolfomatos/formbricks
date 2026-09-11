import { TResponse, TResponseDataValue } from "@formbricks/types/responses";
import { TSurveyElement, TSurveyElementTypeEnum } from "@formbricks/types/surveys/elements";
import { TSurvey } from "@formbricks/types/surveys/types";
import { getTextContent } from "@formbricks/types/surveys/validation";
import { parseRecallInfo } from "@/lib/utils/recall";
import { getElementsFromBlocks } from "@/modules/survey/lib/client-utils";
import { getLanguageCode, getLocalizedValue } from "./i18n/utils";

/** Survey shape needed by `getElementResponseMapping` — only blocks and languages matter for mapping responses back to question elements. */
export type TElementResponseMappingSurvey = Pick<TSurvey, "blocks" | "languages">;

/**
 * Normalises a raw response value to a flat string or string array per element type.
 * Each question type stores data differently (ranking → array, pictureSelection → image URLs, etc.);
 * this abstracts those differences so downstream consumers always get a uniform shape.
 *
 * @param answer — the raw response value from the database
 * @param element — the survey element the answer belongs to (determines how to interpret)
 * @returns — normalised string or array of strings
 *
 * @example
 * ```typescript
 * convertResponseValue(["a", "b"], { type: "ranking", choices: [...] })
 * // => ["a", "b"]
 * ```
 */
export const convertResponseValue = (
  answer: TResponseDataValue,
  element: TSurveyElement
): string | string[] => {
  switch (element.type) {
    case "ranking":
    case "fileUpload":
      if (typeof answer === "string") {
        return [answer];
      } else return answer as string[];

    case "pictureSelection":
      if (typeof answer === "string") {
        const imageUrl = element.choices.find((choice) => choice.id === answer)?.imageUrl;
        return imageUrl ? [imageUrl] : [];
      } else if (Array.isArray(answer)) {
        return answer
          .map((answerId) => element.choices.find((choice) => choice.id === answerId)?.imageUrl)
          .filter((url): url is string => url !== undefined);
      } else return [];

    default:
      return processResponseData(answer);
  }
};

/**
 * Maps every element in a survey to the respondent's answer for that element.
 * Used by exports, response detail views, and email notifications to produce a
 * flat list of question-answer pairs independent of survey structure.
 *
 * @param survey — the survey (only blocks and languages needed)
 * @param response — the full response object containing answer data
 * @returns — array of { element headline, response value, element type }
 */
export const getElementResponseMapping = (
  survey: TElementResponseMappingSurvey,
  response: TResponse
): { element: string; response: string | string[]; type: TSurveyElementTypeEnum }[] => {
  const elementResponseMapping: {
    element: string;
    response: string | string[];
    type: TSurveyElementTypeEnum;
  }[] = [];
  const responseLanguageCode = getLanguageCode(survey.languages, response.language);

  const elements = getElementsFromBlocks(survey.blocks);

  for (const element of elements) {
    const answer = response.data[element.id];

    elementResponseMapping.push({
      element: getTextContent(
        parseRecallInfo(getLocalizedValue(element.headline, responseLanguageCode ?? "default"), response.data)
      ),
      response: convertResponseValue(answer, element),
      type: element.type,
    });
  }

  return elementResponseMapping;
};

/**
 * Converts any response data value into a flat string representation.
 * Handles plain strings, numbers, arrays (joined by "; "), and objects ("key: value" lines)
 * so every answer type can be rendered in a single-line or CSV context.
 *
 * @param responseData — the raw value to convert
 * @returns — flat string representation
 *
 * @example
 * ```typescript
 * processResponseData({ en: "Hello", fr: "Bonjour" })
 * // => "en: Hello\nfr: Bonjour"
 * ```
 */
export const processResponseData = (responseData: TResponseDataValue): string => {
  switch (typeof responseData) {
    case "string":
      return responseData;

    case "number":
      return responseData.toString();

    case "object":
      if (Array.isArray(responseData)) {
        responseData = responseData
          .filter((item) => item !== null && item !== undefined && item !== "")
          .join("; ");
        return responseData;
      } else {
        const formattedString = Object.entries(responseData)
          .filter(([_, value]) => value !== "")
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        return formattedString;
      }

    default:
      return "";
  }
};
