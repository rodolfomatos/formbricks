/**
 * Client-side wrapper around react-hot-toast's Toaster with themed success/error class names.
 */
"use client";

import { Toaster } from "react-hot-toast";

export const ToasterClient = () => {
  return (
    <Toaster
      toastOptions={{
        success: { className: "formbricks__toast__success" },
        error: {
          className: "formbricks__toast__error",
        },
      }}
    />
  );
};
