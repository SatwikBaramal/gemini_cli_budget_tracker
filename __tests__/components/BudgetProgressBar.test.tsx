import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import BudgetProgressBar from '@/components/BudgetProgressBar'

describe('BudgetProgressBar Component', () => {
  it('displays progress correctly for 50% spent', () => {
    render(<BudgetProgressBar income={10000} spent={5000} />)
    
    expect(screen.getByText('50% spent')).toBeInTheDocument()
    expect(screen.getByText('50% left')).toBeInTheDocument()
  })

  it('displays progress correctly for 75% spent', () => {
    render(<BudgetProgressBar income={10000} spent={7500} />)
    
    expect(screen.getByText('75% spent')).toBeInTheDocument()
    expect(screen.getByText('25% left')).toBeInTheDocument()
  })

  it('shows 100% spent when fully used', () => {
    render(<BudgetProgressBar income={10000} spent={10000} />)
    
    expect(screen.getByText('100% spent')).toBeInTheDocument()
    expect(screen.getByText('0% left')).toBeInTheDocument()
  })

  it('handles over-budget (more than 100%)', () => {
    render(<BudgetProgressBar income={10000} spent={15000} />)
    
    // Should cap at 100%
    expect(screen.getByText('100% spent')).toBeInTheDocument()
  })

  it('handles zero income gracefully', () => {
    render(<BudgetProgressBar income={0} spent={5000} />)
    
    expect(screen.getByText('0% spent')).toBeInTheDocument()
  })

  it('handles NaN values safely (BUG CHECK)', () => {
    // @ts-ignore - testing invalid input
    render(<BudgetProgressBar income={NaN} spent={NaN} />)
    
    expect(screen.getByText('0% spent')).toBeInTheDocument()
  })

  it('handles null values safely (BUG CHECK)', () => {
    // @ts-ignore - testing invalid input
    render(<BudgetProgressBar income={null} spent={null} />)
    
    expect(screen.getByText('0% spent')).toBeInTheDocument()
  })

  it('hides labels when showLabels is false', () => {
    render(<BudgetProgressBar income={10000} spent={5000} showLabels={false} />)
    
    expect(screen.queryByText('50% spent')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <BudgetProgressBar income={10000} spent={5000} className="custom-class" />
    )
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('calculates percentage correctly for small amounts', () => {
    render(<BudgetProgressBar income={100} spent={33} />)
    
    expect(screen.getByText('33% spent')).toBeInTheDocument()
  })
})







