/** Known experience management (XM) template IDs for quick-start survey types. */
export const XM_TEMPLATE_IDS = ["nps", "star-rating", "csat", "ces", "smileys", "enps"] as const;

export type TXMTemplateId = (typeof XM_TEMPLATE_IDS)[number];
