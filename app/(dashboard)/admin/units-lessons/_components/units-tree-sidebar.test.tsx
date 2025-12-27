import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UnitsTreeSidebar } from "./units-tree-sidebar";

describe("UnitsTreeSidebar", () => {
    it("should render", () => {
        render(
            <UnitsTreeSidebar
                units={[]}
                lessons={{}}
                expandedUnits={new Set()}
                isDraggingUnit={false}
                isDraggingLesson={false}
                sensors={[]}
                onToggleUnit={() => {}}
                onEditUnit={() => {}}
                onEditLesson={() => {}}
                onTogglePublishUnit={() => {}}
                onTogglePublishLesson={() => {}}
                onDragEndUnits={async () => {}}
                onDragEndLessons={() => async () => {}}
                onDragStartUnit={() => async () => {}}
                onDragStartLesson={() => async () => {}}
            />
        );
        expect(screen.getByText("Visualização")).toBeInTheDocument();
    });
});
