"use client";

import { Button } from "@/components/ui/button";
import { CheckCircleIcon, StarIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonInfoSectionProps {
  title: string;
  description: string;
  isCompleted: boolean;
  isFavorited: boolean;
  onMarkCompleted: () => void;
  onToggleFavorite: () => void;
  onNextLesson: () => void;
  variant?: "mobile" | "desktop";
}

export function LessonInfoSection({
  title,
  description,
  isCompleted,
  isFavorited,
  onMarkCompleted,
  onToggleFavorite,
  onNextLesson,
  variant = "desktop",
}: LessonInfoSectionProps) {
  const isMobile = variant === "mobile";

  return (
    <div className="mb-6">
      <h2 className={cn("font-bold mb-3", isMobile ? "text-xl" : "text-2xl")}>
        {title}
      </h2>
      <div
        className={cn(
          "flex flex-col gap-4",
          !isMobile && "lg:flex-row lg:items-start lg:justify-between",
        )}
      >
        {/* Description */}
        <div className="flex-1">
          <p
            className={cn(
              "text-muted-foreground",
              isMobile ? "text-sm" : "text-base",
            )}
          >
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            "flex flex-col gap-3",
            isMobile ? "w-full" : "w-full lg:w-auto lg:min-w-[200px]",
          )}
        >
          <div className="flex gap-3">
            <Button
              onClick={onMarkCompleted}
              variant={isCompleted ? "outline" : "default"}
              className={cn(
                "flex-1",
                !isMobile && "lg:flex-none lg:min-w-[160px]",
                isCompleted &&
                  "bg-white text-green-600 hover:bg-green-50 border-green-600 border-2",
              )}
              size={isMobile ? "sm" : "default"}
            >
              <CheckCircleIcon
                size={isMobile ? 16 : 18}
                className={cn("mr-2", isCompleted && "text-green-600")}
              />
              {isCompleted
                ? "Concluída"
                : isMobile
                  ? "Marcar concluída"
                  : "Marcar como concluída"}
            </Button>
            <Button
              onClick={onToggleFavorite}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="shrink-0"
            >
              <StarIcon
                size={isMobile ? 16 : 18}
                className={cn(isFavorited && "fill-yellow-500 text-yellow-500")}
              />
            </Button>
          </div>
          <Button
            onClick={onNextLesson}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="w-full lg:w-auto lg:min-w-[160px]"
          >
            Próxima aula
            <ChevronRightIcon size={isMobile ? 16 : 18} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
