import { afterEach, describe, expect, test, vi } from "vitest";
import { prisma } from "@formbricks/database";
import { getTeamRoleByTeamIdUserId, getWorkspacePermissionByUserId } from "./roles";

vi.mock("@formbricks/database", () => ({
  prisma: {
    teamUser: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe("roles guards", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("getWorkspacePermissionByUserId returns null on missing userId without hitting prisma", async () => {
    const result = await getWorkspacePermissionByUserId("", "ws-1");
    expect(result).toBeNull();
    expect(prisma.teamUser.findFirst).not.toHaveBeenCalled();
  });

  test("getWorkspacePermissionByUserId returns null on missing workspaceId without hitting prisma", async () => {
    const result = await getWorkspacePermissionByUserId("u-1", undefined as unknown as string);
    expect(result).toBeNull();
    expect(prisma.teamUser.findFirst).not.toHaveBeenCalled();
  });

  test("getWorkspacePermissionByUserId queries prisma with caller-order args (userId, workspaceId)", async () => {
    vi.mocked(prisma.teamUser.findFirst).mockResolvedValue({
      team: { workspaceTeams: [{ permission: "readWrite" }] },
    } as never);
    await getWorkspacePermissionByUserId("u-1", "ws-1");
    expect(prisma.teamUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "u-1" }) })
    );
  });

  test("getTeamRoleByTeamIdUserId returns null on missing teamId without hitting prisma", async () => {
    const result = await getTeamRoleByTeamIdUserId("", "u-1");
    expect(result).toBeNull();
    expect(prisma.teamUser.findUnique).not.toHaveBeenCalled();
  });

  test("getTeamRoleByTeamIdUserId returns null on missing userId without hitting prisma", async () => {
    const result = await getTeamRoleByTeamIdUserId("t-1", undefined as unknown as string);
    expect(result).toBeNull();
    expect(prisma.teamUser.findUnique).not.toHaveBeenCalled();
  });

  test("getTeamRoleByTeamIdUserId queries prisma with caller-order args (teamId, userId)", async () => {
    vi.mocked(prisma.teamUser.findUnique).mockResolvedValue({ role: "admin" } as never);
    await getTeamRoleByTeamIdUserId("t-1", "u-1");
    expect(prisma.teamUser.findUnique).toHaveBeenCalledWith({
      where: {
        teamId_userId: { teamId: "t-1", userId: "u-1" },
      },
      select: { role: true },
    });
  });
});