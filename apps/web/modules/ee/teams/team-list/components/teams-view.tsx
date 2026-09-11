import type { TOrganizationTeam } from "../types/team";

export function TeamsView({ teams }: { teams: TOrganizationTeam[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Teams</h2>
      {teams.length === 0 ? (
        <p className="text-muted-foreground text-sm">No teams found.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {teams.map((team) => (
            <li key={team.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{team.name}</p>
                <p className="text-muted-foreground text-sm">{team.memberCount} members</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
