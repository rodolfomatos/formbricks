/**
 * Type guard that checks whether a condition node is a group (has nested conditions)
 * vs a leaf condition. Used recursively by the ConditionsEditor to render nested groups.
 */
import { TGenericCondition, TGenericConditionGroup } from "@/modules/ui/components/conditions-editor/types";

export const isConditionGroup = (
  condition: TGenericCondition | TGenericConditionGroup
): condition is TGenericConditionGroup => {
  return "conditions" in condition && Array.isArray((condition as TGenericConditionGroup).conditions);
};
