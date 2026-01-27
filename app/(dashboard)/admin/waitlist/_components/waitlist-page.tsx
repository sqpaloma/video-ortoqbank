"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

import { api } from "@/convex/_generated/api";
import { WaitlistSearch } from "./waitlist-search";
import { WaitlistTable } from "./waitlist-table";
import { Button } from "@/components/ui/button";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { useTenantPaginatedQuery } from "@/hooks/use-tenant-convex";

export function WaitlistPage() {
  const { state } = useSidebar();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Use tenant-scoped paginated query com 10 itens por página
  const { results, status, loadMore } = useTenantPaginatedQuery(
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
    const fileName = `waitlist-Ortoclub-${date}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-black hover:text-black hover:bg-gray-100 transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
            ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
            : "left-[calc(var(--sidebar-width)+0.25rem)]"
        }`}
      />

      {/* Header */}
      <div className="border-b">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Lista de Espera
            </h1>
          </div>
        </div>
      </div>

      {/* Content with standardized padding */}
      <div className="p-6 pb-12 md:p-12">
        <div className="max-w-5xl mx-auto">
          {/* Search */}
          <div className="mb-6">
            <WaitlistSearch
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearch={handleSearch}
              onExport={handleExportToExcel}
              isLoading={isLoading}
              hasResults={filteredEntries.length > 0}
            />
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            {isLoading
              ? "Carregando..."
              : searchQuery.trim()
                ? `Mostrando ${filteredEntries.length} resultado(s) da busca.`
                : `Mostrando ${(entries ?? []).length} inscricao(oes) carregado(s)${status === "CanLoadMore" ? " — mais disponíveis" : ""}.`}
          </p>

          {/* Table */}
          <div className="mb-8">
            <WaitlistTable
              entries={filteredEntries}
              isLoading={isLoading}
              hasSearchQuery={!!searchQuery.trim()}
            />
          </div>

          {/* Pagination */}
          {!searchQuery.trim() && status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button variant="outline" size="lg" onClick={() => loadMore(10)}>
                Ver mais
              </Button>
            </div>
          )}

          {/* Loading more indicator */}
          {status === "LoadingMore" && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
