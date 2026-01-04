import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VideoPlayerWithWatermark } from "./video-player-with-watermark";

describe("VideoPlayerWithWatermark", () => {
  it("should render", async () => {
    const { container } = render(
      <VideoPlayerWithWatermark
        embedUrl="https://player.mediadelivery.net/embed/TEST_LIBRARY_ID/TEST_VIDEO_ID"
        userCpf="123.456.789-00"
      />,
    );

    // Check for iframe first (always rendered)
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();

    // Wait for watermark to appear (mounted after 100ms timeout)
    await waitFor(
      () => {
        expect(screen.getByText("123.456.789-00")).toBeInTheDocument();
      },
      { timeout: 200 },
    );
  });
});
