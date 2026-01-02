import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UnitEditPanel } from "./unit-edit-panel";
import { Doc } from "@/convex/_generated/dataModel";

describe("UnitEditPanel", () => {
  it("should render", () => {
    render(
      <UnitEditPanel
        unit={{ _id: "1", title: "Test Unit" } as Doc<"units">}
        categories={[]}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByDisplayValue("Test Unit")).toBeInTheDocument();
  });
});
