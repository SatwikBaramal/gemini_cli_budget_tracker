// Mock Next.js router
export const mockPush = jest.fn()
export const mockReplace = jest.fn()
export const mockBack = jest.fn()
export const mockPrefetch = jest.fn()

export const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  prefetch: mockPrefetch,
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  basePath: '',
  locale: undefined,
  locales: undefined,
  defaultLocale: undefined,
  domainLocales: undefined,
  isReady: true,
  isPreview: false,
  isLocaleDomain: false,
  isFallback: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

export const resetRouterMocks = () => {
  mockPush.mockReset()
  mockReplace.mockReset()
  mockBack.mockReset()
  mockPrefetch.mockReset()
}














