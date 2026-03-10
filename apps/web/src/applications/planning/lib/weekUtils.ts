export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseWeekParam(str: string): Date {
  const d = new Date(str + "T00:00:00");
  return isNaN(d.getTime()) ? getMondayOf(new Date()) : getMondayOf(d);
}

export function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function formatWeekRange(monday: Date, locale: string): string {
  const sunday = addWeeks(monday, 1);
  sunday.setDate(sunday.getDate() - 1);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const startStr = monday.toLocaleDateString(locale, opts);
  const endStr = sunday.toLocaleDateString(locale, { ...opts, year: "numeric" });
  return `${startStr} – ${endStr}`;
}

export function formatDayHeader(date: Date, locale: string): { name: string; num: string; isToday: boolean } {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const name = date.toLocaleDateString(locale, { weekday: "short" });
  const num = String(date.getDate());
  return { name: name.charAt(0).toUpperCase() + name.slice(1), num, isToday };
}
