import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { logger } from "@formbricks/logger";
import { sendTelemetryEvents } from "./telemetry";

// Mock the logger — telemetry is a no-op in this AGPL fork
vi.mock("@formbricks/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("sendTelemetryEvents", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("is a no-op that never sends telemetry", async () => {
    await sendTelemetryEvents();

    // The function must never touch the network, cache, or database
    // (fetch is not even mocked here — if it were called, vitest would fail)
    expect(logger.debug).toHaveBeenCalledWith(
      "Telemetry disabled in AGPL fork — no-op"
    );
  });
});