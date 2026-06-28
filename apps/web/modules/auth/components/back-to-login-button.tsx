import Link from "next/link";
import { getTranslate } from "@/lingodotdev/server";
import { Button } from "@/modules/ui/components/button";

/**
 * Server-rendered "Back to Login" button used on post-sign-up pages
 * (verification requested, sign-up success, etc.). Uses the Lingodotdev
 * i18n server function so translations are rendered at request time.
 */
export const BackToLoginButton = async () => {
  const t = await getTranslate();
  return (
    <Button variant="default" className="w-full justify-center">
      <Link href="/auth/login" className="h-full w-full">
        {t("auth.signup.log_in")}
      </Link>
    </Button>
  );
};
