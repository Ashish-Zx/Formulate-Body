export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function isoToWeekday(iso: string): number {
  // 0 = Sunday ... 6 = Saturday
  return new Date(iso + "T00:00:00").getDay();
}

export function isoToDayNumber(iso: string): number {
  // Map Monday=1 ... Sunday=7 (Monday=1 in programme)
  const wd = isoToWeekday(iso);
  return wd === 0 ? 7 : wd;
}
