export const TAuditAction = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  READ: "read",
  INVITE: "invite",
  REMOVE: "remove",
  LEAVE: "leave",
  TRANSFER: "transfer",
  ENABLE: "enable",
  DISABLE: "disable",
  LOGIN: "login",
  LOGOUT: "logout",
  EXPORT: "export",
  CLONE: "clone",
} as const;

export type TAuditAction = (typeof TAuditAction)[keyof typeof TAuditAction];

export const TAuditTarget = {
  SURVEY: "survey",
  RESPONSE: "response",
  WORKSPACE: "workspace",
  ORGANIZATION: "organization",
  USER: "user",
  TEAM: "team",
  MEMBERSHIP: "membership",
  API_KEY: "apiKey",
  WEBHOOK: "webhook",
  CONTACT: "contact",
  SEGMENT: "segment",
  INTEGRATION: "integration",
  ACTION: "action",
  INVITE: "invite",
  BILLING: "billing",
  NOTION: "notion",
} as const;

export type TAuditTarget = (typeof TAuditTarget)[keyof typeof TAuditTarget];

export const TAuditStatus = {
  SUCCESS: "success",
  FAILURE: "failure",
  PENDING: "pending",
} as const;

export type TAuditStatus = (typeof TAuditStatus)[keyof typeof TAuditStatus];

export const UNKNOWN_DATA = "unknown";
