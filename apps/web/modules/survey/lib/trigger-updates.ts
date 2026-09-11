import { InvalidInputError } from "@formbricks/types/errors";

interface TriggerActionClass {
  id: string;
}

export interface TriggerUpdate {
  create?: Array<{ actionClassId: string }>;
  deleteMany?: {
    actionClassId: {
      in: string[];
    };
  };
}

/** Extracts an array of actionClass IDs from a trigger list. Returns null for falsy input. */
export const getTriggerIds = (triggers: unknown): string[] | null => {
  if (!triggers) return null;
  if (!Array.isArray(triggers)) {
    throw new InvalidInputError("Invalid trigger id");
  }

  return triggers.map((trigger) => {
    const actionClassId = (trigger as { actionClass?: { id?: unknown } })?.actionClass?.id;
    if (typeof actionClassId !== "string") {
      throw new InvalidInputError("Invalid trigger id");
    }

    return actionClassId;
  });
};

/** Validates trigger IDs exist in the available action classes and have no duplicates. */
export const checkTriggersValidity = (triggers: unknown, actionClasses: TriggerActionClass[]): void => {
  const triggerIds = getTriggerIds(triggers);
  if (!triggerIds) return;

  triggerIds.forEach((triggerId) => {
    if (!actionClasses.some((actionClass) => actionClass.id === triggerId)) {
      throw new InvalidInputError("Invalid trigger id");
    }
  });

  if (new Set(triggerIds).size !== triggerIds.length) {
    throw new InvalidInputError("Duplicate trigger id");
  }
};

/** Computes the Prisma update payload (creates and deletes) to reconcile current triggers with updated trigger selections. */
export const handleTriggerUpdates = (
  updatedTriggers: unknown,
  currentTriggers: unknown,
  actionClasses: TriggerActionClass[]
): TriggerUpdate => {
  const updatedTriggerIds = getTriggerIds(updatedTriggers);
  if (!updatedTriggerIds) return {};

  checkTriggersValidity(updatedTriggers, actionClasses);

  const currentTriggerIds = getTriggerIds(currentTriggers) ?? [];
  const addedTriggerIds = updatedTriggerIds.filter((triggerId) => !currentTriggerIds.includes(triggerId));
  const deletedTriggerIds = currentTriggerIds.filter((triggerId) => !updatedTriggerIds.includes(triggerId));
  const triggersUpdate: TriggerUpdate = {};

  if (addedTriggerIds.length > 0) {
    triggersUpdate.create = addedTriggerIds.map((triggerId) => ({
      actionClassId: triggerId,
    }));
  }

  if (deletedTriggerIds.length > 0) {
    triggersUpdate.deleteMany = {
      actionClassId: {
        in: deletedTriggerIds,
      },
    };
  }

  return triggersUpdate;
};
