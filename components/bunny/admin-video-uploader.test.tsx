import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AdminVideoUploader from "./admin-video-uploader";

// Mock Clerk useUser hook
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "test-user-id",
      firstName: "Test",
      lastName: "User",
    },
  }),
}));

// Mock useBunnyUpload hook
vi.mock("@/hooks/use-bunny-upload", () => ({
  useBunnyUpload: () => ({
    uploadVideo: vi.fn(() =>
      Promise.resolve({ videoId: "test-id", libraryId: "test-lib" }),
    ),
    isUploading: false,
  }),
}));

// Mock useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useErrorModal hook
vi.mock("@/hooks/use-error-modal", () => ({
  useErrorModal: () => ({
    error: { isOpen: false, title: "", message: "" },
    showError: vi.fn(),
    hideError: vi.fn(),
  }),
}));

describe("AdminVideoUploader", () => {
  it("should render", () => {
    render(<AdminVideoUploader lessonTitle="Test Lesson" />);
    expect(screen.getByText("Test Lesson")).toBeInTheDocument();
  });
});
