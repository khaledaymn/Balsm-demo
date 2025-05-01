/**
 * Normalizes a time string to HH:mm:ss format.
 * @param time The time string to normalize.
 * @returns The normalized time string in HH:mm:ss format.
 */
export function normalizeTime(time: string): string {
  const parts = time.split(':');
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1]?.split(' ')[0]?.padStart(2, '0') || '00';
  return `${hours}:${minutes}:00`;
}
