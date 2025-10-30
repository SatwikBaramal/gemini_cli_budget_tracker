import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ExpenseList from '@/components/ExpenseList'
import { createMockExpenses } from '../utils/test-helpers'

describe('ExpenseList Component', () => {
  const mockRequestSort = jest.fn()
  const defaultSortConfig = { key: 'name' as const, direction: 'ascending' as const }

  beforeEach(() => {
    mockRequestSort.mockClear()
  })

  it('renders empty state when no expenses', () => {
    render(
      <ExpenseList 
        expenses={[]} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    expect(screen.getByText(/no expenses added yet/i)).toBeInTheDocument()
  })

  it('displays expenses correctly', () => {
    const expenses = createMockExpenses(3)
    render(
      <ExpenseList 
        expenses={expenses} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    expect(screen.getByText('Expense 1')).toBeInTheDocument()
    expect(screen.getByText('Expense 2')).toBeInTheDocument()
    expect(screen.getByText('Expense 3')).toBeInTheDocument()
  })

  it('calls requestSort when name header is clicked', () => {
    const expenses = createMockExpenses(2)
    render(
      <ExpenseList 
        expenses={expenses} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    const nameButton = screen.getByRole('button', { name: /name/i })
    fireEvent.click(nameButton)
    
    expect(mockRequestSort).toHaveBeenCalledWith('name')
  })

  it('calls requestSort when amount header is clicked', () => {
    const expenses = createMockExpenses(2)
    render(
      <ExpenseList 
        expenses={expenses} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    const amountButton = screen.getByRole('button', { name: /amount/i })
    fireEvent.click(amountButton)
    
    expect(mockRequestSort).toHaveBeenCalledWith('amount')
  })

  it('shows month badges for monthly expenses when viewing all', () => {
    const expenses = [
      { id: '1', name: 'Expense 1', amount: 1000, month: 3 },
      { id: '2', name: 'Expense 2', amount: 2000 },
    ]
    render(
      <ExpenseList 
        expenses={expenses} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('Yearly')).toBeInTheDocument()
  })

  it('filters expenses by selected month', () => {
    const expenses = [
      { id: '1', name: 'January Expense', amount: 1000, month: 1 },
      { id: '2', name: 'February Expense', amount: 2000, month: 2 },
      { id: '3', name: 'Yearly Expense', amount: 3000 },
    ]
    render(
      <ExpenseList 
        expenses={expenses} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    const monthFilter = screen.getByRole('combobox')
    fireEvent.change(monthFilter, { target: { value: '1' } })
    
    expect(screen.getByText('January Expense')).toBeInTheDocument()
    expect(screen.queryByText('February Expense')).not.toBeInTheDocument()
  })

  it('displays yearly only filter', () => {
    const expenses = [
      { id: '1', name: 'Monthly Expense', amount: 1000, month: 1 },
      { id: '2', name: 'Yearly Expense', amount: 2000, type: 'yearly' },
    ]
    render(
      <ExpenseList 
        expenses={expenses} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    const monthFilter = screen.getByRole('combobox')
    fireEvent.change(monthFilter, { target: { value: 'yearly' } })
    
    // BUG: Filter logic may show wrong expenses
    expect(screen.queryByText('Monthly Expense')).not.toBeInTheDocument()
  })

  it('formats amounts correctly', () => {
    const expenses = [{ id: '1', name: 'Expense 1', amount: 123456 }]
    render(
      <ExpenseList 
        expenses={expenses} 
        requestSort={mockRequestSort} 
        sortConfig={defaultSortConfig} 
      />
    )
    
    expect(screen.getByText(/₹1,23,456/)).toBeInTheDocument()
  })
})






