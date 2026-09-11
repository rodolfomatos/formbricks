import { NoMobileOverlay } from "@/modules/ui/components/no-mobile-overlay";

/**
 * Root layout for authentication-related routes. Wraps children with a mobile
 * device overlay warning.
 */
const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <NoMobileOverlay />
      {children}
    </>
  );
};

export default AppLayout;
