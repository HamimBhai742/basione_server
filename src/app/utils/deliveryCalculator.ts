/**
 * Helper to get Amsterdam timezone date parts: year, month (0-11), day (1-31), hour (0-23)
 */
export const getAmsterdamParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  
  let year = date.getFullYear();
  let month = date.getMonth();
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  
  for (const part of parts) {
    if (part.type === "year") year = parseInt(part.value, 10);
    if (part.type === "month") month = parseInt(part.value, 10) - 1; // 0-indexed
    if (part.type === "day") day = parseInt(part.value, 10);
    if (part.type === "hour") hour = parseInt(part.value, 10);
    if (part.type === "minute") minute = parseInt(part.value, 10);
  }
  
  return { year, month, day, hour, minute };
};

/**
 * Returns a new Date object representing the given date shifted/constructed
 * in Amsterdam timezone context.
 */
export const getAmsterdamDateObj = (date: Date): Date => {
  const { year, month, day } = getAmsterdamParts(date);
  return new Date(year, month, day);
};

export const isWeekendInAmsterdam = (date: Date): boolean => {
  const amsterdamDate = getAmsterdamDateObj(date);
  const day = amsterdamDate.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

/**
 * Find the next workday (Mon-Fri) in Amsterdam timezone starting after the given date
 */
export const getNextWorkday = (date: Date): Date => {
  const nextDate = new Date(date.getTime());
  do {
    nextDate.setDate(nextDate.getDate() + 1);
  } while (isWeekendInAmsterdam(nextDate));
  return nextDate;
};

/**
 * Adds business days (excluding weekends) starting from a base date.
 */
export const addBusinessDays = (baseDate: Date, days: number): Date => {
  const resultDate = new Date(baseDate.getTime());
  let added = 0;
  while (added < days) {
    resultDate.setDate(resultDate.getDate() + 1);
    if (!isWeekendInAmsterdam(resultDate)) {
      added++;
    }
  }
  return resultDate;
};

export interface DeliveryDateRange {
  minDate: Date;
  maxDate: Date;
  formattedRange: string;
}

export const calculateDeliveryDate = (
  deliveryType: string,
  nowDate: Date = new Date()
): DeliveryDateRange => {
  const { hour } = getAmsterdamParts(nowDate);
  const isWeekend = isWeekendInAmsterdam(nowDate);
  
  let baseDate: Date;
  
  // 1. Determine base start date
  if (deliveryType === "express-delivery" || deliveryType === "express-pickup") {
    // Noon cut-off logic: if weekend or >= 12:00 PM, starts processing next workday
    if (isWeekend || hour >= 12) {
      baseDate = getNextWorkday(nowDate);
    } else {
      // If weekday and < 12:00 PM, starts processing today
      baseDate = getAmsterdamDateObj(nowDate);
    }
  } else {
    // Standard options (standard-delivery, standard-pickup):
    // Standard doesn't have strict noon cut-off, but if ordered on weekend, starts next workday
    if (isWeekend) {
      baseDate = getNextWorkday(nowDate);
    } else {
      baseDate = getAmsterdamDateObj(nowDate);
    }
  }
  
  let minDays = 0;
  let maxDays = 0;
  
  // 2. Determine number of business days to add based on delivery option
  switch (deliveryType) {
    case "express-pickup":
      // "Haal vandaag op (Bestel vóór 12:00 in Almere)"
      // If it started today, 0 days to add. If next workday, 0 days to add from next workday.
      minDays = 0;
      maxDays = 0;
      break;
    case "express-delivery":
      // "1-2 werkdagen"
      minDays = 1;
      maxDays = 2;
      break;
    case "standard-pickup":
      // "Klaar binnen 2-3 werkdagen"
      minDays = 2;
      maxDays = 3;
      break;
    case "standard-delivery":
    default:
      // "3-5 werkdagen"
      minDays = 3;
      maxDays = 5;
      break;
  }
  
  const minDate = addBusinessDays(baseDate, minDays);
  const maxDate = addBusinessDays(baseDate, maxDays);
  
  // 3. Format the date range in Dutch (nl-NL)
  const formatOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  
  // Helper to add "Vandaag, " or "Morgen, " prefixes
  const getFriendlyDateString = (targetDate: Date): string => {
    const todayObj = getAmsterdamDateObj(nowDate);
    
    // Check if same day as today
    const isToday = targetDate.getFullYear() === todayObj.getFullYear() &&
                    targetDate.getMonth() === todayObj.getMonth() &&
                    targetDate.getDate() === todayObj.getDate();
                    
    // Check if tomorrow
    const tomorrowObj = new Date(todayObj.getTime());
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const isTomorrow = targetDate.getFullYear() === tomorrowObj.getFullYear() &&
                       targetDate.getMonth() === tomorrowObj.getMonth() &&
                       targetDate.getDate() === tomorrowObj.getDate();
                       
    const rawFormat = capitalize(new Intl.DateTimeFormat("nl-NL", formatOptions).format(targetDate));
    
    if (isToday) {
      return `Vandaag (${rawFormat.toLowerCase()})`;
    }
    if (isTomorrow) {
      return `Morgen (${rawFormat.toLowerCase()})`;
    }
    return rawFormat;
  };
  
  let formattedRange = "";
  if (minDate.getTime() === maxDate.getTime()) {
    formattedRange = getFriendlyDateString(minDate);
  } else {
    const minStr = getFriendlyDateString(minDate);
    const maxStr = getFriendlyDateString(maxDate);
    formattedRange = `${minStr} - ${maxStr}`;
  }
  
  return {
    minDate,
    maxDate,
    formattedRange,
  };
};

/**
 * Formats a date to string using Europe/Amsterdam timezone and nl-NL locale
 */
export const formatAmsterdamDateTime = (date?: Date | string | null): string => {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(d);
};

