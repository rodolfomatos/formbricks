/**
 * Service layer for third-party Integrations (Google Sheets, Slack, Airtable, Notion, etc.).
 *
 * Each workspace can have at most one integration of each type; the service uses
 * Prisma's `upsert` for create-or-update semantics. Integration configs are returned
 * with dates materialised into Date objects (they arrive as ISO strings from Prisma).
 */
import "server-only";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { Prisma } from "@formbricks/database/prisma";
import { logger } from "@formbricks/logger";
import { ZId, ZOptionalNumber, ZString } from "@formbricks/types/common";
import { DatabaseError } from "@formbricks/types/errors";
import {
  TIntegration,
  TIntegrationByType,
  TIntegrationInput,
  ZIntegrationType,
} from "@formbricks/types/integration";
import { ITEMS_PER_PAGE } from "../constants";
import { validateInputs } from "../utils/validate";

const transformIntegration = (integration: TIntegration): TIntegration => {
  return {
    ...integration,
    config: {
      ...integration.config,
      data: integration.config.data.map((data) => ({
        ...data,
        createdAt: new Date(data.createdAt),
      })),
    },
  } as TIntegration;
};

/**
 * Creates or updates an integration for a workspace (one per type).
 * If an integration of the same type already exists, its config is replaced.
 *
 * @param workspaceId — the owning workspace
 * @param integrationData — the integration input (type + config)
 * @returns — the saved integration
 */
export const createOrUpdateIntegration = async (
  workspaceId: string,
  integrationData: TIntegrationInput
): Promise<TIntegration> => {
  validateInputs([workspaceId, ZId]);

  try {
    const integration = await prisma.integration.upsert({
      where: {
        type_workspaceId: {
          workspaceId,
          type: integrationData.type,
        },
      },
      update: {
        ...integrationData,
        workspace: { connect: { id: workspaceId } },
      },
      create: {
        ...integrationData,
        workspace: { connect: { id: workspaceId } },
      },
    });
    return integration;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      logger.error(error, "Error creating or updating integration");
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};

/**
 * Lists all integrations for a workspace with optional pagination.
 *
 * @param workspaceId — the workspace to query
 * @param page — page number (1-based); omit for all results
 * @returns — paginated array of integrations
 */
export const getIntegrations = reactCache(
  async (workspaceId: string, page?: number): Promise<TIntegration[]> => {
    validateInputs([workspaceId, ZId], [page, ZOptionalNumber]);

    try {
      const integrations = await prisma.integration.findMany({
        where: {
          workspaceId,
        },
        take: page ? ITEMS_PER_PAGE : undefined,
        skip: page ? ITEMS_PER_PAGE * (page - 1) : undefined,
      });
      return integrations.map((integration) => transformIntegration(integration));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error.message);
      }
      throw error;
    }
  }
);

/**
 * Retrieves a single integration by its ID.
 *
 * @param integrationId — the integration to fetch
 * @returns — the integration, or null
 */
export const getIntegration = reactCache(async (integrationId: string): Promise<TIntegration | null> => {
  try {
    const integration = await prisma.integration.findUnique({
      where: {
        id: integrationId,
      },
    });
    return integration ? transformIntegration(integration) : null;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw error;
  }
});

/**
 * Retrieves the single integration of a given type for a workspace (e.g. the Slack integration).
 *
 * @param workspaceId — the workspace
 * @param type — the integration type
 * @returns — the typed integration, or null
 */
export const getIntegrationByType = reactCache(
  async <T extends TIntegrationInput["type"]>(
    workspaceId: string,
    type: T
  ): Promise<TIntegrationByType<T> | null> => {
    validateInputs([workspaceId, ZId], [type, ZIntegrationType]);

    try {
      const integration = await prisma.integration.findFirst({
        where: {
          workspaceId,
          type,
        },
      });
      return integration ? (transformIntegration(integration) as TIntegrationByType<T>) : null;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error.message);
      }
      throw error;
    }
  }
);

/**
 * Deletes an integration by ID.
 *
 * @param integrationId — the integration to remove
 * @returns — the deleted integration
 */
export const deleteIntegration = async (integrationId: string): Promise<TIntegration> => {
  validateInputs([integrationId, ZString]);

  try {
    const integrationData = await prisma.integration.delete({
      where: {
        id: integrationId,
      },
    });

    return integrationData;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }

    throw error;
  }
};
