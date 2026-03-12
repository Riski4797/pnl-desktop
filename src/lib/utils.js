export const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Safely extract just the YYYY-MM-DD part from date strings (which might have times now)
export const getDateOnly = (dateString) => dateString ? dateString.split('T')[0] : '';

export const getStartOfWeek = (dateString) => {
  const date = new Date(getDateOnly(dateString));
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
};
