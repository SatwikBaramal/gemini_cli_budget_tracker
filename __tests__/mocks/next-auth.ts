// Mock for NextAuth
export const mockSession = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockAuth = jest.fn(() => Promise.resolve(mockSession))

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

export const setMockSession = (session: typeof mockSession | null) => {
  mockAuth.mockResolvedValue(session)
}

export const setUnauthorized = () => {
  mockAuth.mockResolvedValue(null)
}

export const resetAuthMocks = () => {
  mockAuth.mockReset()
  mockAuth.mockResolvedValue(mockSession)
}






