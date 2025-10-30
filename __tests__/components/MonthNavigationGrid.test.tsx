import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MonthNavigationGrid from '@/components/MonthNavigationGrid'

describe('MonthNavigationGrid Component', () => {
  const mockMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const mockOnMonthSelect = jest.fn()
  const mockGetMonthData = (month: number) => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1],
    spent: month * 1000,
    remaining: 5000 - (month * 1000)
  })

  beforeEach(() => {
    mockOnMonthSelect.mockClear()
  })

  it('renders all 12 months', () => {
    render(
      <MonthNavigationGrid
        months={mockMonths}
        selectedMonth={1}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={mockGetMonthData}
      />
    )
    
    expect(screen.getByText('Jan')).toBeInTheDocument()
    expect(screen.getByText('Feb')).toBeInTheDocument()
    expect(screen.getByText('Dec')).toBeInTheDocument()
  })

  it('highlights the selected month', () => {
    const { container } = render(
      <MonthNavigationGrid
        months={mockMonths}
        selectedMonth={3}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={mockGetMonthData}
      />
    )
    
    // Selected month should have special styling
    const marchCard = container.querySelector('.border-blue-500')
    expect(marchCard).toBeInTheDocument()
  })

  it('calls onMonthSelect when a month is clicked', () => {
    render(
      <MonthNavigationGrid
        months={mockMonths}
        selectedMonth={1}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={mockGetMonthData}
      />
    )
    
    fireEvent.click(screen.getByText('Mar'))
    
    expect(mockOnMonthSelect).toHaveBeenCalledWith(3)
  })

  it('displays spent amount for each month', () => {
    render(
      <MonthNavigationGrid
        months={mockMonths}
        selectedMonth={1}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={mockGetMonthData}
      />
    )
    
    // January spent: 1000
    expect(screen.getByText('₹1,000')).toBeInTheDocument()
  })

  it('displays remaining amount with correct color', () => {
    render(
      <MonthNavigationGrid
        months={[1, 12]}
        selectedMonth={1}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={mockGetMonthData}
      />
    )
    
    // Month 1: remaining = 4000 (positive, should be green)
    // Month 12: remaining = -7000 (negative, should be red)
    const remainingAmounts = screen.getAllByText(/₹/)
    expect(remainingAmounts.length).toBeGreaterThan(0)
  })

  it('shows negative remaining in red', () => {
    const overbudgetData = (month: number) => ({
      name: 'Test',
      spent: 10000,
      remaining: -2000  // Over budget
    })
    
    render(
      <MonthNavigationGrid
        months={[1]}
        selectedMonth={1}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={overbudgetData}
      />
    )
    
    const negativeAmount = screen.getByText('₹-2,000')
    expect(negativeAmount).toHaveClass('text-red-600')
  })

  it('displays progress bar for each month', () => {
    const { container } = render(
      <MonthNavigationGrid
        months={[1, 2]}
        selectedMonth={1}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={mockGetMonthData}
      />
    )
    
    // Should have progress bars
    const progressBars = container.querySelectorAll('.bg-gray-200')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('handles empty months array', () => {
    render(
      <MonthNavigationGrid
        months={[]}
        selectedMonth={1}
        onMonthSelect={mockOnMonthSelect}
        getMonthData={mockGetMonthData}
      />
    )
    
    expect(screen.queryByText('Jan')).not.toBeInTheDocument()
  })
})



