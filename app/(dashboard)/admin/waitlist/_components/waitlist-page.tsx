"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import * as XLSX from "xlsx";

import { api } from "@/convex/_generated/api";
import { WaitlistSearch } from "./waitlist-search";
import { WaitlistTable } from "./waitlist-table";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function WaitlistPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const entries = useQuery(api.waitlist.list);
  const isLoading = entries === undefined;

  const filteredEntries = (entries ?? []).filter((entry) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      entry.name.toLowerCase().includes(search) ||
      entry.email.toLowerCase().includes(search) ||
      entry.whatsapp.toLowerCase().includes(search) ||
      entry.instagram?.toLowerCase().includes(search)
    );
  });

  function handleSearch() {
    setSearchQuery(searchInput.trim());
  }

  function handleExportToExcel() {
    if (!entries || entries.length === 0) return;

    const excelData = filteredEntries.map((entry) => ({
      Nome: entry.name,
      Email: entry.email,
      WhatsApp: entry.whatsapp,
      Instagram: entry.instagram ?? "",
      "Nivel Residencia": entry.residencyLevel,
      Subespecialidade: entry.subspecialty,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista de Espera");

    const date = new Date().toISOString().split("T")[0];
    const fileName = `waitlist-ortoqbank-${date}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  return (
    <div className="space-y-6 md:p-36 md:pt-12">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Lista de Espera</h1>
      </div>
      <WaitlistSearch
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        onExport={handleExportToExcel}
        isLoading={isLoading}
        hasResults={filteredEntries.length > 0}
      />

      <p className="text-sm text-muted-foreground">
        {isLoading
          ? "Carregando..."
          : searchQuery.trim()
            ? `Mostrando ${filteredEntries.length} resultado(s) da busca.`
            : `Total de ${(entries ?? []).length} inscricao(oes) na lista de espera.`}
      </p>

      <WaitlistTable
        entries={filteredEntries}
        isLoading={isLoading}
        hasSearchQuery={!!searchQuery.trim()}
      />
    </div>
  );
}
