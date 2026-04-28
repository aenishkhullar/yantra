/**
 * Formats a number as USD currency
 * @param {number} value - The number to format
 * @param {boolean} includeSign - Whether to include + or - sign for P&L
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, includeSign = false) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (includeSign) {
    if (value > 0.005) return `+${formatted}`;
    if (value < -0.005) return `-${formatted}`;
  }
  
  return value < -0.005 ? `-${formatted}` : formatted;
};

export default formatCurrency;
