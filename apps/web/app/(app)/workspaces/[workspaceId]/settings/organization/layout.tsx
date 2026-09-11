/**
 * Layout for the organization settings route group.
 * Passes children through without adding UI; the sidebar is handled by the parent settings layout.
 */
const OrganizationSettingsLayout = (props: { children: React.ReactNode }) => {
  return <>{props.children}</>;
};

export default OrganizationSettingsLayout;
