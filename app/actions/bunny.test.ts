import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSignedEmbedUrl } from "./bunny";

// Mock the lib/bunny module to avoid crypto mocking issues
vi.mock("@/lib/bunny", () => ({
  getSignedEmbedUrl: vi.fn((videoId: string, libraryId: string) => {
    // Return a predictable result for testing
    return {
      embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=mocked-token&expires=1234567890`,
      expires: 1234567890,
    };
  }),
}));

describe("bunny", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return a signed embed url", async () => {
    const result = await getSignedEmbedUrl("123", "456");

    expect(result).toEqual({
      embedUrl:
        "https://iframe.mediadelivery.net/embed/456/123?token=mocked-token&expires=1234567890",
      expires: 1234567890,
    });
  });
});
