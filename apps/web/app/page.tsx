import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OIDC_DISPLAY_NAME, OIDC_OAUTH_ENABLED, OIDC_ONLY, WEBAPP_URL } from "@/lib/constants";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { Button } from "@/modules/ui/components/button";

/**
 * Route: `/` (root). Public landing page for unauthenticated users.
 * Authenticated users are redirected to the app dashboard.
 */
const Page = async () => {
  const session: Session | null = await getServerSession(authOptions);

  if (session) {
    return redirect("/app");
  }

  const oidcEnabled = OIDC_ONLY && OIDC_OAUTH_ENABLED;
  const oidcLabel = OIDC_DISPLAY_NAME || "OpenID Connect";

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#D9F6F4] to-white dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-brand" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span className="text-xl font-bold text-slate-900 dark:text-white">Formbricks</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/docs"
              className="hover:text-brand-dark text-sm text-slate-600 dark:text-slate-400 dark:hover:text-brand">
              Docs
            </Link>
            <Link
              href="/privacy"
              className="hover:text-brand-dark text-sm text-slate-600 dark:text-slate-400 dark:hover:text-brand">
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-brand-dark text-sm text-slate-600 dark:text-slate-400 dark:hover:text-brand">
              Terms
            </Link>
            <Link
              href="/auth/login"
              className="hover:text-brand-dark text-sm font-medium text-slate-700 dark:text-slate-300 dark:hover:text-brand">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold leading-tight text-slate-900 dark:text-white sm:text-5xl">
            Experience Management
            <br />
            that puts users first
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
            Create beautiful surveys, analyze feedback in real-time, and close the loop with your users. Open
            source, self-hosted, and built for privacy.
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-500">
            <strong>Your data, your rules.</strong> Formbricks runs entirely on your infrastructure — no
            vendor lock-in, no data leaving your servers.
          </p>

          {oidcEnabled && (
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                className="w-full sm:w-auto"
                size="lg"
                onClick={() =>
                  (window.location.href = `${WEBAPP_URL}/api/auth/signin/openid?callbackUrl=${encodeURIComponent("/app")}`)
                }>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                Continue with {oidcLabel}
              </Button>
              <Link
                href="/features"
                className="text-brand-dark inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors hover:bg-brand-50 dark:text-brand dark:hover:bg-brand-900/20 sm:w-auto">
                View features
              </Link>
            </div>
          )}

          {!oidcEnabled && (
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/auth/login"
                className="bg-brand-dark inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand sm:w-auto">
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                Sign in to continue
              </Link>
              <Link
                href="/features"
                className="text-brand-dark inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors hover:bg-brand-50 dark:text-brand dark:hover:bg-brand-900/20 sm:w-auto">
                View features
              </Link>
            </div>
          )}

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-brand">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-brand">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-12 dark:border-slate-800 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Self-hosted / AGPL v3
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            GDPR compliant
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 015.656 0l4-4z"
              />
            </svg>
            No vendor lock-in
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Extensible & API-first
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
            Everything you need to understand your users
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Powerful features built for modern product teams — all included, no enterprise gatekeeping.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <article className="rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <svg
                className="text-brand-dark h-6 w-6 dark:text-brand"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Smart Surveys</h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              Create beautiful, branded surveys with branching logic, multiple question types, and real-time
              preview. Embed anywhere with a single line of code.
            </p>
          </article>

          {/* Feature 2 */}
          <article className="rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <svg
                className="text-brand-dark h-6 w-6 dark:text-brand"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Real-time Analytics</h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              Dashboards with response trends, NPS/CSAT scores, segment breakdowns, and AI-powered insights.
              Export to CSV or connect your BI tools.
            </p>
          </article>

          {/* Feature 3 */}
          <article className="rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <svg
                className="text-brand-dark h-6 w-6 dark:text-brand"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">User Segmentation</h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              Target surveys by user attributes, behavior, or custom events. Contact management with segments,
              tags, and automated workflows.
            </p>
          </article>

          {/* Feature 4 */}
          <article className="rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <svg
                className="text-brand-dark h-6 w-6 dark:text-brand"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">SSO & Compliance</h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              OIDC, SAML 2.0, Google, GitHub, Azure AD. TOTP 2FA, audit logs, data residency controls.
              Enterprise security without the enterprise price.
            </p>
          </article>

          {/* Feature 5 */}
          <article className="rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <svg
                className="text-brand-dark h-6 w-6 dark:text-brand"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">
              White-label & Branding
            </h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              Remove Formbricks branding, customize emails, favicon, colors, and domains. Your surveys look
              100% like your product.
            </p>
          </article>

          {/* Feature 6 */}
          <article className="rounded-xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <svg
                className="text-brand-dark h-6 w-6 dark:text-brand"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">API & Integrations</h3>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              REST API, webhooks, and native integrations with Slack, Notion, Google Sheets, and more.
              Automate workflows with your stack.
            </p>
          </article>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl rounded-2xl bg-slate-50 px-4 py-20 dark:bg-slate-900/50 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white">
            Ready to understand your users better?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Join thousands of product teams using Formbricks. Self-host in minutes with Docker.
          </p>
          {oidcEnabled ? (
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() =>
                (window.location.href = `${WEBAPP_URL}/api/auth/signin/openid?callbackUrl=${encodeURIComponent("/app")}`)
              }>
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              Get started with {oidcLabel}
            </Button>
          ) : (
            <Link
              href="/auth/login"
              className="bg-brand-dark inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-brand">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              Sign in to start
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-12 dark:border-slate-800 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/features" className="hover:text-brand">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-brand">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-brand">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-brand">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/about" className="hover:text-brand">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-brand">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-brand">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-brand">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-brand">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-brand">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-slate-900 dark:text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/community" className="hover:text-brand">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/github" className="hover:text-brand">
                  GitHub
                </Link>
              </li>
              <li>
                <Link href="/discord" className="hover:text-brand">
                  Discord
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-brand">
                  Status
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-500 dark:border-slate-800">
          <p>&copy; {new Date().getFullYear()} Formbricks. Open source under AGPL v3.</p>
        </div>
      </footer>
    </main>
  );
};

export default Page;
