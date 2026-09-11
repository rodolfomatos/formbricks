"use client";

import { Button } from "@formbricks/ui/components/Button";

export function CreateTeamButton({ onCreateTeam }: { onCreateTeam?: () => void }) {
  return <Button onClick={onCreateTeam}>Create Team</Button>;
}
