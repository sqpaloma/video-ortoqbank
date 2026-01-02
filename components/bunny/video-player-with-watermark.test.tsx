import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VideoPlayerWithWatermark } from "./video-player-with-watermark";

describe("VideoPlayerWithWatermark", () => {
  it("should render", async () => {
    const { container } = render(
      <VideoPlayerWithWatermark
        embedUrl="https://player.mediadelivery.net/embed/566190/6e562abd-086a-45b2-bdaa-820ebce7289a"
        userName="Test User"
        userCpf="1234567890"
      />,
    );

    // Check for iframe first (always rendered)
    const iframe = container.querySelector("iframe");
    expect(iframe).toBeInTheDocument();

    // Wait for watermark to appear (mounted after 100ms timeout)
    await waitFor(
      () => {
        expect(screen.getByText("Test User")).toBeInTheDocument();
      },
      { timeout: 200 },
    );

    expect(screen.getByText(/CPF: 1234567890/)).toBeInTheDocument();
  });
});
