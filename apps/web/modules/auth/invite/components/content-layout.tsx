interface ContentLayoutProps {
  headline: string;
  description: string;
  children?: React.ReactNode;
}

/**
 * Shared layout for invite pages: centered headline + description
 * with optional children (action buttons).  Used for all invite
 * states (not found, expired, wrong email, success).
 */
export const ContentLayout = ({ headline, description, children }: ContentLayoutProps) => {
  return (
    <div className="flex h-screen">
      <div className="m-auto flex flex-col gap-7 text-center text-slate-700">
        <h2 className="text-3xl font-bold">{headline}</h2>
        <p className="text-2xl">{description}</p>
        <div className="flex justify-center gap-5 text-xs">{children}</div>
      </div>
    </div>
  );
};
