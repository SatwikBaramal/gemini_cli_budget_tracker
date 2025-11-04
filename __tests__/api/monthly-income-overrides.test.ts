/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/income/monthly/overrides/route'
import { DELETE } from '@/app/api/income/monthly/overrides/[id]/route'
import { NextRequest } from 'next/server'

// Mock auth
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}))

// Mock MongoDB
const mockFind = jest.fn()
const mockFindOne = jest.fn()
const mockCreate = jest.fn()
const mockFindOneAndDelete = jest.fn()
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn(),
}))

jest.mock('@/lib/models/MonthlyIncomeOverride', () => ({
  MonthlyIncomeOverride: {
    find: (...args: any[]) => mockFind(...args),
    findOne: (...args: any[]) => mockFindOne(...args),
    create: (...args: any[]) => mockCreate(...args),
    findOneAndDelete: (...args: any[]) => mockFindOneAndDelete(...args),
  },
}))

describe('Monthly Income Overrides API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ user: { id: 'test-user-123' } })
  })

  describe('GET /api/income/monthly/overrides', () => {
    it('returns overrides for user and year', async () => {
      const mockOverrides = [
        { _id: 'o1', month: 3, year: 2025, overrideAmount: 50000, date: '2025-03-01' }
      ]
      mockFind.mockResolvedValue(mockOverrides)

      const request = new NextRequest('http://localhost/api/income/monthly/overrides?year=2025')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveLength(1)
      expect(data[0].month).toBe(3)
      expect(data[0].override_amount).toBe(50000)
    })

    it('returns 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/income/monthly/overrides')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/income/monthly/overrides', () => {
    it('creates new override', async () => {
      mockFindOne.mockResolvedValue(null) // No existing override
      mockCreate.mockResolvedValue({})
      mockFind.mockResolvedValue([
        { _id: 'o1', month: 5, year: 2025, overrideAmount: 60000, date: '2025-05-01' }
      ])

      const request = new NextRequest('http://localhost/api/income/monthly/overrides', {
        method: 'POST',
        body: JSON.stringify({ month: 5, override_amount: 60000, year: 2025 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(mockCreate).toHaveBeenCalled()
    })

    it('updates existing override', async () => {
      const mockExisting = {
        _id: 'o1',
        overrideAmount: 50000,
        date: '2025-03-01',
        save: jest.fn()
      }
      mockFindOne.mockResolvedValue(mockExisting)
      mockFind.mockResolvedValue([mockExisting])

      const request = new NextRequest('http://localhost/api/income/monthly/overrides', {
        method: 'POST',
        body: JSON.stringify({ month: 3, override_amount: 55000, year: 2025 })
      })

      await POST(request)

      expect(mockExisting.save).toHaveBeenCalled()
      expect(mockExisting.overrideAmount).toBe(55000)
    })

    it('does not validate negative override_amount (BUG)', async () => {
      mockFindOne.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})
      mockFind.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/income/monthly/overrides', {
        method: 'POST',
        body: JSON.stringify({ month: 3, override_amount: -5000, year: 2025 })
      })

      const response = await POST(request)

      // BUG: Should reject negative amounts
      expect(response.status).toBe(200)
    })

    it('does not validate invalid month numbers (BUG)', async () => {
      mockFindOne.mockResolvedValue(null)
      mockCreate.mockResolvedValue({})
      mockFind.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/income/monthly/overrides', {
        method: 'POST',
        body: JSON.stringify({ month: 13, override_amount: 50000, year: 2025 })
      })

      const response = await POST(request)

      // BUG: Should reject month > 12
      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/income/monthly/overrides/[id]', () => {
    it('deletes override and returns remaining overrides', async () => {
      mockFindOne.mockResolvedValue({ _id: 'o1', month: 3 })
      mockFindOneAndDelete.mockResolvedValue({})
      mockFind.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/income/monthly/overrides/o1?year=2025')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'o1' }) })
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(mockFindOneAndDelete).toHaveBeenCalled()
    })

    it('returns 404 if override not found', async () => {
      mockFindOne.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/income/monthly/overrides/invalid?year=2025')
      const response = await DELETE(request, { params: Promise.resolve({ id: 'invalid' }) })

      expect(response.status).toBe(404)
    })
  })
})










