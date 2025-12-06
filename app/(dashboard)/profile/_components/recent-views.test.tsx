
import { render, screen } from "@testing-library/react";
import RecentViews from "./recent-views";

const mockPreloadedRecentViews = {
    _value: [],
};

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock('convex/react', () => ({
    usePreloadedQuery: vi.fn(() => mockPreloadedRecentViews._value),
}));


describe('RecentViews', () => {
    it('should render the recent views', () => {
        render(<RecentViews preloadedRecentViews={mockPreloadedRecentViews as any} />);

        const paragraph = screen.getByText('Comece a explorar as categorias e módulos disponíveis!');
        expect(paragraph).toBeDefined();
    });
});