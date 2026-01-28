"use client";

import { useState, useEffect, useRef } from "react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import {
  useTenantMutation,
  useTenantQuery,
  useTenantReady,
} from "@/hooks/use-tenant-convex";

interface RatingProps {
  userId: string; // clerkUserId
  lessonId: Id<"lessons">;
  unitId: Id<"units">;
}

export function Rating({ userId, lessonId, unitId }: RatingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<1 | 2 | 3 | 4 | 5 | null>(
    null,
  );
  const prevLessonIdRef = useRef(lessonId);

  const submitRating = useTenantMutation(api.ratings.submitRating);
  const isTenantReady = useTenantReady();
  const userRating = useTenantQuery(
    api.ratings.getUserRating,
    userId && lessonId ? { userId, lessonId } : "skip",
  );

  // Derive the displayed rating from saved rating
  const displayedRating = userRating ?? null;

  // Reset state when lesson changes
  useEffect(() => {
    if (prevLessonIdRef.current !== lessonId) {
      prevLessonIdRef.current = lessonId;
      setIsSubmitting(false);
      setHoverRating(null);
    }
  }, [lessonId]);

  const handleRatingClick = async (rating: 1 | 2 | 3 | 4 | 5) => {
    // Don't submit if already submitting or if same rating
    if (isSubmitting || !isTenantReady || !userId || !lessonId || !unitId)
      return;
    if (userRating === rating) return;

    setIsSubmitting(true);
    try {
      await submitRating({
        userId,
        lessonId,
        unitId,
        rating,
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <label className="text-sm font-medium mb-2">
        O que você achou desta aula?
      </label>
      <div
        className="flex items-center gap-2 mb-2"
        onMouseLeave={() => setHoverRating(null)}
      >
        {([1, 2, 3, 4, 5] as const).map((star) => {
          const activeRating = hoverRating ?? displayedRating;
          const isFilled = activeRating !== null && star <= activeRating;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              disabled={isSubmitting}
              className={cn(
                "focus:outline-none transition-opacity",
                isSubmitting && "opacity-50 cursor-not-allowed",
              )}
              aria-label={`Avaliar com ${star} estrela${star > 1 ? "s" : ""}`}
            >
              <StarIcon
                size={32}
                className={cn(
                  "transition-colors",
                  isFilled
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-gray-300",
                )}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
