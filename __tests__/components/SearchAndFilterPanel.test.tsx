import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SearchAndFilterPanel from '@/components/SearchAndFilterPanel'
import { setupFetchSuccess, resetFetchMock } from '../mocks/fetch'

describe('SearchAndFilterPanel Component', () => {
  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    mockOnFilterChange.mockClear()
    resetFetchMock()
    setupFetchSuccess([])
  })

  it('renders search input', () => {
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    expect(screen.getByPlaceholderText(/search expenses/i)).toBeInTheDocument()
  })

  it('renders date range inputs', () => {
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
  })

  it('renders amount range sliders', () => {
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    expect(screen.getByLabelText(/min amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/max amount/i)).toBeInTheDocument()
  })

  it('debounces search input changes', async () => {
    jest.useFakeTimers()
    
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    const searchInput = screen.getByPlaceholderText(/search expenses/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    // Should not call immediately
    expect(mockOnFilterChange).not.toHaveBeenCalled()
    
    // Should call after debounce
    jest.advanceTimersByTime(300)
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      searchQuery: 'test',
      dateRange: { start: '', end: '' },
      amountRange: { min: 0, max: 100000 }
    })
    
    jest.useRealTimers()
  })

  it('calls onFilterChange when date range changes', async () => {
    jest.useFakeTimers()
    
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    const startDateInput = screen.getByLabelText(/start date/i)
    fireEvent.change(startDateInput, { target: { value: '2025-01-01' } })
    
    jest.advanceTimersByTime(300)
    
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      dateRange: { start: '2025-01-01', end: '' }
    }))
    
    jest.useRealTimers()
  })

  it('allows invalid date ranges (BUG)', async () => {
    jest.useFakeTimers()
    
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)
    
    // Start date after end date - should be prevented
    fireEvent.change(startDateInput, { target: { value: '2025-12-31' } })
    fireEvent.change(endDateInput, { target: { value: '2025-01-01' } })
    
    jest.advanceTimersByTime(300)
    
    // BUG: No validation prevents this
    expect(mockOnFilterChange).toHaveBeenCalled()
    
    jest.useRealTimers()
  })

  it('allows min amount greater than max (BUG)', async () => {
    jest.useFakeTimers()
    
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    const minInput = screen.getByLabelText(/min amount/i)
    const maxInput = screen.getByLabelText(/max amount/i)
    
    fireEvent.change(minInput, { target: { value: '50000' } })
    fireEvent.change(maxInput, { target: { value: '10000' } })
    
    jest.advanceTimersByTime(300)
    
    // BUG: No validation prevents this
    expect(mockOnFilterChange).toHaveBeenCalled()
    
    jest.useRealTimers()
  })

  it('clears all filters when clear button is clicked', () => {
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        initialFilters={{
          searchQuery: 'test',
          dateRange: { start: '2025-01-01', end: '2025-12-31' },
          amountRange: { min: 1000, max: 50000 }
        }}
        year={2025}
        maxAmount={100000}
      />
    )
    
    const clearButton = screen.getByRole('button', { name: /clear all/i })
    fireEvent.click(clearButton)
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      searchQuery: '',
      dateRange: { start: '', end: '' },
      amountRange: { min: 0, max: 100000 }
    })
  })

  it('shows "Active" badge when filters are applied', () => {
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        initialFilters={{
          searchQuery: 'test',
          dateRange: { start: '', end: '' },
          amountRange: { min: 0, max: 100000 }
        }}
        year={2025}
        maxAmount={100000}
      />
    )
    
    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })

  it('disables save preset button when no filters active', () => {
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    const saveButton = screen.getByRole('button', { name: /save preset/i })
    expect(saveButton).toBeDisabled()
  })

  it('fetches presets on mount', async () => {
    const mockPresets = [
      { _id: '1', name: 'High Value', filters: { amountRange: { min: 10000, max: 100000 } } }
    ]
    setupFetchSuccess(mockPresets)
    
    render(
      <SearchAndFilterPanel 
        onFilterChange={mockOnFilterChange} 
        year={2025}
        maxAmount={100000}
      />
    )
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/filter-presets?year=2025')
    })
  })
})





