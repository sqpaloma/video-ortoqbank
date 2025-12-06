"use client";

import { useState, useEffect } from "react";
import { StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RatingProps {
  userId: string;
  lessonId: Id<"lessons">;
  moduleId: Id<"modules">;
}

export function Rating({ userId, lessonId, moduleId }: RatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showRatingConfirm, setShowRatingConfirm] = useState(false);

  const submitRating = useMutation(api.ratings.submitRating);
  const userRating = useQuery(
    api.ratings.getUserRating,
    userId && lessonId
      ? { userId, lessonId }
      : "skip",
  );

  // Set initial rating when user rating loads
  useEffect(() => {
    if (userRating) {
      setSelectedRating(userRating.rating);
      setShowRatingConfirm(false);
    } else {
      setSelectedRating(null);
    }
  }, [userRating, lessonId]);

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    // Show confirm button if rating changed or if no rating exists
    if (!userRating || userRating.rating !== rating) {
      setShowRatingConfirm(true);
    } else {
      setShowRatingConfirm(false);
    }
  };

  const handleConfirmRating = async () => {
    if (!userId || !lessonId || !moduleId || !selectedRating) return;
    try {
      await submitRating({
        userId,
        lessonId,
        moduleId,
        rating: selectedRating,
      });
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
                selectedRating && star <= selectedRating
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-gray-300 hover:text-yellow-400"
              )}
            />
          </button>
        ))}
      </div>
      {showRatingConfirm && selectedRating && (
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

