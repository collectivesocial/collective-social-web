export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Safely format a date string for display.
 * Returns an empty string if the date is invalid or missing.
 */
export const safeFormatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
};

/**
 * Safely format a date string with month/day/year options.
 * Returns an empty string if the date is invalid or missing.
 */
export const safeFormatDateLong = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format a date as a coarse, human-readable relative time suitable for
 * "Created …" style labels — e.g. "today", "yesterday", "3 days ago",
 * "2 months ago", "1 year ago". Returns an empty string for missing or
 * invalid dates so callers can decide on a fallback.
 */
export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Future dates — fall back to "just now" rather than nonsense like "-3 days ago"
  if (diffMs < 0) return 'just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'just now';
  if (diffHour < 1) return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  if (diffDay < 1) return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffDay < 30) return diffWeek === 1 ? '1 week ago' : `${diffWeek} weeks ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffDay < 365) return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;

  const diffYear = Math.floor(diffDay / 365);
  return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
};
