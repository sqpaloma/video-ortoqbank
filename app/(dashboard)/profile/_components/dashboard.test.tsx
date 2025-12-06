import { render, screen } from "@testing-library/react";
import Dashboard from "./dashboard";

const mockPreloadedContentStats = {
    _value: { totalLessons: 20 },
};

const mockPreloadedGlobalProgress = {
    _value: {
        completedLessonsCount: 5,
        progressPercent: 50,
        updatedAt: Date.now(),
    },
};

const mockPreloadedCompletedCount = {
    _value: 5,
};

const mockPreloadedViewedCount = {
    _value: 10,
};

vi.mock('convex/react', () => ({
    usePreloadedQuery: vi.fn((preloaded) => {
        if (preloaded === mockPreloadedContentStats) return mockPreloadedContentStats._value;
        if (preloaded === mockPreloadedGlobalProgress) return mockPreloadedGlobalProgress._value;
        if (preloaded === mockPreloadedCompletedCount) return mockPreloadedCompletedCount._value;
        if (preloaded === mockPreloadedViewedCount) return mockPreloadedViewedCount._value;
        return null;
    }),
}));

describe('Dashboard', () => {
    it('should render the dashboard', () => {
        render(
            <Dashboard
                preloadedContentStats={mockPreloadedContentStats as any}
                preloadedGlobalProgress={mockPreloadedGlobalProgress as any}
                preloadedCompletedCount={mockPreloadedCompletedCount as any}
                preloadedViewedCount={mockPreloadedViewedCount as any}
            />
        );
        
        const completedTitle = screen.getByText('Aulas Concluídas');
        expect(completedTitle).toBeDefined();
    });
});
