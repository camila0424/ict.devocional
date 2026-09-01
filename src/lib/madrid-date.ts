export function getMadridNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
}
