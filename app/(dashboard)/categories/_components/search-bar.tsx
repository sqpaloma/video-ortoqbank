"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder = "Pesquise por temas, subtemas e grupos...",
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Search
          className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 md:pl-11 pr-3 md:pr-4 h-12 md:h-14 rounded-full border text-sm md:text-base"
        />
      </div>
    </form>
  );
}

