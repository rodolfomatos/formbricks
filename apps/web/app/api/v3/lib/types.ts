import type { Session } from "next-auth";
import type { TAuthenticationApiKey } from "@formbricks/types/auth";
import type { TApiAuditLog } from "@/app/lib/api/with-api-logging";

/** Union of v3 authentication possibilities: API key, session, or unauthenticated. */
export type TV3Authentication = TAuthenticationApiKey | Session | null;
/** v3 audit log shape, same as the shared API audit log. */
export type TV3AuditLog = TApiAuditLog;
