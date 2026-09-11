"use client";

export function AddMemberRole({ value, onChange }: { value?: string; onChange?: (role: string) => void }) {
  return (
    <select
      className="w-full rounded-md border p-2 text-sm"
      value={value ?? "admin"}
      onChange={(e) => onChange?.(e.target.value)}>
      <option value="admin">Admin</option>
      <option value="contributor">Contributor</option>
    </select>
  );
}
