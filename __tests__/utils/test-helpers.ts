import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render function that wraps components with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

// Data factories for creating test data
export const createMockExpense = (overrides?: any) => ({
  id: 'expense-1',
  name: 'Test Expense',
  amount: 1000,
  type: 'yearly',
  date: '2025-01-01',
  ...overrides,
})

export const createMockExpenses = (count: number) => {
  return Array.from({ length: count }, (_, i) => createMockExpense({
    id: `expense-${i + 1}`,
    name: `Expense ${i + 1}`,
    amount: (i + 1) * 1000,
  }))
}

export const createMockFixedExpense = (overrides?: any) => ({
  id: 'fixed-1',
  name: 'Rent',
  amount: 15000,
  applicable_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  year: 2025,
  overrides: [],
  ...overrides,
})

export const createMockIncome = (amount = 500000, year = 2025) => ({
  value: String(amount),
  year,
})

// Wait utilities
export const waitFor = (condition: () => boolean, timeout = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval)
        resolve()
      } else if (Date.now() - start > timeout) {
        clearInterval(interval)
        reject(new Error('Timeout waiting for condition'))
      }
    }, 50)
  })
}

// Custom matchers
export const customMatchers = {
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${min} - ${max}`
          : `expected ${received} to be within range ${min} - ${max}`,
    }
  },
}






