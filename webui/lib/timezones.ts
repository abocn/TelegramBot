import moment from 'moment-timezone';

const allTimezones = moment.tz.names();

export const timezones = allTimezones.map(tz => {
  const offset = moment.tz(tz).format('Z');
  const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
  return {
    value: tz,
    label: `${city} (${offset}) - ${tz}`
  };
}).sort((a, b) => a.label.localeCompare(b.label));

export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.round((Math.abs(offset) - hours) * 60);
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    return '+00:00';
  }
}