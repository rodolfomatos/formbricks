"use client";

export function CreateTeamModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Create Team</h2>
        <p className="text-muted-foreground text-sm">Team creation dialog.</p>
        <button className="mt-4 rounded bg-slate-800 px-4 py-2 text-white" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
