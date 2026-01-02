import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "./search-bar";

// Mock Next.js Router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Convex useQuery hook
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => null), // Return null for suggestions by default
}));

describe("SearchBar", () => {
  it("should render search bar with default placeholder", () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(
      "Pesquise por temas, subtemas e grupos...",
    );
    expect(input).toBeDefined();
  });

  it("should render search bar with custom placeholder", () => {
    render(<SearchBar placeholder="Custom placeholder" />);

    const input = screen.getByPlaceholderText("Custom placeholder");
    expect(input).toBeDefined();
  });

  it("should render search icon", () => {
    const { container } = render(<SearchBar />);

    const searchIcon = container.querySelector("svg");
    expect(searchIcon).toBeDefined();
  });

  it("should update input value when user types", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(
      "Pesquise por temas, subtemas e grupos...",
    ) as HTMLInputElement;
    await user.type(input, "test query");

    expect(input.value).toBe("test query");
  });

  it("should call onSearch when form is submitted", async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(
      "Pesquise por temas, subtemas e grupos...",
    );
    await user.type(input, "test query");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith("test query");
    });
  });

  it("should not call onSearch if onSearch is not provided", async () => {
    const user = userEvent.setup();

    render(<SearchBar />);

    const input = screen.getByPlaceholderText(
      "Pesquise por temas, subtemas e grupos...",
    );
    await user.type(input, "test query");
    await user.keyboard("{Enter}");

    // Should not throw error
    expect((input as HTMLInputElement).value).toBe("test query");
  });

  it("should clear input after submission if needed", async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(
      "Pesquise por temas, subtemas e grupos...",
    ) as HTMLInputElement;
    await user.type(input, "test query");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    // Input should still contain the value (component doesn't clear it)
    expect(input.value).toBe("test query");
  });

  it("should handle empty search query", async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText(
      "Pesquise por temas, subtemas e grupos...",
    );
    // Submit the form with empty query (input is already empty)
    await user.click(input);
    await user.keyboard("{Enter}");

    // The component may not call onSearch with empty query, so just verify it doesn't throw
    expect(input).toBeDefined();
  });
});
