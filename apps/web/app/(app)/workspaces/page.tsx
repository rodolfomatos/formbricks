import { redirect } from "next/navigation";

/**
 * Route: `/workspaces` (authenticated).
 * Redirects to the root page. Exists as a catch-all for the workspaces route group root.
 */
const Page = () => {
  return redirect("/");
};

export default Page;
