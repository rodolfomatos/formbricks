import { TResponseUpdateInput, ZResponseUpdateInput } from "@formbricks/types/responses";
import {
  TParseAndValidateJsonBodyResult,
  parseAndValidateJsonBody,
} from "@/app/lib/api/parse-and-validate-json-body";

/** Union type representing either a valid parsed input or an error response. */
export type TValidatedResponseUpdateInputResult =
  | { response: Response }
  | { responseUpdateInput: TResponseUpdateInput };

/**
 * Parses and validates the request body as a TResponseUpdateInput against
 * its Zod schema.
 */
export const getValidatedResponseUpdateInput = async (
  req: Request
): Promise<TValidatedResponseUpdateInputResult> => {
  const validatedInput: TParseAndValidateJsonBodyResult<TResponseUpdateInput> =
    await parseAndValidateJsonBody({
      request: req,
      schema: ZResponseUpdateInput,
      malformedJsonMessage: "Malformed JSON in request body",
    });

  if ("response" in validatedInput) {
    return {
      response: validatedInput.response,
    };
  }

  return { responseUpdateInput: validatedInput.data };
};
