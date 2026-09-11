"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

/**
 * Global error boundary rendered outside the root layout (Next.js special file).
 * Reports the error to Sentry and shows a bare-bones fallback page.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error.message);
    } else {
      Sentry.captureException(error);
    }
  }, [error]);
  return (
    <html lang="en-US">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
