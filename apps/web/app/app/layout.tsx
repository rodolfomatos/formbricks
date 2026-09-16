import { getServerSession } from "next-auth";
import { ChatwootWidget } from "@/app/chatwoot/components/chatwoot-widget";
import { PostHogIdentify } from "@/app/posthog/PostHogIdentify";
import {
  CHATWOOT_BASE_URL,
  CHATWOOT_WEBSITE_TOKEN,
  IS_CHATWOOT_CONFIGURED,
  POSTHOG_KEY,
  SESSION_MAX_AGE,
} from "@/lib/constants";
import { getUser } from "@/lib/user/service";
import { NextAuthProvider } from "@/modules/auth/components/next-auth-provider";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { ClientLogout } from "@/modules/ui/components/client-logout";
import { NoMobileOverlay } from "@/modules/ui/components/no-mobile-overlay";
import { ToasterClient } from "@/modules/ui/components/toaster-client";

/**
 * Layout for the `/app` route — authenticated dashboard entry point.
 * Providers same shell as `(app)` route group.
 */
const AppDashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const user = session?.user?.id ? await getUser(session.user.id) : null;

  if (user?.isActive === false) {
    return <ClientLogout />;
  }

  return (
    <NextAuthProvider sessionMaxAge={SESSION_MAX_AGE}>
      <NoMobileOverlay />
      {POSTHOG_KEY && user && (
        <PostHogIdentify posthogKey={POSTHOG_KEY} userId={user.id} email={user.email} name={user.name} />
      )}
      {IS_CHATWOOT_CONFIGURED && (
        <ChatwootWidget
          userEmail={user?.email}
          userName={user?.name}
          userId={user?.id}
          chatwootWebsiteToken={CHATWOOT_WEBSITE_TOKEN}
          chatwootBaseUrl={CHATWOOT_BASE_URL}
        />
      )}
      <ToasterClient />
      {children}
    </NextAuthProvider>
  );
};

export default AppDashboardLayout;
