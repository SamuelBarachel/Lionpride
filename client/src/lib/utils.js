import { format, parseISO, isValid } from 'date-fns';

export const fmt = {
  currency: (v, symbol = '$') => {
    if (v == null) return '—';
    return `${symbol}${parseFloat(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
  date: (d) => {
    if (!d) return '—';
    try {
      const date = typeof d === 'string' ? parseISO(d) : d;
      return isValid(date) ? format(date, 'dd MMM yyyy') : '—';
    } catch { return '—'; }
  },
  dateShort: (d) => {
    if (!d) return '—';
    try {
      const date = typeof d === 'string' ? parseISO(d) : d;
      return isValid(date) ? format(date, 'dd MMM') : '—';
    } catch { return '—'; }
  },
  weight: (w) => w ? `${parseFloat(w).toFixed(1)} kg` : '—',
  number: (n) => n != null ? parseInt(n).toLocaleString() : '0',
};

export const statusColors = {
  active: 'status-active',
  sold: 'status-sold',
  deceased: 'status-deceased',
  transferred: 'status-transferred',
};

export const genderColors = {
  male: 'gender-male',
  female: 'gender-female',
};

export const goatEmoji = (gender) => gender === 'male' ? '🐐' : '🐑';

export const cls = (...args) => args.filter(Boolean).join(' ');
