import { format, parseISO, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  try {
    if (timeStr.includes('T')) return format(parseISO(timeStr), 'hh:mm a');
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m), 0);
    return format(d, 'hh:mm a');
  } catch { return timeStr; }
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = dateStr.includes('T') ? parseISO(dateStr) : new Date(dateStr + 'T00:00:00');
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd MMM yyyy');
  } catch { return dateStr; }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a'); } catch { return dateStr; }
};

export const formatRelative = (dateStr) => {
  if (!dateStr) return '—';
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }); } catch { return dateStr; }
};

export const todayIST = () => format(new Date(), 'yyyy-MM-dd');
