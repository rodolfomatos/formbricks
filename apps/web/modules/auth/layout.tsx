import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { getIsFreshInstance } from "@/lib/instance/service";
import { authOptions } from "@/modules/auth/lib/authOptions";

/**
 * Shared auth layout: redirects authenticated users to `/`, redirects
 * fresh (unconfigured) single-org instances to `/setup/intro`, and wraps
 * all auth pages in a centered card layout with toast support.
 */
export const AuthLayout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const [session, isFreshInstance] = await Promise.all([
    getServerSession(authOptions),
    getIsFreshInstance(),
  ]);

  if (session) {
    redirect(`/`);
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-slate-50">
        <div className="isolate bg-white">
          <div className="flex min-h-screen bg-gradient-radial from-slate-200 to-slate-50">{children}</div>
        </div>
      </div>
    </>
  );
};
