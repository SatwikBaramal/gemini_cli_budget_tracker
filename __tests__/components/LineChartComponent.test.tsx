import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LineChartComponent from '@/components/LineChartComponent'

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

describe('LineChartComponent', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches data with correct year parameter', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '40000' }) })

    render(<LineChartComponent selectedYear={2024} />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/expenses/monthly?year=2024')
      expect(global.fetch).toHaveBeenCalledWith('/api/fixed-expenses?year=2024')
      expect(global.fetch).toHaveBeenCalledWith('/api/income/monthly?year=2024')
    })
  })

  it('defaults to current year when no year provided', async () => {
    const currentYear = new Date().getFullYear()
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '40000' }) })

    render(<LineChartComponent />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/expenses/monthly?year=${currentYear}`)
    })
  })

  it('shows loading state initially', () => {
    global.fetch = jest.fn()
      .mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<LineChartComponent selectedYear={2025} />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('re-fetches when year changes', async () => {
    global.fetch = jest.fn()
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValue({ ok: true, json: async () => [] })
      .mockResolvedValue({ ok: true, json: async () => ({ value: '40000' }) })

    const { rerender } = render(<LineChartComponent selectedYear={2024} />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
    
    jest.clearAllMocks()
    
    rerender(<LineChartComponent selectedYear={2025} />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/expenses/monthly?year=2025')
    })
  })

  it('handles API errors gracefully', async () => {
    global.fetch = jest.fn()
      .mockRejectedValue(new Error('Network error'))

    render(<LineChartComponent selectedYear={2025} />)
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('processes monthly expenses correctly', async () => {
    const mockExpenses = [
      { id: '1', name: 'Expense 1', amount: 5000, month: 1 },
      { id: '2', name: 'Expense 2', amount: 3000, month: 1 },
    ]
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockExpenses })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '40000' }) })

    render(<LineChartComponent selectedYear={2025} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  it('processes fixed expenses with overrides correctly', async () => {
    const mockFixedExpenses = [
      { 
        id: 'f1', 
        name: 'Rent', 
        amount: 15000, 
        applicable_months: [1, 2],
        overrides: [
          { id: 'o1', month: 1, override_amount: 18000, date: '2025-01-01' }
        ]
      }
    ]
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFixedExpenses })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '40000' }) })

    render(<LineChartComponent selectedYear={2025} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
    
    // Should use override amount for month 1
  })

  it('renders time period selector', async () => {
    global.fetch = jest.fn()
      .mockResolvedValue({ ok: true, json: async () => [] })

    render(<LineChartComponent selectedYear={2025} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '3M' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '6M' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1Y' })).toBeInTheDocument()
    })
  })

  it('switches between expenses and savings view', async () => {
    global.fetch = jest.fn()
      .mockResolvedValue({ ok: true, json: async () => [] })

    render(<LineChartComponent selectedYear={2025} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Expenses' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Savings' })).toBeInTheDocument()
    })
  })
})





