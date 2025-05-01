import { Injectable } from '@angular/core';
import { Shift } from '../../../models/shifts.model';

@Injectable({
  providedIn: 'root',
})
export class TimeValidationService {
  /**
   * Normalizes a time string to HH:mm:ss format.
   * @param time The time string (e.g., "21:00" or "21:00:00").
   * @returns The normalized time string.
   */
  normalizeTime(time: string): string {
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${time}:00`;
    }
    return time;
  }

  /**
   * Checks if the given timestamp is within the shift's time window.
   * @param timestamp The timestamp to check.
   * @param shift The shift to compare against.
   * @returns True if the timestamp is within the shift's time window, false otherwise.
   */
  isWithinShiftTime(timestamp: Date, shift: Shift): boolean {
    const currentTime = timestamp.toISOString().split('T')[1].substring(0, 5); // e.g., "22:23"
    const startTime = this.normalizeTime(shift.startTime); // e.g., "21:00:00"
    const endTime = this.normalizeTime(shift.endTime); // e.g., "01:00:00"

    const currentTimeInSeconds = this.timeToSeconds(currentTime);
    const startTimeInSeconds = this.timeToSeconds(startTime);
    const endTimeInSeconds = this.timeToSeconds(endTime);

    console.log('isWithinShiftTime - Current time (HH:mm):', currentTime); // Debug
    console.log('isWithinShiftTime - Shift:', { startTime, endTime }); // Debug

    const spansMidnight = endTimeInSeconds < startTimeInSeconds;
    if (spansMidnight) {
      return (
        currentTimeInSeconds >= startTimeInSeconds ||
        currentTimeInSeconds <= endTimeInSeconds
      );
    } else {
      return (
        currentTimeInSeconds >= startTimeInSeconds &&
        currentTimeInSeconds <= endTimeInSeconds
      );
    }
  }

  /**
   * Checks if the given timestamp is after the shift's end time.
   * @param timestamp The timestamp to check.
   * @param shift The shift to compare against.
   * @returns True if the timestamp is after the shift's end time, false otherwise.
   */
  isShiftTimeEnd(timestamp: Date, shift: Shift): boolean {
    const currentTime = timestamp.toISOString().split('T')[1].substring(0, 5); // e.g., "22:23"
    const endTime = this.normalizeTime(shift.endTime); // e.g., "01:00:00"

    const currentTimeInSeconds = this.timeToSeconds(currentTime);
    const endTimeInSeconds = this.timeToSeconds(endTime);

    console.log('isShiftTimeEnd - Current time (HH:mm):', currentTime); // Debug
    console.log('isShiftTimeEnd - Shift endTime:', endTime); // Debug

    const spansMidnight =
      this.timeToSeconds(this.normalizeTime(shift.startTime)) >
      endTimeInSeconds;
    if (spansMidnight) {
      return (
        currentTimeInSeconds > endTimeInSeconds &&
        currentTimeInSeconds <
          this.timeToSeconds(this.normalizeTime(shift.startTime))
      );
    } else {
      return currentTimeInSeconds > endTimeInSeconds;
    }
  }

  /**
   * Converts a time string (HH:mm or HH:mm:ss) to seconds for comparison.
   * @param time The time string in HH:mm or HH:mm:ss format.
   * @returns The time in seconds.
   */
  private timeToSeconds(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
}
