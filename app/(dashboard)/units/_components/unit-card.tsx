"use client";

import { PlayCircleIcon } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

interface UnitCardProps {
  title: string;
  description: string;
  totalLessons: number;
  onClick?: () => void;
}

export function UnitCard({
  title = "",
  description = "",
  totalLessons = 0,
  onClick = () => {},
}: UnitCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group p-5"
    >
      <div className="flex items-start gap-4">
        <div className="`flex-shrink-0` w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <PlayCircleIcon size={24} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </CardTitle>

          <CardDescription className="text-sm line-clamp-2 mb-3">
            {description}
          </CardDescription>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <PlayCircleIcon size={16} />
              <span>
                {totalLessons} {totalLessons === 1 ? "aula" : "aulas"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
