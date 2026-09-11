/**
 * Layout for the account settings route group under `/workspaces/[workspaceId]/settings/account/*`.
 * Passes children through; the sidebar is handled by the parent settings layout.
 */
const AccountSettingsLayout = async (
  props: Readonly<{
    params: Promise<{ workspaceId: string }>;
    children: React.ReactNode;
  }>
) => {
  await props.params;
  return <>{props.children}</>;
};

export default AccountSettingsLayout;
