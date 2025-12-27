import { render, screen } from "@testing-library/react";
import { UnitTreeItem } from "./unit-tree-item";
import { Doc } from "@/convex/_generated/dataModel";

describe("UnitTreeItem", () => {
    it("should render", () => {
        render(<UnitTreeItem unit={{ _id: "1", title: "Test Unit" } as Doc<"units">} isExpanded={false} unitLessons={[]} onToggle={() => { }} onEdit={() => { }} onEditLesson={() => { }} onTogglePublishUnit={() => { }} onTogglePublishLesson={() => { }} isDraggingUnit={false} isDraggingLesson={false} sensors={[]} onDragEndLessons={() => async () => { }} onDragStartLesson={() => { }} />);
        expect(screen.getByText("Test Unit")).toBeInTheDocument();
    });
}); 