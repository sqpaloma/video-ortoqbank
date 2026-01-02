import { render, screen } from "@testing-library/react";
import { UnitTreeItem } from "./unit-tree-item";
import { Doc } from "@/convex/_generated/dataModel";

describe("UnitTreeItem", () => {
  it("should render", () => {
    const unit = { _id: "1", title: "Test Unit" } as Doc<"units">;
    const unitLessons: Array<Doc<"lessons">> = [];

    const onToggle = () => {};
    const onEdit = () => {};
    const onEditLesson = () => {};
    const onTogglePublishUnit = () => {};
    const onTogglePublishLesson = () => {};
    const onDragEndLessons = () => async () => {};
    const onDragStartLesson = () => {};

    const props = {
      unit,
      isExpanded: false,
      unitLessons,
      onToggle,
      onEdit,
      onEditLesson,
      onTogglePublishUnit,
      onTogglePublishLesson,
      isDraggingUnit: false,
      isDraggingLesson: false,
      sensors: [],
      onDragEndLessons,
      onDragStartLesson,
    };

    render(<UnitTreeItem {...props} />);
    expect(screen.getByText("Test Unit")).toBeInTheDocument();
  });
});
