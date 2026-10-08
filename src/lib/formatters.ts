import type { CurrencyCode, NumberFormatType } from './types';

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string; defaultFormat: NumberFormatType }> = {
  INR: { symbol: '₹', name: 'Indian Rupee (INR)', defaultFormat: 'indian' },
  USD: { symbol: '$', name: 'US Dollar (USD)', defaultFormat: 'international' },
  EUR: { symbol: '€', name: 'Euro (EUR)', defaultFormat: 'international' },
  GBP: { symbol: '£', name: 'British Pound (GBP)', defaultFormat: 'international' },
  AED: { symbol: 'AED ', name: 'UAE Dirham (AED)', defaultFormat: 'international' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar (CAD)', defaultFormat: 'international' },
  AUD: { symbol: 'AU$', name: 'Australian Dollar (AUD)', defaultFormat: 'international' },
  SGD: { symbol: 'SG$', name: 'Singapore Dollar (SGD)', defaultFormat: 'international' },
};

/**
 * Formats a number according to the Indian numbering system (Lakhs & Crores)
 * e.g., 100000 -> 1,00,000
 */
export function formatIndianNumber(value: number): string {
  if (isNaN(value)) return '0';
  const isNegative = value < 0;
  const absVal = Math.round(Math.abs(value)).toString();

  if (absVal.length <= 3) {
    return (isNegative ? '-' : '') + absVal;
  }

  const lastThree = absVal.substring(absVal.length - 3);
  const remaining = absVal.substring(0, absVal.length - 3);

  // Group by 2s from right to left
  const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (isNegative ? '-' : '') + `${withCommas},${lastThree}`;
}

/**
 * Formats a number according to the International numbering system (Thousands & Millions)
 * e.g., 100000 -> 100,000
 */
export function formatInternationalNumber(value: number): string {
  if (isNaN(value)) return '0';
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Formats money with symbol and selected format
 */
export function formatCurrency(
  value: number,
  currencyCode: CurrencyCode = 'INR',
  formatType: NumberFormatType = 'indian'
): string {
  if (isNaN(value)) return `${CURRENCIES[currencyCode].symbol}0`;
  const symbol = CURRENCIES[currencyCode]?.symbol || '₹';
  const formatted = formatType === 'indian'
    ? formatIndianNumber(value)
    : formatInternationalNumber(value);

  return `${symbol}${formatted}`;
}

/**
 * Compact human-readable representation
 * e.g., 1,00,00,000 -> ₹1 Crore / $10M
 */
export function formatCompactCurrency(
  value: number,
  currencyCode: CurrencyCode = 'INR',
  formatType: NumberFormatType = 'indian'
): string {
  if (isNaN(value) || value === 0) return `${CURRENCIES[currencyCode].symbol}0`;
  const symbol = CURRENCIES[currencyCode].symbol;
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (formatType === 'indian') {
    if (absVal >= 10000000) {
      const cr = (absVal / 10000000).toFixed(2).replace(/\.00$/, '');
      return `${sign}${symbol}${cr} Cr`;
    }
    if (absVal >= 100000) {
      const lakh = (absVal / 100000).toFixed(2).replace(/\.00$/, '');
      return `${sign}${symbol}${lakh} L`;
    }
    if (absVal >= 1000) {
      const k = (absVal / 1000).toFixed(1).replace(/\.0$/, '');
      return `${sign}${symbol}${k} k`;
    }
    return `${sign}${symbol}${Math.round(absVal)}`;
  } else {
    if (absVal >= 1000000000) {
      return `${sign}${symbol}${(absVal / 1000000000).toFixed(2).replace(/\.00$/, '')}B`;
    }
    if (absVal >= 1000000) {
      return `${sign}${symbol}${(absVal / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
    }
    if (absVal >= 1000) {
      return `${sign}${symbol}${(absVal / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    }
    return `${sign}${symbol}${Math.round(absVal)}`;
  }
}

/**
 * Flexible input parser: parses numbers with commas, abbreviations (e.g. "10L", "1.5Cr", "50k", "2M")
 */
export function parseHumanNumber(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;

  const clean = input.trim().replace(/,/g, '').toLowerCase();

  // Match suffixes
  if (clean.endsWith('cr') || clean.endsWith('crore') || clean.endsWith('crores')) {
    const val = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(val) ? 0 : val * 10000000;
  }
  if (clean.endsWith('l') || clean.endsWith('lakh') || clean.endsWith('lakhs') || clean.endsWith('lac')) {
    const val = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(val) ? 0 : val * 100000;
  }
  if (clean.endsWith('k')) {
    const val = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(val) ? 0 : val * 1000;
  }
  if (clean.endsWith('m') || clean.endsWith('million')) {
    const val = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(val) ? 0 : val * 1000000;
  }
  if (clean.endsWith('b') || clean.endsWith('billion')) {
    const val = parseFloat(clean.replace(/[^\d.]/g, ''));
    return isNaN(val) ? 0 : val * 1000000000;
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Shareable URL state encoding and decoding
 */
export interface CalculatorShareState {
  ca?: number; // currentAmount
  ta?: number; // targetAmount
  r?: number;  // expectedAnnualReturn
  c?: number;  // contribution
  cf?: string; // contributionFrequency
  cmp?: string;// compoundingFrequency
  ct?: string; // contributionTiming
  su?: number; // annualStepUpPercent
  inf?: number;// inflationRate
  tax?: number;// taxRate
  exp?: number;// expenseRatio
  mode?: string;
}

export function encodeShareUrl(state: CalculatorShareState, basePath: string = ''): string {
  const params = new URLSearchParams();
  if (state.mode) params.set('mode', state.mode);
  if (state.ca !== undefined) params.set('ca', state.ca.toString());
  if (state.ta !== undefined) params.set('ta', state.ta.toString());
  if (state.r !== undefined) params.set('r', state.r.toString());
  if (state.c !== undefined) params.set('c', state.c.toString());
  if (state.cf) params.set('cf', state.cf);
  if (state.cmp) params.set('cmp', state.cmp);
  if (state.ct) params.set('ct', state.ct);
  if (state.su !== undefined && state.su > 0) params.set('su', state.su.toString());
  if (state.inf !== undefined && state.inf > 0) params.set('inf', state.inf.toString());
  if (state.tax !== undefined && state.tax > 0) params.set('tax', state.tax.toString());
  if (state.exp !== undefined && state.exp > 0) params.set('exp', state.exp.toString());

  return `${basePath}?${params.toString()}`;
}

export function decodeShareUrl(search: string): CalculatorShareState {
  const params = new URLSearchParams(search);
  const state: CalculatorShareState = {};

  if (params.get('mode')) state.mode = params.get('mode')!;
  if (params.get('ca')) state.ca = parseHumanNumber(params.get('ca')!);
  if (params.get('ta')) state.ta = parseHumanNumber(params.get('ta')!);
  if (params.get('r')) state.r = parseFloat(params.get('r')!);
  if (params.get('c')) state.c = parseHumanNumber(params.get('c')!);
  if (params.get('cf')) state.cf = params.get('cf')!;
  if (params.get('cmp')) state.cmp = params.get('cmp')!;
  if (params.get('ct')) state.ct = params.get('ct')!;
  if (params.get('su')) state.su = parseFloat(params.get('su')!);
  if (params.get('inf')) state.inf = parseFloat(params.get('inf')!);
  if (params.get('tax')) state.tax = parseFloat(params.get('tax')!);
  if (params.get('exp')) state.exp = parseFloat(params.get('exp')!);

  return state;
}

/**
 * Exports milestone schedule to CSV string
 */
export function exportScheduleToCsv(schedule: Array<Record<string, any>>, filename = 'projection.csv') {
  if (!schedule || schedule.length === 0) return;
  const headers = Object.keys(schedule[0]);
  const rows = schedule.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csvContent = [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
