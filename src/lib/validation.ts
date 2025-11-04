/**
 * Shared validation utilities for the budget tracking application
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates income value
 */
export function validateIncome(income: unknown): ValidationResult {
  if (income === null || income === undefined) {
    return { valid: false, error: 'Income is required' };
  }

  const numIncome = Number(income);
  
  if (isNaN(numIncome)) {
    return { valid: false, error: 'Income must be a valid number' };
  }
  
  if (numIncome <= 0) {
    return { valid: false, error: 'Income must be greater than zero' };
  }
  
  if (numIncome > 999999999) {
    return { valid: false, error: 'Income value is too large (max: 999,999,999)' };
  }
  
  return { valid: true };
}

/**
 * Validates month value (1-12)
 */
export function validateMonth(month: unknown): ValidationResult {
  if (month === null || month === undefined) {
    return { valid: false, error: 'Month is required' };
  }

  const numMonth = Number(month);
  
  if (isNaN(numMonth)) {
    return { valid: false, error: 'Month must be a valid number' };
  }
  
  if (!Number.isInteger(numMonth)) {
    return { valid: false, error: 'Month must be an integer' };
  }
  
  if (numMonth < 1 || numMonth > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }
  
  return { valid: true };
}

/**
 * Validates amount/cost value
 */
export function validateAmount(amount: unknown, fieldName: string = 'Amount'): ValidationResult {
  if (amount === null || amount === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (numAmount <= 0) {
    return { valid: false, error: `${fieldName} must be greater than zero` };
  }
  
  if (numAmount > 999999999) {
    return { valid: false, error: `${fieldName} is too large (max: 999,999,999)` };
  }
  
  return { valid: true };
}

/**
 * Validates expense name
 */
export function validateExpenseName(name: unknown): ValidationResult {
  if (name === null || name === undefined) {
    return { valid: false, error: 'Expense name is required' };
  }

  if (typeof name !== 'string') {
    return { valid: false, error: 'Expense name must be a string' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { valid: false, error: 'Expense name cannot be empty' };
  }
  
  if (trimmedName.length > 200) {
    return { valid: false, error: 'Expense name is too long (max: 200 characters)' };
  }
  
  return { valid: true };
}

/**
 * Validates year value
 */
export function validateYear(year: unknown): ValidationResult {
  if (year === null || year === undefined) {
    return { valid: false, error: 'Year is required' };
  }

  const numYear = Number(year);
  
  if (isNaN(numYear)) {
    return { valid: false, error: 'Year must be a valid number' };
  }
  
  if (!Number.isInteger(numYear)) {
    return { valid: false, error: 'Year must be an integer' };
  }
  
  if (numYear < 2000 || numYear > 2100) {
    return { valid: false, error: 'Year must be between 2000 and 2100' };
  }
  
  return { valid: true };
}

/**
 * Validates date range
 */
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  if (!startDate || !endDate) {
    // Allow empty date ranges (no filtering)
    return { valid: true };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Start date is invalid' };
  }
  
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'End date is invalid' };
  }
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before or equal to end date' };
  }
  
  return { valid: true };
}

/**
 * Validates amount range
 */
export function validateAmountRange(min: number, max: number): ValidationResult {
  if (typeof min !== 'number' || typeof max !== 'number') {
    return { valid: false, error: 'Amount range values must be numbers' };
  }
  
  if (isNaN(min) || isNaN(max)) {
    return { valid: false, error: 'Amount range values must be valid numbers' };
  }
  
  if (min < 0) {
    return { valid: false, error: 'Minimum amount cannot be negative' };
  }
  
  if (max < 0) {
    return { valid: false, error: 'Maximum amount cannot be negative' };
  }
  
  if (min > max) {
    return { valid: false, error: 'Minimum amount must be less than or equal to maximum amount' };
  }
  
  return { valid: true };
}

/**
 * Validates an array of months
 */
export function validateMonthArray(months: unknown): ValidationResult {
  if (!Array.isArray(months)) {
    return { valid: false, error: 'Applicable months must be an array' };
  }
  
  if (months.length === 0) {
    return { valid: false, error: 'At least one month must be selected' };
  }
  
  for (const month of months) {
    const result = validateMonth(month);
    if (!result.valid) {
      return result;
    }
  }
  
  // Check for duplicates
  const uniqueMonths = new Set(months);
  if (uniqueMonths.size !== months.length) {
    return { valid: false, error: 'Duplicate months are not allowed' };
  }
  
  return { valid: true };
}










