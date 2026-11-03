export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  CONFIRMED: 'confirmed',
  MISSED: 'missed',
};

export const CATEGORIES = ['Morning', 'Night', 'Other'];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const POLL_INTERVAL = 5000;

export const LED_MAP = {
  Morning: 'D6',
  Night: 'D7',
  Other: 'N/A',
};
