"use client";

import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import * as XLSX from "xlsx";

import { api } from "@/convex/_generated/api";
import { WaitlistSearch } from "./waitlist-search";
import { WaitlistTable } from "./waitlist-table";
import { Button } from "@/components/ui/button";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";

export function WaitlistPage() {
  const { state } = useSidebar();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Use paginatedQuery com 10 itens por página
  const { results, status, loadMore } = usePaginatedQuery(
    api.waitlist.list,
    {},
    { initialNumItems: 10 },
  );

  const entries = results;
  const isLoading = status === "LoadingFirstPage";

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
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-brand-blue hover:text-brand-blue hover:bg-brand-blue transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
            ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
            : "left-[calc(var(--sidebar-width)+0.25rem)]"
        }`}
      />

      {/* Header */}
      <div className="border-b ">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lista de Espera
            </h1>
          </div>
        </div>
      </div>

      <div className="p-8 pl-24 pr-24 pb-2">
        <WaitlistSearch
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={handleSearch}
          onExport={handleExportToExcel}
          isLoading={isLoading}
          hasResults={filteredEntries.length > 0}
        />
      </div>

      <p className="text-sm pl-26 pr-24 text-muted-foreground">
        {isLoading
          ? "Carregando..."
          : searchQuery.trim()
            ? `Mostrando ${filteredEntries.length} resultado(s) da busca.`
            : `Total de ${(entries ?? []).length} inscricao(oes) na lista de espera.`}
      </p>

      <div className="p-14 pl-24 pr-24">
        <WaitlistTable
          entries={filteredEntries}
          isLoading={isLoading}
          hasSearchQuery={!!searchQuery.trim()}
        />
      </div>

      <div className="p-14 pl-26 pr-26">
        {/* Botões de Paginação */}
        {!searchQuery.trim() && (
          <div className="flex items-center justify-between ">
            <p className="text-sm text-muted-foreground">
              Mostrando {entries.length} registro(s)
            </p>
            <div className="flex gap-2 bg-white rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMore(10)}
                disabled={status !== "CanLoadMore"}
              >
                {status === "LoadingMore" ? (
                  "Carregando..."
                ) : (
                  <>
                    <ChevronRightIcon className="h-4 w-4 mr-1" />
                    Carregar mais 10
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
