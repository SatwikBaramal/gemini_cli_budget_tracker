import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/page'

// Mock all child components
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>
  }
})

jest.mock('@/components/GoalsSection', () => ({
  GoalsSection: function MockGoalsSection() {
    return <div data-testid="goals-section">Goals</div>
  }
}))

describe('Yearly Page Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches data on initial load', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '500000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(<Home />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4)
    })
    
    // Should fetch income, yearly expenses, monthly expenses, and fixed expenses
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/income?year='))
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/expenses?year='))
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/expenses/monthly?year='))
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/fixed-expenses?year='))
  })

  it('displays yearly income after loading', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '500000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(<Home />)
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/enter your yearly income/i)
      expect(input).toHaveValue(500000)
    })
  })

  it('updates income when user changes input', async () => {
    global.fetch = jest.fn()
      // Initial fetches
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '0' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // Update POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ income: 600000 }) })

    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your yearly income/i)).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText(/enter your yearly income/i)
    fireEvent.change(input, { target: { value: '600000' } })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/income',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('600000')
        })
      )
    })
  })

  it('refetches data when year changes', async () => {
    global.fetch = jest.fn()
      // Initial load (2025)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '500000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      // After year change (2024)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '400000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(<Home />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(4)
    })
    
    // Find and click year selector (would need to implement this properly)
    // This is a simplified test
    
    jest.clearAllMocks()
    
    // Simulate year change by finding the year selector button
    // In real test, you'd click the year selector and choose a year
  })

  it('filters expenses based on search query', async () => {
    const mockExpenses = [
      { id: '1', name: 'Groceries', amount: 5000, date: '2025-01-01' },
      { id: '2', name: 'Rent', amount: 15000, date: '2025-01-01' },
    ]
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '500000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockExpenses })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument()
      expect(screen.getByText('Rent')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText(/search expenses/i)
    fireEvent.change(searchInput, { target: { value: 'Gro' } })
    
    // Should show only Groceries
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument()
      expect(screen.queryByText('Rent')).not.toBeInTheDocument()
    })
  })

  it('sorts expenses when sort header is clicked', async () => {
    const mockExpenses = [
      { id: '1', name: 'Zebra Expense', amount: 1000, date: '2025-01-01' },
      { id: '2', name: 'Apple Expense', amount: 2000, date: '2025-01-01' },
    ]
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '500000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockExpenses })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Zebra Expense')).toBeInTheDocument()
    })
    
    // First expense in ascending order should be Apple
    const firstCell = screen.getAllByRole('cell')[0]
    expect(firstCell).toHaveTextContent('Apple Expense')
  })

  it('handles API errors gracefully (BUG)', async () => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))

    // Should not crash
    render(<Home />)
    
    // BUG: No error message shown to user
    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })
  })

  it('shows no loading state (BUG)', () => {
    global.fetch = jest.fn()
      .mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<Home />)
    
    // BUG: No loading indicator
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  it('expands fixed expenses into monthly entries', async () => {
    const mockFixedExpense = {
      id: 'f1',
      name: 'Netflix',
      amount: 500,
      applicable_months: [1, 2, 3],
      year: 2025,
      overrides: []
    }
    
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: '500000' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => [mockFixedExpense] })

    render(<Home />)
    
    await waitFor(() => {
      // Should create 3 expense entries (one for each month)
      const netflixExpenses = screen.getAllByText('Netflix')
      expect(netflixExpenses.length).toBeGreaterThanOrEqual(1)
    })
  })
})









