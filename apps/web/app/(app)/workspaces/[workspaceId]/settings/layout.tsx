/**
 * Layout for the settings route group under `/workspaces/[workspaceId]/settings/*`.
 * Passes children through without adding UI — the sidebar navigation is handled by the parent workspace layout.
 */
const SettingsLayout = (props: { children: React.ReactNode }) => {
  return <>{props.children}</>;
};

export default SettingsLayout;
