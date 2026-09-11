export const CSV_IMPORT_MISSING_COLUMNS_ERROR_CODE = "CSV_IMPORT_MISSING_COLUMNS" as const;

export type TFeedbackSource = {
  id: string;
  name: string;
  type: "csv" | "webhook" | "email" | "slack";
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TFeedbackSourceMapping = {
  id: string;
  sourceId: string;
  sourceField: string;
  formbricksField: string;
};
