import { TSurveyElementTypeEnum } from "@formbricks/types/surveys/elements";

/**
 * A single survey response element rendered in follow-up emails — includes
 * the element label, the respondent's answer(s), and the element type for
 * specialised rendering (e.g. file upload, picture selection).
 */
export interface ProcessedResponseElement {
  element: string;
  response: string | string[];
  type: TSurveyElementTypeEnum;
}

/**
 * A resolved survey variable rendered in follow-up emails.
 */
export interface ProcessedVariable {
  id: string;
  name: string;
  type: "text" | "number";
  value: string | number;
}

/**
 * A resolved hidden field value included in follow-up email context.
 */
export interface ProcessedHiddenField {
  id: string;
  value: string;
}
