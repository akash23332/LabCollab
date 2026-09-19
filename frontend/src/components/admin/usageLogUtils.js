// Format HH:MM to 12-hour format with AM/PM
export function formatTimeDisplay(timeStr) {
  if (!timeStr || timeStr === '—' || timeStr === 'In Progress') return timeStr || '—';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const padH = hour12.toString().padStart(2, '0');
  const padM = (mStr || '00').padStart(2, '0');
  return `${padH}:${padM} ${ampm}`;
}

// Format YYYY-MM-DD to "DD MMM YYYY"
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}

// Intelligent duration display helper:
// 107 -> "1h 47m", 46 -> "46m", 120 -> "2h"
export function formatDurationDisplay(minutes) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '—';
  const totalMins = Math.max(0, Math.round(minutes));
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;

  if (hours > 0 && remainingMins > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  if (hours > 0 && remainingMins === 0) {
    return `${hours}h`;
  }
  return `${remainingMins}m`;
}
