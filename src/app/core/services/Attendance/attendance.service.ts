import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Shift } from '../../../models/shifts.model';
import { Branch } from '../../../models/branch.model';
import { AuthService } from '../auth.service';
import { LocationService } from './location.service';
import { Attendance } from '../../../models/attendance.model';
import { StorageService } from './storage.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  constructor(
    private readonly authService: AuthService,
    private readonly locationService: LocationService,
    private readonly storageService: StorageService
  ) {}

  /**
   * Retrieves attendance records for a specific employee from local storage.
   * @param employeeId The ID of the employee.
   * @returns An Observable emitting an array of Attendance records.
   */
  getAttendanceRecords(employeeId: string): Observable<Attendance[]> {
    return new Observable((observer) => {
      try {
        const attendanceData = this.storageService.getAttendanceRecords();
        if (attendanceData) {
          const records: Attendance[] = JSON.parse(attendanceData);
          const employeeRecords = records.filter(
            (record) => record.employeeId === employeeId
          );
          observer.next(employeeRecords);
        } else {
          observer.next([]);
        }
        observer.complete();
      } catch (error) {
        observer.error(new Error('Failed to retrieve attendance records.'));
      }
    });
  }

  /**
   * Checks if an employee is present for a specific shift at a given time.
   * @param employeeId The ID of the employee.
   * @param shiftId The ID of the shift.
   * @param timestamp The time to check presence.
   * @returns An Observable emitting a boolean indicating presence.
   */
  isEmployeePresent(
    employeeId: string,
    shiftId: number,
    timestamp: Date
  ): Observable<boolean> {
    const userId = this.authService.getUserId();
    if (!userId || userId !== employeeId) {
      return throwError(() => new Error('Unauthorized: Invalid user ID'));
    }

    const shifts = this.authService.getShifts();
    if (!shifts || shifts.length === 0) {
      return throwError(() => new Error('No shifts available'));
    }

    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) {
      return of(false);
    }

    return this.getAttendanceRecords(employeeId).pipe(
      map((records) => {
        const shiftStart = new Date(shift.startTime);
        const shiftEnd = new Date(shift.endTime);

        return records.some((r) => {
          const attendTime = new Date(r.timeOfAttend);
          let isWithinLocation = true;
          const branch = this.authService.getBranchName();
          if (branch) {
            const location = {
              latitude: r.latitude,
              longitude: r.longitude,
              accuracy: 0,
              timestamp: 0,
            };
            const validationResult = this.locationService.validateLocation(
              location,
              branch
            );
            isWithinLocation = validationResult.isWithinLocation;
          }

          return (
            attendTime >= shiftStart &&
            attendTime <= shiftEnd &&
            attendTime <= timestamp &&
            r.shiftId === shiftId &&
            isWithinLocation
          );
        });
      })
    );
  }
}
