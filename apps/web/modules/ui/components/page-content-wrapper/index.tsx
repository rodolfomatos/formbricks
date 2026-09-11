/**
 * Wraps page content with standard vertical spacing and horizontal padding.
 * Used as a consistent layout wrapper for page-level content areas.
 */
import { cn } from "@/lib/cn";

interface PageContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContentWrapper = ({ children, className }: PageContentWrapperProps) => {
  return <div className={cn("min-h-full space-y-6 p-6", className)}>{children}</div>;
};
