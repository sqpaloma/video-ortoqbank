"use client";

import { useState, useEffect } from "react";
import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface FeedbackProps {
  userId: string;
  lessonId: Id<"lessons">;
  moduleId: Id<"modules">;
  onFeedbackSubmitted?: () => void;
}

export function Feedback({
  userId,
  lessonId,
  moduleId,
  onFeedbackSubmitted,
}: FeedbackProps) {
  const [feedbackText, setFeedbackText] = useState("");

  const submitFeedback = useMutation(api.feedback.submitFeedback);

  // Reset feedback when lesson changes
  useEffect(() => {
    setFeedbackText("");
  }, [lessonId]);

  const handleSubmitFeedback = async () => {
    if (!userId || !lessonId || !moduleId || !feedbackText.trim()) return;
    try {
      await submitFeedback({
        userId,
        lessonId,
        moduleId,
        feedback: feedbackText,
      });
      setFeedbackText("");
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return (
    <>
      <Textarea
        placeholder="Digite seu feedback ou dúvida aqui..."
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        className="min-h-[100px] flex-1"
        aria-label="Campo de feedback"
      />
      <Button
        onClick={handleSubmitFeedback}
        disabled={!feedbackText.trim()}
        size="icon"
        className="h-[100px] shrink-0"
        aria-label="Enviar feedback"
      >
        <SendIcon size={18} />
      </Button>
    </>
  );
}

