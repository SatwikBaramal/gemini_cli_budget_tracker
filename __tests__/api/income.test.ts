/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/income/route'
import { NextRequest } from 'next/server'

// Mock auth
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

// Mock MongoDB
const mockFindOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(),
}))

jest.mock('@/lib/models/Setting', () => ({
  Setting: {
    findOne: (...args: any[]) => mockFindOne(...args),
    findOneAndUpdate: (...args: any[]) => mockFindOneAndUpdate(...args),
  },
}))

describe('Income API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'test-user-123' } })
  })

  describe('GET /api/income', () => {
    it('returns yearly income for authenticated user', async () => {
      mockFindOne.mockResolvedValue({ value: '500000', year: 2025 })
      
      const request = new NextRequest('http://localhost:3000/api/income?year=2025')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.value).toBe('500000')
      expect(mockFindOne).toHaveBeenCalledWith({
        userId: 'test-user-123',
        key: 'yearlyIncome',
        year: 2025
      })
    })

    it('returns 0 when no income found', async () => {
      mockFindOne.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/income?year=2025')
      const response = await GET(request)
      const data = await response.json()
      
      expect(data.value).toBe('0')
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/income?year=2025')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      expect(mockFindOne).not.toHaveBeenCalled()
    })

    it('defaults to current year when year not provided', async () => {
      mockFindOne.mockResolvedValue({ value: '500000' })
      const currentYear = new Date().getFullYear()
      
      const request = new NextRequest('http://localhost:3000/api/income')
      await GET(request)
      
      expect(mockFindOne).toHaveBeenCalledWith({
        userId: 'test-user-123',
        key: 'yearlyIncome',
        year: currentYear
      })
    })

    it('handles database errors', async () => {
      mockFindOne.mockRejectedValue(new Error('Database error'))
      
      const request = new NextRequest('http://localhost:3000/api/income?year=2025')
      const response = await GET(request)
      
      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/income', () => {
    it('saves yearly income for authenticated user', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ value: '600000', year: 2025 })
      
      const request = new NextRequest('http://localhost:3000/api/income', {
        method: 'POST',
        body: JSON.stringify({ income: 600000, year: 2025 })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.income).toBe(600000)
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'test-user-123', key: 'yearlyIncome', year: 2025 },
        expect.objectContaining({
          $set: expect.objectContaining({
            value: '600000',
            userId: 'test-user-123',
            key: 'yearlyIncome',
            year: 2025
          })
        }),
        { upsert: true, new: true }
      )
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/income', {
        method: 'POST',
        body: JSON.stringify({ income: 600000, year: 2025 })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
      expect(mockFindOneAndUpdate).not.toHaveBeenCalled()
    })

    it('defaults to current year when year not provided', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ value: '600000' })
      const currentYear = new Date().getFullYear()
      
      const request = new NextRequest('http://localhost:3000/api/income', {
        method: 'POST',
        body: JSON.stringify({ income: 600000 })
      })
      
      await POST(request)
      
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ year: currentYear }),
        expect.anything(),
        expect.anything()
      )
    })

    it('does not validate negative income (BUG)', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ value: '-1000', year: 2025 })
      
      const request = new NextRequest('http://localhost:3000/api/income', {
        method: 'POST',
        body: JSON.stringify({ income: -1000, year: 2025 })
      })
      
      const response = await POST(request)
      
      // BUG: Should reject negative income
      expect(response.status).toBe(200)
    })

    it('does not validate empty name (BUG)', async () => {
      mockFindOneAndUpdate.mockResolvedValue({ value: '0', year: 2025 })
      
      const request = new NextRequest('http://localhost:3000/api/income', {
        method: 'POST',
        body: JSON.stringify({ income: 0, year: 2025 })
      })
      
      const response = await POST(request)
      
      // BUG: Should validate minimum income
      expect(response.status).toBe(200)
    })

    it('handles database errors', async () => {
      mockFindOneAndUpdate.mockRejectedValue(new Error('Database error'))
      
      const request = new NextRequest('http://localhost:3000/api/income', {
        method: 'POST',
        body: JSON.stringify({ income: 600000, year: 2025 })
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(500)
    })
  })
})






