"use client";

import { SearchIcon, BookOpenIcon, VideoIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder = "Pesquise por temas, subtemas e grupos...",
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isManuallyHidden, setIsManuallyHidden] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();
  const wrapperRef = useRef<HTMLFormElement>(null);

  // Debounce da query para não fazer muitas requisições
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Buscar sugestões
  const suggestions = useQuery(
    api.search.getSuggestions,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip",
  );

  // Derive showSuggestions from data (no setState in effect)
  const hasSuggestions =
    suggestions &&
    (suggestions.units.length > 0 || suggestions.lessons.length > 0);
  const showSuggestions = !isManuallyHidden && Boolean(hasSuggestions);

  // Fechar sugestões quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsManuallyHidden(true);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsManuallyHidden(true);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleUnitClick = (categoryId: Id<"categories">) => {
    setIsManuallyHidden(true);
    setQuery("");
    router.push(`/units/${categoryId}`);
  };

  const handleLessonClick = (lessonId: Id<"lessons">) => {
    setIsManuallyHidden(true);
    setQuery("");
    router.push(`/lesson/${lessonId}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Reset manual hide when user types
    if (isManuallyHidden) {
      setIsManuallyHidden(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative" ref={wrapperRef}>
      <div className="relative">
        <SearchIcon
          className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10"
          size={18}
        />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 md:pl-11 pr-3 md:pr-4 h-12 md:h-14 rounded-full border text-sm md:text-base"
          onFocus={() => {
            if (hasSuggestions) {
              setIsManuallyHidden(false);
            }
          }}
        />
      </div>

      {/* Dropdown de sugestões */}
      {showSuggestions && hasSuggestions && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {suggestions.units.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Módulos
              </div>
              {suggestions.units.map((unit) => (
                <button
                  key={unit._id}
                  type="button"
                  onClick={() => handleUnitClick(unit.categoryId)}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 rounded-md transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <BookOpenIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 group-hover:text-blue-700 truncate">
                        {unit.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {unit.categoryTitle}
                      </div>
                      {unit.description && (
                        <div className="text-xs text-gray-400 line-clamp-1 mt-1">
                          {unit.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {suggestions.lessons.length > 0 && (
            <div
              className={cn("p-2", suggestions.units.length > 0 && "border-t")}
            >
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Aulas
              </div>
              {suggestions.lessons.map((lesson) => (
                <button
                  key={lesson._id}
                  type="button"
                  onClick={() => handleLessonClick(lesson._id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-green-50 rounded-md transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <VideoIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 group-hover:text-green-700 truncate">
                        {lesson.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {lesson.unitTitle} • {lesson.categoryTitle}
                      </div>
                      {lesson.description && (
                        <div className="text-xs text-gray-400 line-clamp-1 mt-1">
                          {lesson.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}
