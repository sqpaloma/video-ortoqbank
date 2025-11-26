"use client";

import { ProgressBar } from "./ProgressBar";
import { SearchBar } from "./SearchBar";
import { CourseCard } from "./CourseCard";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Course {
  id: string;
  title: string;
  description: string;
  level: "Básico" | "Intermediário" | "Avançado";
  lessonsCount: number;
  duration: number;
}

interface HomeContentProps {
  initialCourses: Course[];
  initialProgress: number;
}

export function HomeContent({ initialCourses, initialProgress }: HomeContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Pesquisando por:", query);
    // Implementar lógica de pesquisa
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/cursos/${courseId}`);
  };

  // Filtrar cursos baseado na busca (exemplo simples)
  const filteredCourses = searchQuery
    ? initialCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialCourses;

  return (
    <div className="p-6 min-h-screen bg-white">
      {/* Header com progresso e estrela */}
      <div className="flex items-center justify-center mb-6 relative">
        <SidebarTrigger className="absolute left-0 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
        <ProgressBar label="Progresso Total" progress={initialProgress} />
        <Button
          variant="ghost"
          size="icon"
          className="text-yellow-400 hover:text-yellow-500 hover:bg-transparent h-10 w-10 absolute right-0"
        >
          <Star size={32} fill="currentColor" />
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <div className="mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            {...course}
            onClick={() => handleCourseClick(course.id)}
          />
        ))}
      </div>
    </div>
  );
}

