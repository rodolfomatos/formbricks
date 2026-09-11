import { ConfirmationPage } from "@/app/(app)/billing-confirmation/components/ConfirmationPage";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";

export const dynamic = "force-dynamic";

/**
 * Route: `/billing-confirmation` (authenticated).
 * Shows a success confirmation page after a billing plan upgrade.
 * Requires an active session; redirects to login otherwise via the parent layout.
 */
const Page = async () => {
  return (
    <PageContentWrapper>
      <ConfirmationPage />
    </PageContentWrapper>
  );
};

export default Page;
