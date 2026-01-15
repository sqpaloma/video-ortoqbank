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
  onClick = () => { },
}: CategoriesCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-primary group overflow-hidden p-0 relative h-65"
    >
      {/* Imagem de fundo ocupando todo o card */}
      <div className="">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle size={48} className="text-primary/30 md:w-16 md:h-16" />
          </div>
        )}

        {/* Overlay escuro para melhorar a legibilidade */}
        <div className="absolute inset-0 bg-black/35" />

        {/* Conteúdo sobreposto (título e descrição) */}
        <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-end">
          <CardTitle className="text-sm md:text-base font-bold mb-1.5 md:mb-2 text-white group-hover:text-primary transition-colors">
            {title}
          </CardTitle>

          <CardDescription className="text-xs md:text-sm line-clamp-2 text-white/90">
            {description}
          </CardDescription>
        </div>
      </div>
    </Card>
  );
}
