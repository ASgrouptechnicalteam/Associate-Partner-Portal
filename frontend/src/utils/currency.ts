/**
 * Formats a given number into standard Indian Rupee currency format (INR).
 * Enforces ₹ symbol, Indian numbering grouping (e.g. 1,00,000), and max 2 decimal places.
 * 
 * @param value The numerical value to format (string or number)
 * @returns Formatted currency string (e.g. "₹1,25,000" or "₹25,000.50")
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '₹0';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericValue);
};
