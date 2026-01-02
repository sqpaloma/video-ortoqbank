"use client";

import { PlayCircle } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";

interface CategoriesCardProps {
  imageUrl?: string;
  title: string;
  description: string;
  onClick?: () => void;
}

export function CategoriesCard({
  imageUrl = "",
  title = "",
  description = "",
  onClick = () => {},
}: CategoriesCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group overflow-hidden p-0"
    >
      {/* Image at the very top - taller and more prominent */}
      <div className="relative w-full h-40 overflow-hidden rounded-t-lg `bg-gradient-to-br` from-primary/20 via-primary/10 to-primary/5">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle size={48} className="text-primary/30 md:w-16 md:h-16" />
          </div>
        )}
      </div>

      {/* White area with title and description */}
      <div className="bg-white p-3 md:p-4 rounded-b-lg">
        <CardTitle className="text-sm md:text-base font-bold mb-1.5 md:mb-2 group-hover:text-primary transition-colors">
          {title}
        </CardTitle>

        <CardDescription className="text-xs md:text-sm line-clamp-2">
          {description}
        </CardDescription>
      </div>
    </Card>
  );
}
