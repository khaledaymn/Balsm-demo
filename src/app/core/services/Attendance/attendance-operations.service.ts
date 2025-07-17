import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, mergeMap, map } from 'rxjs/operators';
import { Shift } from '../../../models/shifts.model';
import { Branch } from '../../../models/branch.model';
import { environment } from '../../../../environments/environments';
import { AuthService } from '../auth.service';
import { LocationService } from './location.service';
import {
  Attendance,
  AttendanceStatus,
  Leave,
} from '../../../models/attendance.model';
import { StorageService } from './storage.service';
import { HttpUtilsService } from './http-utils.service';
import { ErrorHandlerService } from './error-handler.service';
import { TimeValidationService } from './time-validation.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class AttendanceOperationsService {
  private readonly apiUrl = environment.apiUrl + '/Attendance';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly locationService: LocationService,
    private readonly timeValidationService: TimeValidationService,
    private readonly storageService: StorageService,
    private readonly httpUtilsService: HttpUtilsService,
    private readonly errorHandlerService: ErrorHandlerService
  ) {}

  /**
   * Records an employee's check-in by automatically determining the shift.
   * @param employeeId The ID of the employee.
   * @param timestamp The time of check-in.
   * @returns An Observable emitting the Attendance record.
   */
  checkIn(employeeId: string, timestamp: Date): Observable<Attendance> {
    // Validate employee
    const userId = this.authService.getUserId();
    if (!userId || userId !== employeeId) {
      return throwError(() => new Error('Unauthorized: Invalid user ID'));
    }

    // Get shifts
    const shifts = this.authService.getShifts();
    console.log('Shifts:', shifts); // Debug: Inspect shifts array
    if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
      return throwError(() => new Error('No shifts available'));
    }

    // Ensure no null/undefined elements in shifts
    const validShifts = shifts.filter(
      (s): s is Shift => s !== null && s !== undefined
    );
    if (validShifts.length === 0) {
      return throwError(() => new Error('No valid shifts available'));
    }

    // Log shift details for debugging
    console.log(
      'Valid Shifts:',
      validShifts.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    );

    // Adjust timestamp for local time (same as findCurrentShift)
    const adjustedTimestamp = timestamp;
    adjustedTimestamp.setHours(adjustedTimestamp.getHours() + 3);
    console.log('Adjusted timestamp for check-in:', adjustedTimestamp); // Debug: Inspect adjusted timestamp

    // Determine the current shift based on timestamp
    const currentShift = this.findCurrentShift(validShifts, timestamp);
    if (!currentShift) {
      return throwError(
        () => new Error('No active shift found for the current time')
      );
    }
    console.log('Selected Shift (Check-In):', currentShift); // Debug: Inspect selected shift

    // Validate shift time (using TimeValidationService)
    const isWithinShift = this.timeValidationService.isWithinShiftTime(
      adjustedTimestamp,
      currentShift
    );
    console.log('Is within shift time?', isWithinShift); // Debug: Inspect isWithinShiftTime result
    if (!isWithinShift) {
      return throwError(() => new Error(`  ${currentShift.id}`));
    }

    // Check for early check-in restriction based on previous shift
    // const attendanceData = this.storageService.getAttendanceRecords();
    // const records: Attendance[] = attendanceData
    //   ? JSON.parse(attendanceData as string)
    //   : [];
    // console.log('Attendance Records:', records); // Debug: Inspect records
    // const earlyCheckInError = this.restrictEarlyCheckIn(
    //   records,
    //   currentShift.id,
    //   adjustedTimestamp
    // );
    // if (earlyCheckInError) {
    //   return throwError(() => earlyCheckInError);
    // }

    // Get branch
    const branch = this.authService.getBranchName() ?? undefined;
    console.log('Branch:', branch); // Debug: Inspect branch

    // Validate location and record attendance
    return this.validateLocationAndRecordAttendance(
      employeeId,
      currentShift.id,
      adjustedTimestamp,
      branch
    );
  }

  /**
   * Records an employee's check-out by determining the most recently ended shift.
   * @param employeeId The ID of the employee.
   * @param timestamp The time of check-out.
   * @returns An Observable emitting the Leave record.
   */
  checkOut(employeeId: string, timestamp: Date): Observable<Leave> {
    // Validate employee
    const userId = this.authService.getUserId();
    if (!userId || userId !== employeeId) {
      return throwError(() => new Error('Unauthorized: Invalid user ID'));
    }

    // Get shifts
    const shifts = this.authService.getShifts();
    console.log('Shifts:', shifts); // Debug: Inspect shifts array
    if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
      return throwError(() => new Error('No shifts available'));
    }

    // Ensure no null/undefined elements in shifts
    const validShifts = shifts.filter(
      (s): s is Shift => s !== null && s !== undefined
    );
    if (validShifts.length === 0) {
      return throwError(() => new Error('No valid shifts available'));
    }

    // Log shift details for debugging
    console.log(
      'Valid Shifts:',
      validShifts.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    );

    // Adjust timestamp for local time (same as findRecentlyEndedShift)
    const adjustedTimestamp = new Date(timestamp);
    adjustedTimestamp.setHours(adjustedTimestamp.getHours() + 3);
    console.log('Adjusted timestamp for check-out:', adjustedTimestamp); // Debug: Inspect adjusted timestamp

    // Determine the most recently ended shift based on timestamp
    const recentShift = this.findRecentlyEndedShift(validShifts, timestamp);
    if (!recentShift) {
      return throwError(
        () => new Error('No recently ended shift found for the current time')
      );
    }
    console.log('Selected Shift (Check-Out):', recentShift); // Debug: Inspect selected shift

    // Check if check-out time is after shift end
    const isAfterShiftEnd = this.timeValidationService.isShiftTimeEnd(
      adjustedTimestamp,
      recentShift
    );
    console.log('Is Check-Out After Shift End?', isAfterShiftEnd); // Debug: Inspect isShiftTimeEnd result
    if (!isAfterShiftEnd) {
      return throwError(
        () =>
          new Error(
            `Check-out time is outside the allowed window for shift ${recentShift.id}`
          )
      );
    }

    // Get branch
    const branch = this.authService.getBranchName() ?? undefined;
    console.log('Branch:', branch); // Debug: Inspect branch

    // Validate location and record leave
    return this.validateLocationAndRecordLeave(
      employeeId,
      recentShift.id,
      adjustedTimestamp,
      branch
    );
  }

  /**
   * Finds the active shift based on the current time (used for check-in).
   * @param shifts The list of available shifts.
   * @param timestamp The current timestamp.
   * @returns The active Shift or null if no shift matches.
   */
  public findCurrentShift(shifts: Shift[], timestamp: Date): Shift | null {
    const adjustedTimestamp = new Date(timestamp);
    adjustedTimestamp.setHours(adjustedTimestamp.getHours() + 3);
    const currentTime = adjustedTimestamp
      .toISOString()
      .split('T')[1]
      .substring(0, 5); // e.g., "22:05"
    console.log('Current time (HH:mm):', currentTime); // Debug: Inspect current time

    const currentTimeInSeconds = this.timeToSeconds(currentTime);

    for (const shift of shifts) {
      const startTime = this.timeValidationService.normalizeTime(
        shift.startTime
      ); // e.g., "21:00:00"
      const endTime = this.timeValidationService.normalizeTime(shift.endTime); // e.g., "01:00:00"
      const startTimeInSeconds = this.timeToSeconds(startTime);
      const endTimeInSeconds = this.timeToSeconds(endTime);

      console.log('Comparing shift:', {
        id: shift.id,
        startTime,
        endTime,
        currentTime,
      }); // Debug: Inspect comparison

      const spansMidnight = endTimeInSeconds < startTimeInSeconds;
      console.log('Does shift span midnight?', spansMidnight); // Debug: Inspect if shift spans midnight

      if (spansMidnight) {
        // Shift spans midnight (e.g., 21:00:00 to 01:00:00)
        if (
          currentTimeInSeconds >= startTimeInSeconds ||
          currentTimeInSeconds <= endTimeInSeconds
        ) {
          return shift;
        }
      } else {
        // Shift does not span midnight (e.g., 08:10:00 to 17:00:00)
        if (
          currentTimeInSeconds >= startTimeInSeconds &&
          currentTimeInSeconds <= endTimeInSeconds
        ) {
          return shift;
        }
      }
    }
    return null;
  }

  /**
   * Finds the shift that ended most recently before the current time (used for check-out).
   * @param shifts The list of available shifts.
   * @param timestamp The current timestamp.
   * @returns The recently ended Shift or null if no shift matches.
   */
  private findRecentlyEndedShift(
    shifts: Shift[],
    timestamp: Date
  ): Shift | null {
    const adjustedTimestamp = new Date(timestamp);
    adjustedTimestamp.setHours(adjustedTimestamp.getHours() + 3);
    const currentTime = adjustedTimestamp
      .toISOString()
      .split('T')[1]
      .substring(0, 5); // e.g., "21:54"
    console.log('Current time (HH:mm) for check-out:', currentTime); // Debug: Inspect current time

    const currentTimeInSeconds = this.timeToSeconds(currentTime);

    // Filter shifts that have ended (currentTime > endTime)
    const endedShifts = shifts
      .map((shift) => {
        const endTime = this.timeValidationService.normalizeTime(shift.endTime);
        const endTimeInSeconds = this.timeToSeconds(endTime);
        return { shift, endTime, endTimeInSeconds };
      })
      .filter(
        ({ endTimeInSeconds }) => currentTimeInSeconds >= endTimeInSeconds
      );

    if (endedShifts.length === 0) {
      console.log('No shifts have ended before the current time'); // Debug
      return null;
    }

    // Sort by endTime (descending) and pick the most recent
    endedShifts.sort((a, b) => b.endTimeInSeconds - a.endTimeInSeconds);
    const mostRecentShift = endedShifts[0].shift;

    console.log(
      'Ended shifts:',
      endedShifts.map(({ shift, endTime }) => ({
        id: shift.id,
        endTime,
      }))
    ); // Debug: Inspect ended shifts
    console.log('Most recently ended shift:', mostRecentShift); // Debug

    return mostRecentShift;
  }

  /**
   * Converts a time string (HH:mm or HH:mm:ss) to seconds for comparison.
   * @param time The time string in HH:mm or HH:mm:ss format.
   * @returns The time in seconds.
   */
  private timeToSeconds(time: string): number {
    const [hours, minutes, seconds = '00'] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60;
  }

  /**
   * Checks if check-in is too soon after a previous shift.
   * @param records The attendance records.
   * @param shiftId The current shift ID.
   * @param timestamp The check-in timestamp.
   * @returns An Error if check-in is restricted, or null if allowed.
   */
  private restrictEarlyCheckIn(
    records: Attendance[],
    shiftId: number | string,
    timestamp: Date
  ): Error | null {
    const recentRecord = records
      .filter((r) => String(r.shiftId) !== String(shiftId))
      .sort((a, b) => {
        const dateA = new Date(a.timeOfAttend);
        const dateB = new Date(b.timeOfAttend);
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!recentRecord) {
      console.log('No recent record found for early check-in restriction'); // Debug
      return null;
    }

    console.log('Recent Record:', recentRecord); // Debug: Inspect recent record
    console.log('Recent Record timeOfAttend:', recentRecord.timeOfAttend); // Debug: Inspect timeOfAttend

    // Validate timeOfAttend
    if (
      !recentRecord.timeOfAttend ||
      typeof recentRecord.timeOfAttend !== 'string'
    ) {
      console.warn(
        'Invalid timeOfAttend in recentRecord, skipping early check-in restriction'
      );
      return null;
    }

    const lastShiftEndTime = new Date(recentRecord.timeOfAttend);
    if (isNaN(lastShiftEndTime.getTime())) {
      console.warn(
        'Invalid date parsed from timeOfAttend:',
        recentRecord.timeOfAttend
      );
      return null;
    }

    const previousShift = this.authService
      .getShifts()
      .find((s) => String(s.id) === String(recentRecord.shiftId));
    if (!previousShift) {
      console.log(
        'Previous shift not found for shiftId:',
        recentRecord.shiftId
      ); // Debug
      return null;
    }

    const datePart = lastShiftEndTime.toISOString().split('T')[0];
    const previousShiftEnd = new Date(
      `${datePart}T${this.timeValidationService.normalizeTime(
        previousShift.endTime
      )}`
    );
    if (isNaN(previousShiftEnd.getTime())) {
      console.warn('Invalid previousShiftEnd time:', previousShift.endTime);
      return null;
    }

    const earliestCheckInTime = new Date(
      previousShiftEnd.getTime() + 60 * 60 * 1000
    );

    if (timestamp < earliestCheckInTime) {
      return new Error(
        `Cannot check in for shift ${shiftId}. It is too soon after the previous shift ended.`
      );
    }

    return null;
  }

  /**
   * Validates location and records attendance via HTTP.
   * @param employeeId The ID of the employee.
   * @param shiftId The ID of the shift.
   * @param timestamp The check-in timestamp.
   * @param branch The branch for location validation.
   * @returns An Observable emitting the Attendance record.
   */
  private validateLocationAndRecordAttendance(
    employeeId: string,
    shiftId: number | string,
    timestamp: Date,
    branch?: Branch
  ): Observable<Attendance> {
    return from(this.locationService.getCurrentLocation()).pipe(
      mergeMap((location) => {
        if (branch) {
          console.log('Validating location:', { location, branch }); // Debug: Inspect location and branch
          const validationResult = this.locationService.validateLocation(
            location,
            branch
          );
          console.log('Validation result:', validationResult); // Debug: Inspect validation outcome
          if (!validationResult.isWithinLocation) {
            return throwError(
              () =>
                new Error(
                  validationResult.errorMessage ||
                    `Employee ${employeeId} is not at required branch for shift ${shiftId}`
                )
            );
          }
        }

        const attendance: Attendance = {
          timeOfAttend: timestamp.toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          employeeId,
        };

        console.log('Sending attendance:', attendance); // Debug: Inspect request body
        return this.http
          .post(`${this.apiUrl}/TakeAttendance`, attendance, {
            headers: this.httpUtilsService.getHeaders(),
            responseType: 'text',
          })
          .pipe(
            map((response: any) => {
              console.log('Attendance response:', response); // Debug: Inspect server response
              this.storageService.saveAttendanceToLocalStorage(attendance);
              return attendance;
            }),
            catchError((error) => {
              console.error(
                'Attendance error:',
                error,
                'Details:',
                error.error
              ); // Debug: Log full error
              return this.errorHandlerService.handleError(error);
            })
          );
      }),
      catchError(this.errorHandlerService.handleError)
    );
  }

  /**
   * Validates location and records leave via HTTP.
   * @param employeeId The ID of the employee.
   * @param shiftId The ID of the shift.
   * @param timestamp The check-out timestamp.
   * @param branch The branch for location validation.
   * @returns An Observable emitting the Leave record.
   */
  private validateLocationAndRecordLeave(
    employeeId: string,
    shiftId: number | string,
    timestamp: Date,
    branch?: Branch
  ): Observable<Leave> {
    return from(this.locationService.getCurrentLocation()).pipe(
      mergeMap((location) => {
        if (branch) {
          console.log('Validating location:', { location, branch }); // Debug: Inspect location and branch
          const validationResult = this.locationService.validateLocation(
            location,
            branch
          );
          console.log('Validation result:', validationResult); // Debug: Inspect validation outcome
          if (!validationResult.isWithinLocation) {
            return throwError(
              () =>
                new Error(
                  validationResult.errorMessage ||
                    `Employee ${employeeId} is not at required branch for shift ${shiftId}`
                )
            );
          }
        }

        const leave: Leave = {
          timeOfLeave: timestamp.toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          employeeId,
        };

        console.log('Sending leave:', leave); // Debug: Inspect request body
        return this.http
          .post(`${this.apiUrl}/TakeLeave`, leave, {
            headers: this.httpUtilsService.getHeaders(),
            responseType: 'text',
          })
          .pipe(
            map((response: any) => {
              console.log('Leave response:', response); // Debug: Inspect server response
              this.storageService.saveLeaveToLocalStorage(leave);
              return leave;
            }),
            catchError((error) => {
              console.error('Leave error:', error, 'Details:', error.error); // Debug: Log full error
              return this.errorHandlerService.handleError(error);
            })
          );
      }),
      catchError(this.errorHandlerService.handleError)
    );
  }
}
