"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";

interface WaitlistSearchProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onExport: () => void;
  isLoading: boolean;
  hasResults: boolean;
}

export function WaitlistSearch({
  searchInput,
  onSearchInputChange,
  onSearch,
  onExport,
  isLoading,
  hasResults,
}: WaitlistSearchProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Buscar por nome, email, WhatsApp ou Instagram..."
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        className="max-w-md"
      />
      <Button onClick={onSearch} size="default">
        <Search className="mr-2 h-4 w-4" />
        Buscar
      </Button>
      <Button
        onClick={onExport}
        variant="outline"
        size="icon"
        disabled={isLoading || !hasResults}
        title="Exportar para Excel"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
