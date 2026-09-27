export const AMSTERDAM_TIMEZONE = "Europe/Amsterdam";

const DUTCH_WEEKDAYS: Record<string, string> = {
  Sun: "Zo",
  Mon: "Ma",
  Tue: "Di",
  Wed: "Wo",
  Thu: "Do",
  Fri: "Vr",
  Sat: "Za",
};

const DUTCH_MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mrt",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

export const ALL_DUTCH_MONTHS = [
  "Jan",
  "Feb",
  "Mrt",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

/**
 * Returns breakdown of a date into Amsterdam local time parts
 */
export function getAmsterdamComponents(date: Date | string = new Date()) {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: AMSTERDAM_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const rawHour = parseInt(get("hour"), 10);

  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10), // 1-12
    day: parseInt(get("day"), 10),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: parseInt(get("minute"), 10),
    second: parseInt(get("second"), 10),
    weekday: get("weekday"),
    dutchWeekday: DUTCH_WEEKDAYS[get("weekday")] || get("weekday"),
    dutchMonth: DUTCH_MONTHS[parseInt(get("month"), 10)] || "",
  };
}

/**
 * Calculates current UTC offset in minutes for Amsterdam timezone at the given date
 */
export function getAmsterdamOffsetMinutes(date: Date = new Date()): number {
  const parts = getAmsterdamComponents(date);
  const asUTC = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

/**
 * Returns the exact UTC Date corresponding to 00:00:00.000 in Amsterdam
 */
export function getAmsterdamMidnight(date: Date | string = new Date()): Date {
  const parts = getAmsterdamComponents(date);
  const approxUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0));
  const offsetMin = getAmsterdamOffsetMinutes(approxUtc);
  return new Date(approxUtc.getTime() - offsetMin * 60000);
}

/**
 * Returns the exact UTC Date corresponding to 23:59:59.999 in Amsterdam
 */
export function getAmsterdamEndOfDay(date: Date | string = new Date()): Date {
  const midnight = getAmsterdamMidnight(date);
  return new Date(midnight.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Returns the start of Amsterdam day `daysAgo` days ago
 */
export function getAmsterdamDaysAgoMidnight(daysAgo: number): Date {
  const now = new Date();
  const todayMidnight = getAmsterdamMidnight(now);
  // Subtract N days
  const targetDate = new Date(todayMidnight.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return getAmsterdamMidnight(targetDate);
}

/**
 * Label formatters for dashboard charts
 */
export function getAmsterdamHourLabel(date: Date | string): string {
  const parts = getAmsterdamComponents(date);
  return `${String(parts.hour).padStart(2, "0")}:00`;
}

export function getAmsterdamDayWeekdayLabel(date: Date | string): string {
  const parts = getAmsterdamComponents(date);
  return `${parts.day} ${parts.dutchWeekday}`;
}

export function getAmsterdamDayMonthLabel(date: Date | string): string {
  const parts = getAmsterdamComponents(date);
  return `${parts.day} ${parts.dutchMonth}`;
}

export function getAmsterdamMonthLabel(date: Date | string): string {
  const parts = getAmsterdamComponents(date);
  return parts.dutchMonth;
}

export function getAmsterdamMonthYearLabel(date: Date | string): string {
  const parts = getAmsterdamComponents(date);
  return `${parts.dutchMonth} ${parts.year}`;
}
