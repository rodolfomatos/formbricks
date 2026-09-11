/**
 * Integration service for Notion.
 *
 * Provides database discovery (searching accessible Notion databases) and data
 * writing (creating pages in a chosen database). Authentication uses encrypted
 * OAuth tokens that are decrypted on each request.
 */
import { TIntegrationNotionConfig, TIntegrationNotionDatabase } from "@formbricks/types/integration/notion";
import { ENCRYPTION_KEY } from "@/lib/constants";
import { symmetricDecrypt } from "@/lib/crypto";
import { getIntegrationByType } from "../integration/service";

const fetchPages = async (config: TIntegrationNotionConfig) => {
  try {
    const res = await fetch("https://api.notion.com/v1/search", {
      headers: getHeaders(config),
      method: "POST",
      body: JSON.stringify({
        page_size: 100,
        filter: {
          value: "database",
          property: "object",
        },
      }),
    });
    return (await res.json()).results;
  } catch (error) {
    throw error;
  }
};

/**
 * Lists all Notion databases accessible to the workspace's Notion integration.
 *
 * @param workspaceId — the workspace whose Notion integration to use
 * @returns — array of Notion database objects
 */
export const getNotionDatabases = async (workspaceId: string): Promise<TIntegrationNotionDatabase[]> => {
  let results: TIntegrationNotionDatabase[] = [];
  try {
    const notionIntegration = await getIntegrationByType(workspaceId, "notion");
    if (notionIntegration && notionIntegration.config?.key.bot_id) {
      results = await fetchPages(notionIntegration.config);
    }
    return results;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a new page in the specified Notion database with the given properties.
 *
 * @param databaseId — the Notion database to write into
 * @param properties — page property values keyed by field name
 * @param config — the integration config (provides decrypted access token)
 */
export const writeData = async (
  databaseId: string,
  properties: Record<string, Object>,
  config: TIntegrationNotionConfig
) => {
  try {
    await fetch(`https://api.notion.com/v1/pages`, {
      headers: getHeaders(config),
      method: "POST",
      body: JSON.stringify({
        parent: {
          database_id: databaseId,
        },
        properties: properties,
      }),
    });
  } catch (error) {
    throw error;
  }
};

const getHeaders = (config: TIntegrationNotionConfig) => {
  const decryptedToken = symmetricDecrypt(config.key.access_token, ENCRYPTION_KEY!);
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${decryptedToken}`,
    "Notion-Version": "2022-06-28",
  };
};
