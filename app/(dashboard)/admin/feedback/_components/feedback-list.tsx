"use client";

import { Id } from "@/convex/_generated/dataModel";

interface Feedback {
  _id: Id<"lessonFeedback">;
  _creationTime: number;
  userId: string;
  lessonId: Id<"lessons">;
  unitId: Id<"units">;
  feedback: string;
  createdAt: number;
  userName: string;
  userEmail: string;
  lessonTitle: string;
  unitTitle: string;
}

interface FeedbackListProps {
  feedbacks: Feedback[];
}

export function FeedbackList({ feedbacks }: FeedbackListProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {feedbacks.map((feedback) => (
        <div
          key={feedback._id}
          className="border-b rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">
                  {feedback.userName}
                </span>
                <span className="text-sm text-gray-500">
                  ({feedback.userEmail})
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{feedback.lessonTitle}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span>{feedback.unitTitle}</span>
              </div>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
              {formatDate(feedback.createdAt)}
            </span>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-gray-800 whitespace-pre-wrap">
              {feedback.feedback}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
