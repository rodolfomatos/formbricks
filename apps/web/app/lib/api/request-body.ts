/** Default maximum allowed request body size (2 MB). */
export const DEFAULT_REQUEST_BODY_LIMIT_BYTES = 2 * 1024 * 1024;

/** Thrown when a request body exceeds the configured byte limit. */
export class RequestBodyTooLargeError extends Error {
  readonly actualBytes: number | null;
  readonly limitBytes: number;

  constructor(limitBytes: number, actualBytes: number | null = null) {
    super(`Request body must not exceed ${limitBytes} bytes`);
    this.name = "RequestBodyTooLargeError";
    this.limitBytes = limitBytes;
    this.actualBytes = actualBytes;
  }
}

const textDecoder = new TextDecoder();

const getContentLength = (headers: Headers): number | null => {
  const contentLength = headers.get("content-length");
  if (!contentLength) {
    return null;
  }

  const parsedContentLength = Number(contentLength);
  if (!Number.isSafeInteger(parsedContentLength) || parsedContentLength < 0) {
    return null;
  }

  return parsedContentLength;
};

const assertBodySize = (actualBytes: number, limitBytes: number): void => {
  if (actualBytes > limitBytes) {
    throw new RequestBodyTooLargeError(limitBytes, actualBytes);
  }
};

/**
 * Reads the full request body as a string, enforcing a maximum byte limit.
 * Throws RequestBodyTooLargeError if the body exceeds the limit.
 */
export const readRequestBodyWithLimit = async (
  request: Request,
  limitBytes: number = DEFAULT_REQUEST_BODY_LIMIT_BYTES
): Promise<string> => {
  const contentLength = getContentLength(request.headers);
  if (contentLength !== null) {
    assertBodySize(contentLength, limitBytes);
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > limitBytes) {
      await reader.cancel().catch(() => undefined);
      throw new RequestBodyTooLargeError(limitBytes, receivedBytes);
    }

    chunks.push(value);
  }

  if (chunks.length === 0) {
    return "";
  }

  if (chunks.length === 1) {
    return textDecoder.decode(chunks[0]);
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return textDecoder.decode(body);
};

/**
 * Reads the request body with a byte limit and parses it as JSON.
 */
export const parseJsonBodyWithLimit = async <TJson = unknown>(
  request: Request,
  limitBytes: number = DEFAULT_REQUEST_BODY_LIMIT_BYTES
): Promise<TJson> => JSON.parse(await readRequestBodyWithLimit(request, limitBytes)) as TJson;
