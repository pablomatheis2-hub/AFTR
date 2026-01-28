// Shared utility functions

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateParts(dateString: string) {
  const date = new Date(dateString);
  return {
    day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
    date: date.getDate(),
    month: date.toLocaleDateString('es-ES', { month: 'short' }),
    time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function formatFullDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
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
