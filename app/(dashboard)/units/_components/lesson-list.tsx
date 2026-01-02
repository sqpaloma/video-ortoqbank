"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  CircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonListProps {
  unitId: Id<"units">;
  unitTitle: string;
  totalLessons: number;
  isExpanded: boolean;
  currentLessonId: Id<"lessons"> | null;
  userProgress?: Array<{
    lessonId: Id<"lessons">;
    completed: boolean;
  }>;
  onToggle: () => void;
  onLessonClick: (lessonId: Id<"lessons">) => void;
}

export function LessonList({
  unitId,
  unitTitle,
  totalLessons,
  isExpanded,
  currentLessonId,
  userProgress,
  onToggle,
  onLessonClick,
}: LessonListProps) {
  // Load lessons for this unit (only published)
  const lessons = useQuery(
    api.lessons.listPublishedByUnit,
    isExpanded ? { unitId } : "skip",
  );

  const completedCount =
    lessons?.filter((lesson) =>
      userProgress?.some((p) => p.lessonId === lesson._id && p.completed),
    ).length || 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Unit Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-start gap-2 hover:bg-gray-50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDownIcon size={20} className="mt-0.5 shrink-0" />
        ) : (
          <ChevronRightIcon size={20} className="mt-0.5 shrink-0" />
        )}
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-sm">{unitTitle}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {totalLessons} aulas • {completedCount} concluídas
          </p>
        </div>
      </button>

      {/* Lessons List */}
      {isExpanded && lessons && (
        <div className="border-t">
          {lessons.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma aula disponível
            </div>
          ) : (
            lessons.map((lesson) => {
              const isCompleted = userProgress?.some(
                (p) => p.lessonId === lesson._id && p.completed,
              );
              const isActive = currentLessonId === lesson._id;

              return (
                <button
                  key={lesson._id}
                  onClick={() => onLessonClick(lesson._id)}
                  className={cn(
                    "w-full p-3 flex items-start gap-3 hover:bg-blue-50 transition-colors border-b last:border-b-0",
                    isActive && "bg-blue-50 border-l-4 border-l-primary",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircleIcon
                      size={18}
                      className="text-green-600 shrink-0 mt-0.5"
                    />
                  ) : (
                    <CircleIcon
                      size={18}
                      className="text-gray-400 shrink-0 mt-0.5"
                    />
                  )}
                  <div className="flex-1 text-left">
                    <p
                      className={cn(
                        "text-sm",
                        isActive && "font-semibold text-primary",
                      )}
                    >
                      {lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDuration(lesson.durationSeconds)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
