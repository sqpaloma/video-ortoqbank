import { RecentViews } from "./recent-views";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";


describe('RecentViews', () => {
    it('should render the recent views', () => {
        const mockPush = vi.fn();
        vi.mock('next/navigation', () => ({
            useRouter: vi.fn().mockReturnValue({ push: mockPush }),
        }));
        
        render(<RecentViews />);

        const title = screen.getByRole('heading', { name: 'Aulas Recentes' });
        expect(title).toBeDefined();
    });
});