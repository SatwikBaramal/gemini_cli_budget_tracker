import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Dashboard from '@/components/Dashboard'
import { setupFetchSuccess, resetFetchMock } from '../mocks/fetch'

// Mock the child components
jest.mock('@/components/LineChartComponent', () => {
  return function MockLineChart({ selectedYear }: { selectedYear?: number }) {
    return <div data-testid="line-chart">Line Chart {selectedYear}</div>
  }
})

jest.mock('@/components/Summary', () => {
  return function MockSummary() {
    return <div data-testid="summary">Summary</div>
  }
})

describe('Dashboard Component', () => {
  beforeEach(() => {
    resetFetchMock()
    setupFetchSuccess([])
  })

  it('renders monthly income correctly', async () => {
    render(
      <Dashboard 
        monthlyIncome={50000} 
        expenses={[]} 
        selectedYear={2025}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText(/₹50,000/)).toBeInTheDocument()
    })
  })

  it('renders with different years and passes to LineChart', async () => {
    render(
      <Dashboard 
        monthlyIncome={40000} 
        expenses={[]} 
        selectedYear={2024}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toHaveTextContent('2024')
    })
  })

  it('fetches monthly and fixed expenses on mount', async () => {
    const mockMonthlyExpenses = [
      { id: '1', name: 'Expense 1', amount: 1000, month: 1, type: 'monthly' }
    ]
    const mockFixedExpenses = [
      { id: 'f1', name: 'Rent', amount: 15000, applicable_months: [1,2,3], year: 2025 }
    ]

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockMonthlyExpenses })
      .mockResolvedValueOnce({ ok: true, json: async () => mockFixedExpenses })

    render(
      <Dashboard 
        monthlyIncome={50000} 
        expenses={[]} 
        selectedYear={2025}
      />
    )
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('calculates total expenses correctly for this month', async () => {
    const currentMonth = new Date().getMonth() + 1
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => [
          { id: '1', name: 'Expense', amount: 5000, month: currentMonth, type: 'monthly' }
        ] 
      })
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => [
          { 
            id: 'f1', 
            name: 'Rent', 
            amount: 15000, 
            applicable_months: [currentMonth],
            year: 2025 
          }
        ] 
      })

    render(
      <Dashboard 
        monthlyIncome={50000} 
        expenses={[]} 
        selectedYear={2025}
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText(/₹20,000/)).toBeInTheDocument()
    })
  })

  it('handles loading state', () => {
    render(
      <Dashboard 
        monthlyIncome={50000} 
        expenses={[]} 
        selectedYear={2025}
      />
    )
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles fetch errors gracefully', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    // Should not crash
    render(
      <Dashboard 
        monthlyIncome={50000} 
        expenses={[]} 
        selectedYear={2025}
      />
    )
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it('calculates expenses for different time periods', async () => {
    global.fetch = jest.fn()
      .mockResolvedValue({ ok: true, json: async () => [] })

    render(
      <Dashboard 
        monthlyIncome={50000} 
        expenses={[]} 
        selectedYear={2025}
      />
    )
    
    // Should have time period selector
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('includes fixed expense overrides in calculations', async () => {
    const currentMonth = new Date().getMonth() + 1
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ 
        ok: true, 
        json: async () => [
          { 
            id: 'f1', 
            name: 'Rent', 
            amount: 15000, 
            applicable_months: [currentMonth],
            year: 2025,
            overrides: [{
              id: 'o1',
              month: currentMonth,
              override_amount: 18000,
              date: '2025-01-01'
            }]
          }
        ] 
      })

    render(
      <Dashboard 
        monthlyIncome={50000} 
        expenses={[]} 
        selectedYear={2025}
      />
    )
    
    // Should use override amount (18000) instead of base amount (15000)
    await waitFor(() => {
      const totalElement = screen.getByText(/₹18,000/)
      expect(totalElement).toBeInTheDocument()
    })
  })
})





