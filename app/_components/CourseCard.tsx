"use client";

import { PlayCircle, Clock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface CourseCardProps {
  imageUrl?: string;
  title: string;
  description: string;
  level: "Básico" | "Intermediário" | "Avançado";
  lessonsCount: number;
  duration: number;
  onClick?: () => void;
}

export function CourseCard({
  imageUrl = "",
  title = "",
  level = "Básico",
  lessonsCount = 0,
  duration = 0,
  onClick = () => {},
}: CourseCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group relative overflow-hidden"
    >
      {/* Background Image */}
      <div className="w-full h-22 `bg-gradient-to-br` from-primary/20 via-primary/10 to-primary/5">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover opacity-10" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle size={48} className="text-primary/30" />
          </div>
        )}
      </div>

      <div className="relative z-10 p-4 pb-0">
        <CardTitle className="text-base font-bold mb-3 group-hover:text-primary transition-colors">
          {title}
        </CardTitle>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <Badge className="text-xs" variant="default">
            {level}
          </Badge>
          <div className="flex items-center gap-1">
            <PlayCircle size={14} />
            <span>{lessonsCount} aulas</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{duration} horas</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

