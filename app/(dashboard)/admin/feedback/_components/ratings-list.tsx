"use client";

import { Star } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface Rating {
  _id: Id<"lessonRatings">;
  _creationTime: number;
  userId: string;
  lessonId: Id<"lessons">;
  unitId: Id<"units">;
  rating: number;
  createdAt: number;
  userName: string;
  userEmail: string;
  lessonTitle: string;
  unitTitle: string;
}

interface RatingsListProps {
  ratings: Rating[];
}

export function RatingsList({ ratings }: RatingsListProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {ratings.map((rating) => (
        <div
          key={rating._id}
          className="border-b rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">
                  {rating.userName}
                </span>
                <span className="text-sm text-gray-500">
                  ({rating.userEmail})
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{rating.lessonTitle}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span>{rating.unitTitle}</span>
              </div>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
              {formatDate(rating.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {renderStars(rating.rating)}
            <span className="text-sm font-medium text-gray-700">
              {rating.rating} de 5
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
