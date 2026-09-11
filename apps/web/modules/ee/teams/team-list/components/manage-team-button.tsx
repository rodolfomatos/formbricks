"use client";

import { Button } from "@formbricks/ui/components/Button";

export function ManageTeamButton({ teamId }: { teamId: string }) {
  return <Button variant="secondary">{teamId ? "Manage Team" : "Manage"}</Button>;
}
