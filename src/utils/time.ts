export function getStartAndEndDates(openTime: string | null, closeTime: string | null): { start: Date | null, end: Date | null } {
    if (!openTime || !closeTime) {
      return { start: null, end: null };
    }
  
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
    const now = new Date();
    const start = new Date(now);
    start.setHours(openHour, openMinute, 0, 0);
  
    const end = new Date(now);
    end.setHours(closeHour, closeMinute, 0, 0);
  
    // Handle overnight case (e.g., opens 5 PM, closes 1 AM)
    if (end < start) {
      // If current time is after midnight but before close time, the period started yesterday
      if (now < end) {
        start.setDate(start.getDate() - 1);
      } else { // Otherwise, the period ends tomorrow
        end.setDate(end.getDate() + 1);
      }
    }
  
    return { start, end };
  } 