import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UnitsLessonsPage } from "./units-lessons-page";

// Mock useTenantQuery, useTenantMutation, useTenantReady
vi.mock("@/hooks/use-tenant-convex", () => ({
  useTenantQuery: () => [],
  useTenantMutation: () => vi.fn(() => Promise.resolve()),
  useTenantReady: () => true,
}));

// Mock useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock useErrorModal hook
vi.mock("@/hooks/use-error-modal", () => ({
  useErrorModal: () => ({
    error: { isOpen: false, title: "", message: "" },
    showError: vi.fn(),
    hideError: vi.fn(),
  }),
}));

// Mock useConfirmModal hook
vi.mock("@/hooks/use-confirm-modal", () => ({
  useConfirmModal: () => ({
    confirm: { isOpen: false, title: "", message: "", onConfirm: vi.fn() },
    showConfirm: vi.fn(),
    hideConfirm: vi.fn(),
  }),
}));

// Mock the sidebar component - include all exports
vi.mock("@/components/ui/sidebar", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/ui/sidebar")>();
  return {
    ...actual,
    useSidebar: () => ({ state: "expanded" }),
    SidebarTrigger: () => null,
    SidebarProvider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

// Mock the Zustand store
vi.mock("./store", () => ({
  useUnitsLessonsStore: () => ({
    selectedCategoryId: null,
    setSelectedCategoryId: vi.fn(),
    editMode: { type: "none" },
    clearEditMode: vi.fn(),
    showCreateUnitModal: false,
    showCreateLessonModal: false,
    setShowCreateUnitModal: vi.fn(),
    setShowCreateLessonModal: vi.fn(),
    setIsDraggingUnit: vi.fn(),
    setIsDraggingLesson: vi.fn(),
    draggedUnits: null,
    draggedLessons: null,
    setDraggedUnits: vi.fn(),
    setDraggedLessons: vi.fn(),
    updateDraggedLessonsForUnit: vi.fn(),
  }),
}));

// Mock UnitsTreeSidebar
vi.mock("./units-tree-sidebar", () => ({
  UnitsTreeSidebar: () => <div data-testid="units-tree-sidebar">Sidebar</div>,
}));

// Mock dialog components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Mock error modal
vi.mock("@/components/ui/error-modal", () => ({
  ErrorModal: () => null,
}));

// Mock confirm modal
vi.mock("@/components/ui/confirm-modal", () => ({
  ConfirmModal: () => null,
}));

describe("UnitsLessonsPage", () => {
  it("should render", () => {
    render(<UnitsLessonsPage />);
    expect(
      screen.getByText("Selecione uma categoria para começar"),
    ).toBeInTheDocument();
  });
});
