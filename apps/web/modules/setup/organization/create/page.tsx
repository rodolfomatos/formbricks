import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { AuthenticationError } from "@formbricks/types/errors";
import { getUser } from "@/lib/user/service";
import { getTranslate } from "@/lingodotdev/server";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { ClientLogout } from "@/modules/ui/components/client-logout";
import { CreateOrganization } from "./components/create-organization";

export const metadata: Metadata = {
  title: "Create Organization",
  description: "Open-source Experience Management. Free & open source.",
};

/** Serves the `/setup/organization/create` route — allows a user to create their first organization or is redirected to a removed-from-org notice if they have no memberships. */
export const CreateOrganizationPage = async () => {
  const t = await getTranslate();
  const session = await getServerSession(authOptions);

  if (!session) throw new AuthenticationError(t("common.session_not_found"));

  const user = await getUser(session.user.id);
  if (!user) {
    return <ClientLogout />;
  }

  return <CreateOrganization />;
};
