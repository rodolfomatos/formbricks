/**
 * Survey utility helpers used internally by the survey service.
 *
 * Handles: Prisma-to-domain survey transformation (numeric decimal conversion,
 * segment surveys list flattening), media validation (image/video URLs in
 * questions and blocks), isDraft-stripping before persistence, and block/element
 * navigation (flat element lists, element location lookups).
 */
import "server-only";
import { Result, err, ok } from "@formbricks/types/error-handlers";
import { InvalidInputError } from "@formbricks/types/errors";
import { TJsWorkspaceStateSurvey } from "@formbricks/types/js";
import { TSegment } from "@formbricks/types/segment";
import { TSurveyBlock } from "@formbricks/types/surveys/blocks";
import {
  TSurveyElement,
  TSurveyElementTypeEnum,
  TSurveyPictureChoice,
} from "@formbricks/types/surveys/elements";
import { TSurvey, TSurveyQuestion, TSurveyQuestionTypeEnum } from "@formbricks/types/surveys/types";
import { isValidVideoUrl } from "@/lib/utils/video-upload";
import { isValidImageFile } from "@/modules/storage/utils";

/**
 * Converts a raw Prisma survey result into the domain type.
 * Handles: displayPercentage decimal→Number, segment surveys list→id array.
 *
 * @param surveyPrisma — the raw Prisma query result
 * @returns — the typed survey
 */
export const transformPrismaSurvey = <T extends TSurvey | TJsWorkspaceStateSurvey>(surveyPrisma: any): T => {
  let segment: TSegment | null = null;

  if (surveyPrisma.segment) {
    segment = {
      ...surveyPrisma.segment,
      surveys: surveyPrisma.segment.surveys.map((survey: { id: string }) => survey.id),
    };
  }

  const transformedSurvey = {
    ...surveyPrisma,
    displayPercentage: Number(surveyPrisma.displayPercentage) || null,
    segment,
    customHeadScriptsMode: surveyPrisma.customHeadScriptsMode,
  } as T;

  return transformedSurvey;
};

/**
 * Checks whether any survey in a list has active segment filters.
 *
 * @param surveys — the survey list
 * @returns — true if at least one survey has non-empty filters
 */
export const anySurveyHasFilters = (surveys: TSurvey[]): boolean => {
  return surveys.some((survey) => {
    if ("segment" in survey && survey.segment) {
      return survey.segment.filters && survey.segment.filters.length > 0;
    }
    return false;
  });
};

/**
 * Validates image URLs in all questions, including picture-selection choice images.
 * Throws InvalidInputError on the first invalid URL found.
 *
 * @param questions — the questions to validate
 */
export const checkForInvalidImagesInQuestions = (questions: TSurveyQuestion[]) => {
  questions.forEach((question, qIndex) => {
    if (question.imageUrl && !isValidImageFile(question.imageUrl)) {
      throw new InvalidInputError(`Invalid image file in question ${String(qIndex + 1)}`);
    }

    if (question.type === TSurveyQuestionTypeEnum.PictureSelection) {
      if (!Array.isArray(question.choices)) {
        throw new InvalidInputError(`Choices missing for question ${String(qIndex + 1)}`);
      }

      question.choices.forEach((choice, cIndex) => {
        if (!isValidImageFile(choice.imageUrl)) {
          throw new InvalidInputError(
            `Invalid image file for choice ${String(cIndex + 1)} in question ${String(qIndex + 1)}`
          );
        }
      });
    }
  });
};

const validateChoiceImage = (
  choice: TSurveyPictureChoice,
  choiceIdx: number,
  elementIdx: number,
  blockName: string
): Result<void, Error> => {
  if (choice.imageUrl && !isValidImageFile(choice.imageUrl)) {
    return err(
      new Error(
        `Invalid image URL in choice ${choiceIdx + 1} of question ${elementIdx + 1} of block "${blockName}"`
      )
    );
  }
  return ok(undefined);
};

const validatePictureSelectionChoiceImages = (
  element: TSurveyElement,
  elementIdx: number,
  blockName: string
): Result<void, Error> => {
  // Only validate choices for picture selection elements
  if (element.type !== TSurveyElementTypeEnum.PictureSelection) {
    return ok(undefined);
  }

  if (!("choices" in element) || !Array.isArray(element.choices)) {
    return ok(undefined);
  }

  for (let choiceIdx = 0; choiceIdx < element.choices.length; choiceIdx++) {
    const result = validateChoiceImage(element.choices[choiceIdx], choiceIdx, elementIdx, blockName);
    if (!result.ok) {
      return result;
    }
  }

  return ok(undefined);
};

const validateElement = (
  element: TSurveyElement,
  elementIdx: number,
  blockIdx: number,
  blockName: string
): Result<void, Error> => {
  // Check element imageUrl
  if (element.imageUrl && !isValidImageFile(element.imageUrl)) {
    return err(
      new Error(
        `Invalid image URL in question ${elementIdx + 1} of block "${blockName}" (block ${blockIdx + 1})`
      )
    );
  }

  // Check element videoUrl
  if (element.videoUrl && !isValidVideoUrl(element.videoUrl)) {
    return err(
      new Error(
        `Invalid video URL in question ${elementIdx + 1} of block "${blockName}" (block ${blockIdx + 1}). Only YouTube, Vimeo, and Loom URLs are supported.`
      )
    );
  }

  // Check choices for picture selection
  return validatePictureSelectionChoiceImages(element, elementIdx, blockName);
};

/**
 * Validates that all media URLs (images and videos) in blocks are valid
 * - Validates element imageUrl
 * - Validates element videoUrl
 * - Validates choice imageUrl for picture selection elements
 * @param blocks - Array of survey blocks to validate
 * @returns Result with void data on success or Error on failure
 */
export const checkForInvalidMediaInBlocks = (blocks: TSurveyBlock[]): Result<void, Error> => {
  for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
    const block = blocks[blockIdx];

    for (let elementIdx = 0; elementIdx < block.elements.length; elementIdx++) {
      const result = validateElement(block.elements[elementIdx], elementIdx, blockIdx, block.name);
      if (!result.ok) {
        return result;
      }
    }
  }

  return ok(undefined);
};

/**
 * Strips isDraft field from elements before saving to database
 * Note: Blocks don't have isDraft since block IDs are CUIDs (not user-editable)
 * Only element IDs need protection as they're user-editable and used in responses
 * @param blocks - Array of survey blocks
 * @returns New array with isDraft stripped from all elements
 */
/**
 * Strips the isDraft flag from all elements before persistence.
 * Blocks don't have isDraft — only element IDs need protection as they're user-editable.
 *
 * @param blocks — the blocks to clean
 * @returns — clean blocks ready for DB
 */
export const stripIsDraftFromBlocks = (blocks: TSurveyBlock[]): TSurveyBlock[] => {
  return blocks.map((block) => ({
    ...block,
    elements: block.elements.map((element) => {
      const { isDraft, ...elementRest } = element;
      return elementRest;
    }),
  }));
};

/**
 * Validates and prepares blocks for persistence
 * - Validates all media URLs (images and videos) in blocks
 * - Strips isDraft flags from elements
 * @param blocks - Array of survey blocks to validate and prepare
 * @returns Prepared blocks ready for database persistence
 * @throws Error if any media validation fails
 */
/**
 * Validates media URLs and strips isDraft in one pass.
 *
 * @param blocks — blocks to validate and prepare
 * @returns — prepared blocks
 */
export const validateMediaAndPrepareBlocks = (blocks: TSurveyBlock[]): TSurveyBlock[] => {
  // Validate media (images and videos)
  const validation = checkForInvalidMediaInBlocks(blocks);
  if (!validation.ok) {
    throw validation.error;
  }

  // Strip isDraft
  return stripIsDraftFromBlocks(blocks);
};

/**
 * Derives a flat array of elements from the survey's blocks structure
 * Useful for server-side processing where we need to iterate over all questions
 * Note: This is duplicated from the client-side survey utils since this file is server-only
 * @param blocks - Array of survey blocks
 * @returns Flat array of all elements across all blocks
 */
/**
 * Derives a flat array of elements from the blocks structure.
 * Duplicated from the client-side survey utils since this file is server-only.
 *
 * @param blocks — the survey blocks
 * @returns — flat element array
 */
export const getElementsFromBlocks = (blocks: TSurveyBlock[]): TSurveyElement[] => {
  return blocks.flatMap((block) => block.elements);
};

/**
 * Find the location of an element within the survey blocks
 * @param survey - The survey object
 * @param elementId - The ID of the element to find
 * @returns Object containing blockId, blockIndex, elementIndex and the block
 */
/**
 * Locates an element within a survey's blocks by its ID.
 *
 * @param survey — the survey
 * @param elementId — the element to find
 * @returns — block/position info (all -1 / null if not found)
 */
export const findElementLocation = (
  survey: TSurvey,
  elementId: string
): { blockId: string | null; blockIndex: number; elementIndex: number; block: TSurveyBlock | null } => {
  const blocks = survey.blocks;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];
    const elementIndex = block.elements.findIndex((e) => e.id === elementId);
    if (elementIndex !== -1) {
      return { blockId: block.id, blockIndex, elementIndex, block };
    }
  }

  return { blockId: null, blockIndex: -1, elementIndex: -1, block: null };
};
