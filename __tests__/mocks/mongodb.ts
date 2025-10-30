// Mock MongoDB connection and models
export const mockConnect = jest.fn(() => Promise.resolve({}))

jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: () => mockConnect(),
}))

// Mock Mongoose models
export const mockFind = jest.fn()
export const mockFindOne = jest.fn()
export const mockFindOneAndUpdate = jest.fn()
export const mockCreate = jest.fn()
export const mockDeleteOne = jest.fn()
export const mockLean = jest.fn()

// Helper to setup model mocks
export const setupModelMock = (modelName: string, mockData: any) => {
  const ModelMock = {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockData),
      sort: jest.fn().mockReturnThis(),
    }),
    findOne: jest.fn().mockResolvedValue(mockData),
    findOneAndUpdate: jest.fn().mockResolvedValue(mockData),
    create: jest.fn().mockResolvedValue(mockData),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  }
  
  return ModelMock
}

// Reset all model mocks
export const resetModelMocks = () => {
  mockFind.mockReset()
  mockFindOne.mockReset()
  mockFindOneAndUpdate.mockReset()
  mockCreate.mockReset()
  mockDeleteOne.mockReset()
  mockLean.mockReset()
}






