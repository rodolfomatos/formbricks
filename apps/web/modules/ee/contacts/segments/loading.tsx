export const SegmentsLoading = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-slate-200" />
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-md border bg-slate-100" />
        ))}
      </div>
    </div>
  );
};

export default SegmentsLoading;
