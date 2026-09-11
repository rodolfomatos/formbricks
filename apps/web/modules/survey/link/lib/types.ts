/** Search parameters accepted on the link survey page. Used for single-use, email verification, language, embed, and preview modes. */
export type TLinkSurveySearchParams = {
  suId?: string;
  verify?: string;
  lang?: string;
  embed?: string;
  preview?: string;
  suToken?: string;
} & Record<string, string | string[] | undefined>;
