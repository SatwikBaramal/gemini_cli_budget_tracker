/**
 * Format a number as Indian Rupees currency
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "₹1,234")
 */
export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Format an ISO date string to a human-readable format
 * @param date - ISO date string or Date object
 * @returns Formatted date string (e.g., "8 Oct, 2:35 PM")
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const time = dateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `${day} ${month}, ${time}`;
}

/**
 * Get month name from month number (1-12)
 * @param monthNumber - Month number (1 = January, 12 = December)
 * @returns Month name
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
}


