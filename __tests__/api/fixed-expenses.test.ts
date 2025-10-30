/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/fixed-expenses/route'
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

jest.mock('@/lib/models/FixedExpense', () => ({
  FixedExpense: {
    find: (...args: any[]) => mockFind(...args),
    create: (...args: any[]) => mockCreate(...args),
  },
}))

jest.mock('@/lib/models/FixedExpenseOverride', () => ({
  FixedExpenseOverride: {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    }),
  },
}))

describe('Fixed Expenses API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'test-user-123' } })
    mockFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    })
  })

  describe('GET /api/fixed-expenses', () => {
    it('returns fixed expenses with overrides', async () => {
      const mockFixedExpenses = [
        { 
          _id: 'f1', 
          name: 'Rent', 
          amount: 15000, 
          applicableMonths: [1, 2, 3],
          year: 2025 
        }
      ]
      
      mockFind.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockFixedExpenses)
      })
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses?year=2025')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].name).toBe('Rent')
      expect(data[0].applicable_months).toEqual([1, 2, 3])
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses?year=2025')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })

    it('returns empty array on error (BUG)', async () => {
      mockFind.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      })
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses?year=2025')
      const response = await GET(request)
      const data = await response.json()
      
      // BUG: Should return error status, not empty array
      expect(data).toEqual([])
    })
  })

  describe('POST /api/fixed-expenses', () => {
    it('creates fixed expense with applicable months', async () => {
      mockCreate.mockResolvedValue({
        _id: 'f1',
        name: 'Netflix',
        amount: 500,
        applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        year: 2025
      })
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Netflix',
          amount: 500,
          applicable_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          year: 2025
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.name).toBe('Netflix')
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', amount: 1000, applicable_months: [1] })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('does not validate empty applicable_months (BUG)', async () => {
      mockCreate.mockResolvedValue({
        _id: 'f1',
        name: 'Test',
        amount: 1000,
        applicableMonths: [],
        year: 2025
      })
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          amount: 1000,
          applicable_months: [],
          year: 2025
        })
      })
      
      const response = await POST(request)
      
      // BUG: Should require at least one month
      expect(response.status).toBe(200)
    })

    it('does not validate invalid month numbers (BUG)', async () => {
      mockCreate.mockResolvedValue({
        _id: 'f1',
        name: 'Test',
        amount: 1000,
        applicableMonths: [0, 13, 99],
        year: 2025
      })
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          amount: 1000,
          applicable_months: [0, 13, 99],
          year: 2025
        })
      })
      
      const response = await POST(request)
      
      // BUG: Should validate month numbers (1-12)
      expect(response.status).toBe(200)
    })

    it('handles database errors', async () => {
      mockCreate.mockRejectedValue(new Error('Database error'))
      
      const request = new NextRequest('http://localhost:3000/api/fixed-expenses', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          amount: 1000,
          applicable_months: [1],
          year: 2025
        })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(500)
    })
  })
})





