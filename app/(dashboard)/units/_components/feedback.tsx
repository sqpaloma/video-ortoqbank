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
  unitId: Id<"units">;
  onFeedbackSubmitted?: () => void;
}

export function Feedback({
  userId,
  lessonId,
  unitId,
  onFeedbackSubmitted,
}: FeedbackProps) {
  // Use lessonId as key dependency to derive initial state
  const [feedbackText, setFeedbackText] = useState("");
  const [lastLessonId, setLastLessonId] = useState(lessonId);

  // Detect lesson change and reset text
  useEffect(() => {
    if (lessonId !== lastLessonId) {
      setLastLessonId(lessonId);
      setFeedbackText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const submitFeedback = useMutation(api.feedback.submitFeedback);

  const handleSubmitFeedback = async () => {
    if (!userId || !lessonId || !unitId || !feedbackText.trim()) return;
    try {
      await submitFeedback({
        userId,
        lessonId,
        unitId,
        feedback: feedbackText,
      });
      setFeedbackText("");
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return (
    <div className="flex gap-2 w-full items-start h-full">
      <Textarea
        placeholder="Digite seu feedback ou dúvida aqui..."
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        className="h-full flex-1 resize-none"
        aria-label="Campo de feedback"
      />
      <Button
        onClick={handleSubmitFeedback}
        disabled={!feedbackText.trim()}
        size="icon"
        className="shrink-0"
        aria-label="Enviar feedback"
      >
        <SendIcon size={18} />
      </Button>
    </div>
  );
}

