import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LessonEditPanel } from "./lesson-edit-panel";
import { Doc } from "@/convex/_generated/dataModel";

// Mock Clerk useUser hook
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "test-user-id",
    },
  }),
}));

// Mock tenant hooks
vi.mock("@/src/hooks/use-tenant-convex", () => ({
  useTenantMutation: vi.fn(() => vi.fn(() => Promise.resolve())),
  useTenantAction: vi.fn(() => vi.fn(() => Promise.resolve())),
  useTenantReady: vi.fn(() => true),
}));

// Mock Convex hooks (for useQuery and useAction which are used directly)
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn(() => null),
    useAction: vi.fn(() => vi.fn(() => Promise.resolve())),
  };
});

describe("LessonEditPanel", () => {
  it("should render", () => {
    render(
      <LessonEditPanel
        lesson={{ _id: "1", title: "Test Lesson" } as Doc<"lessons">}
        units={[]}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByDisplayValue("Test Lesson")).toBeInTheDocument();
    expect(screen.getByText("Editar Aula")).toBeInTheDocument();
  });
});
