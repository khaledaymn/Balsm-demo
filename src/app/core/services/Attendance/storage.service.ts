import { Injectable } from '@angular/core';
import { Attendance, Leave } from '../../../models/attendance.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly attendanceStorageKey = 'attendance_records';

  /**
   * Saves an attendance record to local storage.
   * @param record The attendance record to save.
   */
  saveAttendanceToLocalStorage(record: Attendance): void {
    const existingRecordsData = localStorage.getItem(this.attendanceStorageKey);
    const records: Attendance[] = existingRecordsData
      ? JSON.parse(existingRecordsData)
      : [];
    records.push(record);
    localStorage.setItem(this.attendanceStorageKey, JSON.stringify(records));
  }

  /**
   * Saves a leave record to local storage.
   * @param record The leave record to save.
   */
  saveLeaveToLocalStorage(record: Leave): void {
    const existingRecordsData = localStorage.getItem(this.attendanceStorageKey);
    const records: Leave[] = existingRecordsData
      ? JSON.parse(existingRecordsData)
      : [];
    records.push(record);
    localStorage.setItem(this.attendanceStorageKey, JSON.stringify(records));
  }

  /**
   * Retrieves attendance records from local storage.
   * @returns The raw attendance data string or null if not found.
   */
  getAttendanceRecords(): any {
    return localStorage.getItem(this.attendanceStorageKey);
  }
}
