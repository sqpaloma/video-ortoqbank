import { render, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VideoPlayerWithWatermark } from "./video-player-with-watermark";

describe("VideoPlayerWithWatermark", () => {
  it("should render with server-computed watermark identifier", async () => {
    // Mock the watermarkId that would come from the server
    // In production this is an HMAC-SHA256 hash of the CPF
    const mockWatermarkId = "A1B2C3D4";

    const { container } = render(
      <VideoPlayerWithWatermark
        embedUrl="https://player.mediadelivery.net/embed/TEST_LIBRARY_ID/TEST_VIDEO_ID"
        watermarkId={mockWatermarkId}
      />,
    );

    // Check for iframe first (always rendered)
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();

    // Wait for watermark to appear (mounted after 100ms timeout)
    await waitFor(
      () => {
        // Should display the server-computed watermark ID
        const watermarkElement = container.querySelector(
          '[style*="monospace"]',
        );
        expect(watermarkElement).toBeInTheDocument();
        expect(watermarkElement?.textContent).toBe(mockWatermarkId);
      },
      { timeout: 200 },
    );
  });

  it("should not render watermark when watermarkId is undefined", async () => {
    const { container } = render(
      <VideoPlayerWithWatermark
        embedUrl="https://player.mediadelivery.net/embed/TEST_LIBRARY_ID/TEST_VIDEO_ID"
        watermarkId={undefined}
      />,
    );

    // Check for iframe (always rendered)
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();

    // Wait for mount timeout to pass
    await waitFor(
      () => {
        // Watermark should not be rendered when ID is undefined
        const watermarkElement = container.querySelector(
          '[style*="monospace"]',
        );
        expect(watermarkElement).not.toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });

  it("should render 8-character uppercase alphanumeric watermark", async () => {
    // The server returns uppercase hex (first 8 chars of SHA256)
    const mockWatermarkId = "F3A7B2C1";

    const { container } = render(
      <VideoPlayerWithWatermark
        embedUrl="https://player.mediadelivery.net/embed/TEST_LIBRARY_ID/TEST_VIDEO_ID"
        watermarkId={mockWatermarkId}
      />,
    );

    await waitFor(
      () => {
        const watermarkElement = container.querySelector(
          '[style*="monospace"]',
        );
        expect(watermarkElement).toBeInTheDocument();
        // Verify the format matches what the server produces
        expect(watermarkElement?.textContent).toMatch(/^[A-F0-9]{8}$/);
      },
      { timeout: 200 },
    );
  });
});
