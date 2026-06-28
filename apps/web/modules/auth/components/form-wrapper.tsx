import Link from "next/link";
import { Logo } from "@/modules/ui/components/logo";

interface FormWrapperProps {
  children: React.ReactNode;
}

/**
 * Shared layout wrapper for all auth pages (login, sign-up, forgot-password,
 * verification, etc.). Renders the Formbricks logo centered above the content
 * inside a white card on a muted background. The logo links to formbricks.com
 * (external, new tab) for brand attribution.
 */
export const FormWrapper = ({ children }: Readonly<FormWrapperProps>) => {
  return (
    <div className="mx-auto flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
      <div className="mx-auto w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl lg:w-96">
        <div className="mb-8 text-center">
          <Link target="_blank" href="https://formbricks.com?utm_source=ce" rel="noopener noreferrer">
            <Logo className="mx-auto w-3/4" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
};
