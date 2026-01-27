"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronLeft, Search, X } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useTenantQuery } from "@/hooks/use-tenant-convex";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ViewLevel = "categories" | "units" | "lessons";

interface CategoryInfo {
  categoryId: Id<"categories">;
  title: string;
}

interface UnitInfo {
  unitId: Id<"units">;
  title: string;
  categoryId: Id<"categories">;
  categoryTitle: string;
}

export function RatingsList() {
  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>("categories");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryInfo | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitInfo | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const categories = useTenantQuery(
    api.ratings.getCategoriesWithAverageRatings,
    {},
  );

  const units = useTenantQuery(
    api.ratings.getUnitsWithAverageRatings,
    selectedCategory ? { categoryId: selectedCategory.categoryId } : "skip",
  );

  const lessons = useTenantQuery(
    api.ratings.getLessonsWithAverageRatings,
    selectedUnit ? { unitId: selectedUnit.unitId } : "skip",
  );

  const searchResults = useTenantQuery(
    api.ratings.searchUnitsAndLessonsWithRatings,
    debouncedSearch.trim() ? { searchQuery: debouncedSearch.trim() } : "skip",
  );

  // Computed states
  const isSearching = debouncedSearch.trim().length > 0;
  const hasSearchResults =
    searchResults &&
    (searchResults.units.length > 0 || searchResults.lessons.length > 0);

  // Handlers
  const handleCategoryClick = (category: {
    categoryId: Id<"categories">;
    title: string;
  }) => {
    setSelectedCategory({
      categoryId: category.categoryId,
      title: category.title,
    });
    setSelectedUnit(null);
    setViewLevel("units");
    setSearchQuery("");
  };

  const handleUnitClick = (unit: {
    unitId: Id<"units">;
    title: string;
    categoryId?: Id<"categories">;
    categoryTitle?: string;
  }) => {
    // If coming from search, we need to set the category context
    if (unit.categoryId && unit.categoryTitle) {
      setSelectedCategory({
        categoryId: unit.categoryId,
        title: unit.categoryTitle,
      });
    }
    
    // Determine the category ID and title
    const categoryId = unit.categoryId || (selectedCategory?.categoryId ?? "" as Id<"categories">);
    const categoryTitle = unit.categoryTitle || selectedCategory?.title || "";
    
    setSelectedUnit({
      unitId: unit.unitId,
      title: unit.title,
      categoryId,
      categoryTitle,
    });
    setViewLevel("lessons");
    setSearchQuery("");
  };

  const handleSearchLessonClick = (lesson: {
    unitId: Id<"units">;
    unitTitle: string;
    categoryId: Id<"categories">;
    categoryTitle: string;
  }) => {
    setSelectedCategory({
      categoryId: lesson.categoryId,
      title: lesson.categoryTitle,
    });
    setSelectedUnit({
      unitId: lesson.unitId,
      title: lesson.unitTitle,
      categoryId: lesson.categoryId,
      categoryTitle: lesson.categoryTitle,
    });
    setViewLevel("lessons");
    setSearchQuery("");
  };

  const handleBack = () => {
    if (viewLevel === "lessons") {
      setSelectedUnit(null);
      setViewLevel("units");
    } else if (viewLevel === "units") {
      setSelectedCategory(null);
      setViewLevel("categories");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
  };

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    const parts: { label: string; onClick?: () => void }[] = [];

    parts.push({
      label: "Categorias",
      onClick:
        viewLevel !== "categories"
          ? () => {
              setSelectedCategory(null);
              setSelectedUnit(null);
              setViewLevel("categories");
            }
          : undefined,
    });

    if (selectedCategory) {
      parts.push({
        label: selectedCategory.title,
        onClick:
          viewLevel === "lessons"
            ? () => {
                setSelectedUnit(null);
                setViewLevel("units");
              }
            : undefined,
      });
    }

    if (selectedUnit) {
      parts.push({ label: selectedUnit.title });
    }

    return parts;
  }, [viewLevel, selectedCategory, selectedUnit]);

  // Render search results
  const renderSearchResults = () => {
    if (!searchResults) return null;

    return (
      <div className="space-y-6">
        {searchResults.units.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Unidades</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base font-bold">Nome</TableHead>
                  <TableHead className="text-center text-base font-bold w-[220px]">
                    Nº de Avaliações
                  </TableHead>
                  <TableHead className="text-center text-base font-bold w-[120px]">
                    Média
                  </TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.units.map((unit) => (
                  <TableRow
                    key={unit.unitId}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleUnitClick(unit)}
                  >
                    <TableCell>
                      <div>
                        <div className="text-gray-600">{unit.title}</div>
                        <div className="text-sm text-gray-500">
                          {unit.categoryTitle}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {unit.ratingCount}{" "}
                      {unit.ratingCount === 1 ? "avaliação" : "avaliações"}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {unit.average > 0 ? unit.average.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {searchResults.lessons.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Aulas</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base font-bold">Nome</TableHead>
                  <TableHead className="text-center text-base font-bold w-[220px]">
                    Nº de Avaliações
                  </TableHead>
                  <TableHead className="text-center text-base font-bold w-[120px]">
                    Média
                  </TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.lessons.map((lesson) => (
                  <TableRow
                    key={lesson.lessonId}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSearchLessonClick(lesson)}
                  >
                    <TableCell>
                      <div>
                        <div className="text-gray-600">{lesson.title}</div>
                        <div className="text-sm text-gray-500">
                          {lesson.unitTitle} • {lesson.categoryTitle}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {lesson.ratingCount}{" "}
                      {lesson.ratingCount === 1 ? "avaliação" : "avaliações"}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {lesson.average > 0 ? lesson.average.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!hasSearchResults && debouncedSearch.trim() && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum resultado encontrado para &quot;{debouncedSearch}&quot;
          </div>
        )}
      </div>
    );
  };

  // Render categories view
  const renderCategories = () => {
    if (!categories) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Carregando categorias...
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma categoria encontrada
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-base font-bold">Nome</TableHead>
            <TableHead className="text-center text-base font-bold w-[220px]">
              Nº de Avaliações
            </TableHead>
            <TableHead className="text-center text-base font-bold w-[120px]">
              Média
            </TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow
              key={category.categoryId}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleCategoryClick(category)}
            >
              <TableCell className="text-gray-600">{category.title}</TableCell>
              <TableCell className="text-center text-gray-600">
                {category.ratingCount}{" "}
                {category.ratingCount === 1 ? "avaliação" : "avaliações"}
              </TableCell>
              <TableCell className="text-center text-gray-600">
                {category.average > 0 ? category.average.toFixed(1) : "-"}
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render units view
  const renderUnits = () => {
    if (!units) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Carregando unidades...
        </div>
      );
    }

    if (units.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma unidade encontrada nesta categoria
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-base font-bold">Nome</TableHead>
            <TableHead className="text-center text-base font-bold w-[220px]">
              Nº de Avaliações
            </TableHead>
            <TableHead className="text-center text-base font-bold w-[120px]">
              Média
            </TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow
              key={unit.unitId}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleUnitClick(unit)}
            >
              <TableCell className="text-gray-600">{unit.title}</TableCell>
              <TableCell className="text-center text-gray-600">
                {unit.ratingCount}{" "}
                {unit.ratingCount === 1 ? "avaliação" : "avaliações"}
              </TableCell>
              <TableCell className="text-center text-gray-600">
                {unit.average > 0 ? unit.average.toFixed(1) : "-"}
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render lessons view
  const renderLessons = () => {
    if (!lessons) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Carregando aulas...
        </div>
      );
    }

    if (lessons.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma aula encontrada nesta unidade
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-base font-bold">Nome</TableHead>
            <TableHead className="text-center text-base font-bold w-[220px]">
              Nº de Avaliações
            </TableHead>
            <TableHead className="text-center text-base font-bold w-[120px]">
              Média
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson) => (
            <TableRow key={lesson.lessonId}>
              <TableCell className="text-gray-600">{lesson.title}</TableCell>
              <TableCell className="text-center text-gray-600">
                {lesson.ratingCount}{" "}
                {lesson.ratingCount === 1 ? "avaliação" : "avaliações"}
              </TableCell>
              <TableCell className="text-center text-gray-600">
                {lesson.average > 0 ? lesson.average.toFixed(1) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title and Search bar */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          Todas as Avaliações
        </h2>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar unidade ou aula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-9"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isSearching ? (
        renderSearchResults()
      ) : (
        <>
          {/* Breadcrumb and back button */}
          <div className="flex items-center gap-2">
            {viewLevel !== "categories" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <nav className="flex items-center text-lg">
              {breadcrumb.map((item, index) => (
                <span key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-5 w-5 mx-1 text-gray-400" />
                  )}
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-semibold">
                      {item.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </div>

          {/* Table content */}
          {viewLevel === "categories" && renderCategories()}
          {viewLevel === "units" && renderUnits()}
          {viewLevel === "lessons" && renderLessons()}
        </>
      )}
    </div>
  );
}
