import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Feedback } from "./feedback";
import { Id } from "@/convex/_generated/dataModel";

// Mock Convex hooks
const mockSubmitFeedback = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockSubmitFeedback),
}));

describe("Feedback", () => {
  const mockUserId = "user-123";
  const mockLessonId = "lesson-123" as Id<"lessons">;
  const mockModuleId = "module-123" as Id<"modules">;
  const mockOnFeedbackSubmitted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitFeedback.mockResolvedValue("feedback-id");
  });

  it("should render feedback component", () => {
    render(
      <Feedback
        userId={mockUserId}
        lessonId={mockLessonId}
        moduleId={mockModuleId}
      />
    );

    const label = screen.getByText("Deixe seu feedback ou tire uma dúvida");
    expect(label).toBeDefined();

    const textarea = screen.getByLabelText("Campo de feedback");
    expect(textarea).toBeDefined();

    const sendButton = screen.getByLabelText("Enviar feedback");
    expect(sendButton).toBeDefined();
  });

  it("should disable send button when textarea is empty", () => {
    render(
      <Feedback
        userId={mockUserId}
        lessonId={mockLessonId}
        moduleId={mockModuleId}
      />
    );

    const sendButton = screen.getByLabelText("Enviar feedback");
    expect(sendButton).toBeDisabled();
  });

  it("should enable send button when textarea has text", async () => {
    const user = userEvent.setup();
    render(
      <Feedback
        userId={mockUserId}
        lessonId={mockLessonId}
        moduleId={mockModuleId}
      />
    );

    const textarea = screen.getByLabelText("Campo de feedback");
    await user.type(textarea, "This is my feedback");

    const sendButton = screen.getByLabelText("Enviar feedback");
    expect(sendButton).not.toBeDisabled();
  });

  it("should call submitFeedback when send button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Feedback
        userId={mockUserId}
        lessonId={mockLessonId}
        moduleId={mockModuleId}
      />
    );

    const textarea = screen.getByLabelText("Campo de feedback");
    await user.type(textarea, "This is my feedback");

    const sendButton = screen.getByLabelText("Enviar feedback");
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith({
        userId: mockUserId,
        lessonId: mockLessonId,
        moduleId: mockModuleId,
        feedback: "This is my feedback",
      });
    });
  });

  it("should clear textarea after submitting feedback", async () => {
    const user = userEvent.setup();
    render(
      <Feedback
        userId={mockUserId}
        lessonId={mockLessonId}
        moduleId={mockModuleId}
      />
    );

    const textarea = screen.getByLabelText("Campo de feedback") as HTMLTextAreaElement;
    await user.type(textarea, "This is my feedback");

    const sendButton = screen.getByLabelText("Enviar feedback");
    await user.click(sendButton);

    await waitFor(() => {
      expect(textarea.value).toBe("");
    });
  });

  it("should call onFeedbackSubmitted callback after successful submission", async () => {
    const user = userEvent.setup();
    render(
      <Feedback
        userId={mockUserId}
        lessonId={mockLessonId}
        moduleId={mockModuleId}
        onFeedbackSubmitted={mockOnFeedbackSubmitted}
      />
    );

    const textarea = screen.getByLabelText("Campo de feedback");
    await user.type(textarea, "This is my feedback");

    const sendButton = screen.getByLabelText("Enviar feedback");
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockOnFeedbackSubmitted).toHaveBeenCalled();
    });
  });

  it("should not submit feedback if text is only whitespace", async () => {
    const user = userEvent.setup();
    render(
      <Feedback
        userId={mockUserId}
        lessonId={mockLessonId}
        moduleId={mockModuleId}
      />
    );

    const textarea = screen.getByLabelText("Campo de feedback");
    await user.type(textarea, "   ");

    const sendButton = screen.getByLabelText("Enviar feedback");
    expect(sendButton).toBeDisabled();

    await user.click(sendButton);

    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });
});

