/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/expenses/route'
import { NextRequest } from 'next/server'

// Mock auth
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

// Mock MongoDB
const mockFind = jest.fn()
const mockCreate = jest.fn()
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(),
}))

jest.mock('@/lib/models/Expense', () => ({
  Expense: {
    find: (...args: any[]) => mockFind(...args),
    create: (...args: any[]) => mockCreate(...args),
  },
}))

describe('Expenses API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'test-user-123' } })
    mockFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    })
  })

  describe('GET /api/expenses', () => {
    it('returns expenses for authenticated user and year', async () => {
      const mockExpenses = [
        { _id: 'exp1', name: 'Groceries', amount: 5000, type: 'yearly', year: 2025 }
      ]
      
      mockFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockExpenses)
      })
      
      const request = new NextRequest('http://localhost:3000/api/expenses?year=2025')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].name).toBe('Groceries')
      expect(mockFind).toHaveBeenCalledWith({
        userId: 'test-user-123',
        type: 'yearly',
        year: 2025
      })
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/expenses?year=2025')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })

    it('defaults to current year when year not provided', async () => {
      const currentYear = new Date().getFullYear()
      
      const request = new NextRequest('http://localhost:3000/api/expenses')
      await GET(request)
      
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ year: currentYear })
      )
    })

    it('maps MongoDB _id to frontend id', async () => {
      const mockExpenses = [
        { _id: 'mongo-id-123', name: 'Test', amount: 1000, type: 'yearly', year: 2025 }
      ]
      
      mockFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockExpenses)
      })
      
      const request = new NextRequest('http://localhost:3000/api/expenses?year=2025')
      const response = await GET(request)
      const data = await response.json()
      
      expect(data[0].id).toBe('mongo-id-123')
      expect(data[0]._id).toBeUndefined()
    })
  })

  describe('POST /api/expenses', () => {
    it('creates expense for authenticated user', async () => {
      mockCreate.mockResolvedValue({
        _id: 'new-exp-id',
        name: 'New Expense',
        amount: 1000,
        type: 'yearly',
        year: 2025
      })
      
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Expense', amount: 1000, year: 2025 })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.name).toBe('New Expense')
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'New Expense',
        amount: 1000,
        type: 'yearly',
        year: 2025,
        userId: 'test-user-123'
      })
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', amount: 1000 })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('does not validate empty name (BUG)', async () => {
      mockCreate.mockResolvedValue({
        _id: 'id',
        name: '',
        amount: 1000,
        type: 'yearly',
        year: 2025
      })
      
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ name: '', amount: 1000, year: 2025 })
      })
      
      const response = await POST(request)
      
      // BUG: Should reject empty name
      expect(response.status).toBe(200)
    })

    it('does not validate negative amount (BUG)', async () => {
      mockCreate.mockResolvedValue({
        _id: 'id',
        name: 'Test',
        amount: -1000,
        type: 'yearly',
        year: 2025
      })
      
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', amount: -1000, year: 2025 })
      })
      
      const response = await POST(request)
      
      // BUG: Should reject negative amounts
      expect(response.status).toBe(200)
    })

    it('handles database errors', async () => {
      mockCreate.mockRejectedValue(new Error('Database error'))
      
      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', amount: 1000, year: 2025 })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(500)
    })
  })
})











