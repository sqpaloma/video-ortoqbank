import { render, screen } from "@testing-library/react";
import UserInfos from "./user-infos";

const mockPreloadedQuery = {
    _value: {
        _id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
    },
};

vi.mock('convex/react', () => ({
    usePreloadedQuery: vi.fn(() => mockPreloadedQuery._value),
}));

describe('UserInfos', () => {
    it('should render the user infos', () => {
        render(<UserInfos preloadedUserData={mockPreloadedQuery as any} />);
    });
});