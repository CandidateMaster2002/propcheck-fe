/**
 * Format a Date object as YYYY-MM-DD in local time.
 */
export function toLocalYmd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayYmd() {
  return toLocalYmd(new Date());
}

export function getOffsetYmd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalYmd(d);
}

/**
 * Extract YYYY-MM-DD from an ISO string, space-separated datetime ("2026-11-26 10:00"), or timestamp.
 */
export function extractYmd(value) {
  if (!value) return '';
  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return toLocalYmd(parsed);
  }
  return '';
}

/**
 * Return the default datePreset when bookingFilter changes.
 */
export function getDefaultDatePresetForStatus(bookingFilter) {
  if (
    [
      'UNBOOKED',
      'PENDING_ENGINEER',
      'ENGINEER_ALLOTTED',
      'INSPECTION_DONE',
      'VALIDATION_DONE',
      'REPORT_SENT',
    ].includes(bookingFilter)
  ) {
    return 'TODAY';
  }
  return 'ALL';
}

/**
 * Filter leads by datePreset ('ALL' | 'TODAY' | 'TOMORROW' | 'YESTERDAY' | 'CUSTOM' | 'RANGE').
 * For UNBOOKED leads, matches against lead added/synced date (syncedAt || zohoModifiedTime).
 * For scheduled/booked leads, matches against inspectionDateAndTime (falling back to syncedAt if absent).
 */
export function filterLeadsByDate(leads, { bookingFilter, datePreset, customDate, rangeStart, rangeEnd }) {
  if (!Array.isArray(leads)) return [];

  const isUnbookedMode = bookingFilter === 'UNBOOKED';

  const getTargetYmd = (lead) => {
    if (isUnbookedMode) {
      return extractYmd(lead.syncedAt || lead.zohoModifiedTime);
    }
    return extractYmd(lead.inspectionDateAndTime || lead.date);
  };

  let filtered = leads;

  if (datePreset && datePreset !== 'ALL') {
    let targetStart = '';
    let targetEnd = '';

    if (datePreset === 'TODAY') {
      targetStart = targetEnd = getTodayYmd();
    } else if (datePreset === 'TOMORROW') {
      targetStart = targetEnd = getOffsetYmd(1);
    } else if (datePreset === 'YESTERDAY') {
      targetStart = targetEnd = getOffsetYmd(-1);
    } else if (datePreset === 'CUSTOM') {
      targetStart = targetEnd = customDate || '';
    } else if (datePreset === 'RANGE') {
      targetStart = rangeStart || '';
      targetEnd = rangeEnd || '';
    }

    if (targetStart || targetEnd) {
      filtered = leads.filter((lead) => {
        const ymd = getTargetYmd(lead);
        if (!ymd) return false;
        if (targetStart && ymd < targetStart) return false;
        if (targetEnd && ymd > targetEnd) return false;
        return true;
      });
    }
  }

  if (isUnbookedMode) {
    return [...filtered].sort((a, b) => {
      const da = new Date(a.syncedAt || a.zohoModifiedTime || 0).getTime();
      const db = new Date(b.syncedAt || b.zohoModifiedTime || 0).getTime();
      return db - da;
    });
  }

  return filtered;
}
