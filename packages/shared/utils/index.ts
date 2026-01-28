// Shared utility functions

// Spanish day/month names for consistent formatting (avoids hydration mismatch)
const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const day = DAYS_SHORT[date.getDay()];
  const month = MONTHS_SHORT[date.getMonth()];
  const dayNum = date.getDate();
  return `${day}, ${dayNum} ${month}`;
}

export function formatTime(dateString: string) {
  const date = new Date(dateString);
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

export function formatDateParts(dateString: string) {
  const date = new Date(dateString);
  return {
    day: DAYS_SHORT[date.getDay()],
    date: date.getDate(),
    month: MONTHS_SHORT[date.getMonth()],
    time: `${padZero(date.getHours())}:${padZero(date.getMinutes())}`,
  };
}

export function formatFullDate(dateString: string) {
  const date = new Date(dateString);
  const weekday = DAYS_LONG[date.getDay()];
  const dayNum = date.getDate();
  const month = MONTHS_LONG[date.getMonth()];
  return `${weekday}, ${dayNum} de ${month}`;
}

// Calculate gender counts from attendees array
export function calculateGenderCounts(attendees: Array<{ user?: { gender?: string } | null }> | null) {
  if (!attendees) return { total: 0, male: 0, female: 0 };

  let male = 0;
  let female = 0;

  for (const a of attendees) {
    if (a.user?.gender === 'male') male++;
    else if (a.user?.gender === 'female') female++;
  }

  return { total: attendees.length, male, female };
}

// Validate Instagram handle format
export function isValidInstagramHandle(handle: string | null | undefined): boolean {
  if (!handle) return false;
  // Instagram handles: 1-30 chars, letters, numbers, periods, underscores
  return /^[a-zA-Z0-9._]{1,30}$/.test(handle);
}

// Safely open Instagram profile
export function getInstagramUrl(handle: string | null | undefined): string | null {
  if (!isValidInstagramHandle(handle)) return null;
  return `https://instagram.com/${handle}`;
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

// cn utility for className merging (compatible with Tailwind)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
