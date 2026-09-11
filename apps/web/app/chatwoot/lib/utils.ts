const ONBOARDING_PATHNAME_PATTERN = /^\/organizations\/[^/]+\/(workspaces\/new|landing)(\/|$)/;

/**
 * Returns true if the current pathname matches the onboarding pattern
 * (org landing page or workspace creation).
 */
export const isOnboardingPathname = (pathname: string): boolean => ONBOARDING_PATHNAME_PATTERN.test(pathname);
