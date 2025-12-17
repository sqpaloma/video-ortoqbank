"use client";

import { useState, useEffect, useRef } from "react";
import { StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RatingProps {
  userId: string;
  lessonId: Id<"lessons">;
  unitId: Id<"units">;
}

export function Rating({ userId, lessonId, unitId }: RatingProps) {
  const [tempRating, setTempRating] = useState<number | null>(null);
  const [showRatingConfirm, setShowRatingConfirm] = useState(false);
  const prevLessonIdRef = useRef(lessonId);

  const submitRating = useMutation(api.ratings.submitRating);
  const userRating = useQuery(
    api.ratings.getUserRating,
    userId && lessonId
      ? { userId, lessonId }
      : "skip",
  );

  // Derive the displayed rating: use temp rating if user is selecting, otherwise use saved rating
  const displayedRating = tempRating ?? userRating?.rating ?? null;

  // Reset temporary state when lesson changes
  // This is a legitimate use case: resetting component state when the lesson prop changes
  // We only update state when lessonId actually changes (not on every render)
  useEffect(() => {
    if (prevLessonIdRef.current !== lessonId) {
      prevLessonIdRef.current = lessonId;
      // Batch state updates together
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempRating(null);
      setShowRatingConfirm(false);
    }
  }, [lessonId]);

  const handleRatingClick = (rating: number) => {
    setTempRating(rating);
    // Show confirm button if rating changed or if no rating exists
    if (!userRating || userRating.rating !== rating) {
      setShowRatingConfirm(true);
    } else {
      setShowRatingConfirm(false);
    }
  };

  const handleConfirmRating = async () => {
    if (!userId || !lessonId || !unitId || !displayedRating) return;
    try {
      await submitRating({
        userId,
        lessonId,
        unitId,
        rating: displayedRating,
      });
      setTempRating(null);
      setShowRatingConfirm(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  return (
    <>
      <label className="text-sm font-medium mb-2">
        O que você achou desta aula?
      </label>
      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(star)}
            className="focus:outline-none"
            aria-label={`Avaliar com ${star} estrela${star > 1 ? "s" : ""}`}
          >
            <StarIcon
              size={32}
              className={cn(
                "transition-colors",
                displayedRating && star <= displayedRating
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-gray-300 hover:text-yellow-400"
              )}
            />
          </button>
        ))}
      </div>
      {showRatingConfirm && displayedRating && (
        <Button
          onClick={handleConfirmRating}
          className="w-full lg:w-auto"
          variant="default"
        >
          Confirmar avaliação
        </Button>
      )}
    </>
  );
}

