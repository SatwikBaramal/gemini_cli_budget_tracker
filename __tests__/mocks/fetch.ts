// Mock fetch API for client-side tests
export const mockFetch = jest.fn()

global.fetch = mockFetch as any

export const mockFetchResponse = (data: any, ok = true, status = 200) => {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
  }
}

export const setupFetchSuccess = (data: any) => {
  mockFetch.mockResolvedValue(mockFetchResponse(data))
}

export const setupFetchError = (status = 500, message = 'Internal Server Error') => {
  mockFetch.mockResolvedValue(mockFetchResponse({ error: message }, false, status))
}

export const setupFetchRejection = (error: Error) => {
  mockFetch.mockRejectedValue(error)
}

export const resetFetchMock = () => {
  mockFetch.mockReset()
}

// Helper to verify fetch was called with specific parameters
export const expectFetchCalledWith = (url: string, options?: RequestInit) => {
  expect(mockFetch).toHaveBeenCalledWith(url, options)
}





