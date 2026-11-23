import { Platform } from 'react-native';

/**
 * Format number into currency string (e.g. ₹ 1,250.00)
 */
export const formatCurrency = (amount = 0, currency = '₹') => {
  const rounded = Number(amount || 0).toFixed(2);
  const parts = rounded.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${currency} ${parts.join('.')}`;
};

/**
 * Format quantity in litres (e.g. 25.50 L)
 */
export const formatLitres = (litres = 0) => {
  return `${Number(litres || 0).toFixed(2)} L`;
};

/**
 * Format date string YYYY-MM-DD into readable Indian date format
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format ISO datetime string into human readable format
 */
export const formatDateTime = (isoStr) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoStr;
  }
};

/**
 * Get today's local date string formatted as YYYY-MM-DD
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Export tabular data to CSV file and trigger browser download or mobile alert
 */
export const exportToCSV = (filename, headers, rows) => {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((field) => {
          const str = String(field ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    ),
  ].join('\n');

  if (Platform.OS === 'web') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    console.log(`[CSV Export ${filename}]:\n`, csvContent);
    alert(`CSV generated successfully (${rows.length} rows)`);
  }
};
