import { TFunction } from "i18next";
import { TActionClassInput } from "@formbricks/types/action-classes";

/** Builds an action class object from raw input, dispatching to noCode or code builders based on the type. */
export const buildActionObject = (data: TActionClassInput, workspaceId: string, t: TFunction) => {
  if (data.type === "noCode") {
    return buildNoCodeAction(data, workspaceId, t);
  }
  return buildCodeAction(data, workspaceId, t);
};

/** Builds a noCode action class object, with special handling for click-type selectors (extracting cssSelector and innerHtml). */
export const buildNoCodeAction = (data: TActionClassInput, workspaceId: string, t: TFunction) => {
  if (data.type !== "noCode") {
    throw new Error(t("workspace.actions.invalid_action_type_no_code"));
  }

  const baseAction = {
    name: data.name.trim(),
    description: data.description,
    workspaceId,
    type: "noCode" as const,
    noCodeConfig: data.noCodeConfig,
  };

  if (data.noCodeConfig?.type === "click") {
    return {
      ...baseAction,
      noCodeConfig: {
        ...data.noCodeConfig,
        elementSelector: {
          cssSelector: data.noCodeConfig.elementSelector.cssSelector,
          innerHtml: data.noCodeConfig.elementSelector.innerHtml,
        },
      },
    };
  }

  return baseAction;
};

/** Builds a code-type action class object with trimmed name and the provided key. */
export const buildCodeAction = (data: TActionClassInput, workspaceId: string, t: TFunction) => {
  if (data.type !== "code") {
    throw new Error(t("workspace.actions.invalid_action_type_code"));
  }

  return {
    name: data.name.trim(),
    description: data.description,
    workspaceId,
    type: "code" as const,
    key: data.key,
  };
};
