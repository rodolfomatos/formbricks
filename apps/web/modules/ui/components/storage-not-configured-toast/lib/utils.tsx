/**
 * Utility to show the storage-not-configured toast with a given variant.
 */
import toast from "react-hot-toast";
import { StorageNotConfiguredToast } from "../index";

export const showStorageNotConfiguredToast = (
  variant: "notConfigured" | "uploadUnavailable" = "notConfigured"
) => {
  return toast.error(() => <StorageNotConfiguredToast variant={variant} />, {
    id: "storage-not-configured-toast",
  });
};
