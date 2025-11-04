import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import IncomeInput from '@/components/IncomeInput'

describe('IncomeInput Component', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with initial value', () => {
    render(<IncomeInput label="Test Income" value={50000} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText(/enter your test income/i)
    expect(input).toHaveValue(50000)
  })

  it('displays correct label', () => {
    render(<IncomeInput label="Yearly Income (INR)" value={0} onChange={mockOnChange} />)
    
    expect(screen.getByText('Yearly Income (INR)')).toBeInTheDocument()
  })

  it('calls onChange with numeric value when user types', () => {
    render(<IncomeInput label="Test Income" value={0} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText(/enter your test income/i)
    fireEvent.change(input, { target: { value: '75000' } })
    
    expect(mockOnChange).toHaveBeenCalledWith(75000)
  })

  it('handles empty input', () => {
    render(<IncomeInput label="Test Income" value={50000} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText(/enter your test income/i)
    fireEvent.change(input, { target: { value: '' } })
    
    expect(mockOnChange).toHaveBeenCalledWith(0)
  })

  it('accepts negative numbers (BUG)', () => {
    render(<IncomeInput label="Test Income" value={0} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText(/enter your test income/i)
    fireEvent.change(input, { target: { value: '-1000' } })
    
    // This is a bug - should not allow negative values
    expect(mockOnChange).toHaveBeenCalledWith(-1000)
  })

  it('accepts very large numbers without validation', () => {
    render(<IncomeInput label="Test Income" value={0} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText(/enter your test income/i)
    fireEvent.change(input, { target: { value: '999999999999' } })
    
    expect(mockOnChange).toHaveBeenCalledWith(999999999999)
  })

  it('handles decimal numbers', () => {
    render(<IncomeInput label="Test Income" value={0} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText(/enter your test income/i)
    fireEvent.change(input, { target: { value: '50000.50' } })
    
    expect(mockOnChange).toHaveBeenCalledWith(50000.50)
  })

  it('handles non-numeric input', () => {
    render(<IncomeInput label="Test Income" value={0} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText(/enter your test income/i)
    fireEvent.change(input, { target: { value: 'abc' } })
    
    // Number('abc') = NaN, which becomes 0 or NaN
    expect(mockOnChange).toHaveBeenCalled()
  })
})












