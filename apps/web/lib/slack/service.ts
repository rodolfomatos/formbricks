/**
 * Integration service for Slack.
 *
 * Discovers accessible Slack channels (public + private) via paginated API calls,
 * and posts survey response data as richly-formatted Slack messages with
 * Q&A blocks. If the token has expired, the integration record is deleted so
 * the user can re-authorise.
 */
import { Prisma } from "@formbricks/database/prisma";
import { DatabaseError, UnknownError } from "@formbricks/types/errors";
import { TIntegration, TIntegrationItem } from "@formbricks/types/integration";
import { TIntegrationSlackCredential } from "@formbricks/types/integration/slack";
import { SLACK_MESSAGE_LIMIT } from "../constants";
import { deleteIntegration, getIntegrationByType } from "../integration/service";
import { truncateText } from "../utils/strings";

/**
 * Fetches all Slack channels the bot has access to, handling pagination.
 * If the token has expired, the integration record is auto-deleted.
 *
 * @param slackIntegration — the Slack integration config with OAuth credentials
 * @returns — array of channel { name, id } items
 */
export const fetchChannels = async (slackIntegration: TIntegration): Promise<TIntegrationItem[]> => {
  let channels: TIntegrationItem[] = [];
  // `nextCursor` is a pagination token returned by the Slack API. It indicates the presence of additional pages of data.
  // When `nextCursor` is not empty, it should be included in subsequent requests to fetch the next page of data.
  let nextCursor: string | undefined = undefined;

  do {
    const url = new URL("https://slack.com/api/users.conversations");
    url.searchParams.append("limit", "200");
    url.searchParams.append("types", "private_channel,public_channel");
    if (nextCursor) {
      url.searchParams.append("cursor", nextCursor);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${slackIntegration.config.key.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (!data.ok) {
      if (data.error === "token_expired") {
        // Temporary fix to reset integration if token rotation is enabled
        await deleteIntegration(slackIntegration.id);
      }
      throw new Error(data.error);
    }

    channels = channels.concat(
      data.channels.map((channel: { name: string; id: string }) => ({
        name: channel.name,
        id: channel.id,
      }))
    );

    nextCursor = data.response_metadata?.next_cursor;
  } while (nextCursor);

  return channels;
};

/**
 * Lists all Slack channels available to the workspace's Slack integration.
 *
 * @param workspaceId — the workspace whose Slack integration to use
 * @returns — array of Slack channels
 */
export const getSlackChannels = async (workspaceId: string): Promise<TIntegrationItem[]> => {
  let channels: TIntegrationItem[] = [];
  try {
    const slackIntegration = await getIntegrationByType(workspaceId, "slack");
    if (slackIntegration && slackIntegration.config?.key) {
      channels = await fetchChannels(slackIntegration);
    }

    return channels;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError("Database operation failed");
    }
    throw new UnknownError(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Posts a survey response to a Slack channel as a series of Q&A blocks.
 * Long responses are truncated to the Slack message limit.
 *
 * @param credentials — the OAuth credentials
 * @param channelId — the target Slack channel
 * @param responses — response values, one per element
 * @param elements — question headlines
 * @param surveyName — the survey title (displayed at the top)
 */
export const writeDataToSlack = async (
  credentials: TIntegrationSlackCredential,
  channelId: string,
  responses: string[],
  elements: string[],
  surveyName: string | undefined
) => {
  try {
    let blockResponse = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${surveyName}\n`,
        },
      },
      {
        type: "divider",
      },
    ];
    for (let i = 0; i < responses.length; i++) {
      let questionSection = {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${elements[i]}*`,
        },
      };
      const responseText = responses[i];
      const text =
        responseText.length > SLACK_MESSAGE_LIMIT
          ? truncateText(responseText, SLACK_MESSAGE_LIMIT)
          : responseText;
      let responseSection = {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${text}\n`,
        },
      };
      blockResponse.push(questionSection, responseSection);
    }

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        blocks: blockResponse,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError("Database operation failed");
    }
    throw error;
  }
};
