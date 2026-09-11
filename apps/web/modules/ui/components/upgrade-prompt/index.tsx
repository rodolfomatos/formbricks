/**
 * UpgradePrompt
 *
 * Upstream renders this card when a user hits a feature gated behind a paid tier or
 * an Enterprise license. In this AGPL fork every feature is available without a key,
 * so there is no upgrade path and the card would be misleading marketing UI.
 *
 * Neutering approach (same as the T026 telemetry stub): the component keeps its full
 * prop signature so all existing callers compile unchanged, but renders nothing.
 * The `buttons` and `feature` props are intentionally ignored.
 */
"use client";

interface UpgradePromptProps {
  title: string;
  description?: string;
  buttons: readonly [UpgradePromptButton, UpgradePromptButton];
  feature?: string;
}

interface UpgradePromptButton {
  text: string;
  href?: string;
  onClick?: () => void;
}

export const UpgradePrompt = (_props: UpgradePromptProps) => null;
