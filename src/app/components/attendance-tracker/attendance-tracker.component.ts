import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environments';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
}

interface WorkLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface AttendanceStatus {
  isWithinLocation: boolean;
  locationName?: string;
  errorMessage?: string;
}

interface WorkPeriod {
  name: string;
  start: string;
  end: string;
}

interface AttendanceRecord {
  timeOfAttend: string;
  latitude: number;
  longitude: number;
  employeeId: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-attendance-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-tracker.component.html',
  styleUrls: ['./attendance-tracker.component.scss'],
})
export class AttendanceTrackerComponent implements OnInit, OnDestroy {
  currentTime: Date = new Date();
  checkInTime: Date | null = null;
  checkOutTime: Date | null = null;
  workHours = '00:00:00';
  isCheckedIn = false;
  isGettingLocation = false;
  isLoadingPeriod = true;
  status: AttendanceStatus = { isWithinLocation: false };
  workPeriod: WorkPeriod = { name: '', start: '', end: '' };
  notification: Notification | null = null;

  private updateInterval: any;
  private apiBaseUrl = environment.apiUrl;

  checkInLocation: LocationData | null = null;
  checkOutLocation: LocationData | null = null;

  allowedWorkLocations: WorkLocation[] = [
    {
      name: 'المكتب الرئيسي',
      latitude: 30.8070117,
      longitude: 30.9743125,
      radius: 500,
    },
    {
      name: 'المكتب الفرعي',
      latitude: 31.2180736,
      longitude: 29.9532288,
      radius: 700,
    },
  ];

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    if (!this.authService.hasRole('User')) {
      this.showNotification('غير مصرح لك باستخدام متتبع الحضور', 'error');
      return;
    }
    this.updateCurrentTime();
    this.updateInterval = setInterval(() => this.updateCurrentTime(), 1000);
    this.loadAttendanceData();
    this.fetchWorkPeriod();
    this.checkCurrentLocationStatus();
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  updateCurrentTime() {
    this.currentTime = new Date();
    if (this.isCheckedIn) {
      this.calculateWorkHours();
    }
  }

  async checkIn() {
    if (!this.authService.hasRole('User')) {
      this.showNotification('غير مصرح لك بتسجيل الحضور', 'error');
      return;
    }

    const currentTimeString = this.getCurrentTimeString();
    if (!this.canCheckIn(currentTimeString)) {
      this.showNotification(
        'لا يمكن تسجيل الحضور خارج فترة العمل الخاصة بك',
        'error'
      );
      return;
    }

    this.isGettingLocation = true;
    try {
      const location = await this.getCurrentLocation();
      const validation = this.validateLocation(location);

      if (validation.isWithinLocation) {
        const employeeId = this.authService.getUserId();
        if (!employeeId) throw new Error('معرف الموظف غير متوفر');

        const attendanceRecord: AttendanceRecord = {
          timeOfAttend: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          employeeId: employeeId,
        };

        await this.http
          .post(
            `${this.apiBaseUrl}/attendance/takeattendance`,
            attendanceRecord
          )
          .pipe(catchError(this.handleError))
          .toPromise();

        this.checkInTime = new Date();
        this.isCheckedIn = true;
        this.checkOutTime = null;
        this.checkInLocation = location;
        this.status = validation;
        this.saveLocalAttendanceData();
        this.calculateWorkHours();
        this.showNotification(
          `تم تسجيل الحضور بنجاح في ${validation.locationName}`,
          'success'
        );
      } else {
        this.showNotification('أنت خارج موقع العمل المسموح', 'error');
      }
    } catch (error: any) {
      this.status.errorMessage = error.message || 'فشل في تسجيل الحضور';
      this.showNotification(
        this.status.errorMessage ?? 'فشل في تسجيل الحضور',
        'error'
      );
    } finally {
      this.isGettingLocation = false;
    }
  }

  async checkOut() {
    if (!this.authService.hasRole('User')) {
      this.showNotification('غير مصرح لك بتسجيل الخروج', 'error');
      return;
    }

    const currentTimeString = this.getCurrentTimeString();
    if (!this.canCheckOut(currentTimeString)) {
      this.showNotification(
        'لا يمكن تسجيل الخروج قبل انتهاء فترة العمل الخاصة بك',
        'error'
      );
      return;
    }

    this.isGettingLocation = true;
    try {
      const location = await this.getCurrentLocation();
      const validation = this.validateLocation(location);

      if (validation.isWithinLocation) {
        const employeeId = this.authService.getUserId();
        if (!employeeId) throw new Error('معرف الموظف غير متوفر');

        const attendanceRecord: AttendanceRecord = {
          timeOfAttend: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          employeeId: employeeId,
        };

        await this.http
          .post(`${this.apiBaseUrl}/attendance/takeleave`, attendanceRecord)
          .pipe(catchError(this.handleError))
          .toPromise();

        this.checkOutTime = new Date();
        this.isCheckedIn = false;
        this.checkOutLocation = location;
        this.status = validation;
        this.saveLocalAttendanceData();
        this.showNotification(
          `تم تسجيل الخروج بنجاح من ${validation.locationName}`,
          'success'
        );
      } else {
        this.showNotification('أنت خارج موقع العمل المسموح', 'error');
      }
    } catch (error: any) {
      this.status.errorMessage = error.message || 'فشل في تسجيل الخروج';
      this.showNotification(
        this.status.errorMessage ?? 'فشل في تسجيل الخروج',
        'error'
      );
    } finally {
      this.isGettingLocation = false;
    }
  }

  async checkCurrentLocationStatus() {
    try {
      const location = await this.getCurrentLocation();
      this.status = this.validateLocation(location);
    } catch (error: any) {
      this.status.errorMessage = error.message;
      this.showNotification(
        error.message ?? 'حدث خطأ أثناء تحديد الموقع',
        'error'
      );
    }
  }

  private fetchWorkPeriod(): void {
    this.isLoadingPeriod = true;
    this.http
      .get<WorkPeriod>(`${this.apiBaseUrl}/user/work-period`)
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (period) => {
          this.workPeriod = period;
          this.saveLocalAttendanceData();
          this.isLoadingPeriod = false;
        },
        error: () => {
          this.workPeriod = { name: 'صباحي', start: '08:00', end: '16:00' };
          this.isLoadingPeriod = false;
        },
      });
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 3000);
  }

  private canCheckIn(currentTime: string): boolean {
    return (
      currentTime >= this.workPeriod.start && currentTime <= this.workPeriod.end
    );
  }

  private canCheckOut(currentTime: string): boolean {
    return currentTime >= this.workPeriod.end;
  }

  private getCurrentTimeString(): string {
    const currentHour = this.currentTime.getHours();
    const currentMinute = this.currentTime.getMinutes();
    return `${this.padZero(currentHour)}:${this.padZero(currentMinute)}`;
  }

  private validateLocation(location: LocationData): AttendanceStatus {
    for (const workLocation of this.allowedWorkLocations) {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        workLocation.latitude,
        workLocation.longitude
      );
      if (distance <= workLocation.radius) {
        return { isWithinLocation: true, locationName: workLocation.name };
      }
    }
    return { isWithinLocation: false };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  private getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('المتصفح لا يدعم تحديد الموقع'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }),
        (error) => {
          let errorMessage = 'حدث خطأ أثناء تحديد الموقع';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض الوصول إلى الموقع';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'معلومات الموقع غير متوفرة';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة طلب الموقع';
              break;
          }
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  calculateWorkHours() {
    if (!this.checkInTime) return;

    const endTime = this.checkOutTime || new Date();
    const diffMs = endTime.getTime() - this.checkInTime.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    this.workHours = `${this.padZero(hours)}:${this.padZero(
      minutes
    )}:${this.padZero(seconds)}`;
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private saveLocalAttendanceData(): void {
    const data = {
      checkInTime: this.checkInTime?.getTime() || null,
      checkOutTime: this.checkOutTime?.getTime() || null,
      isCheckedIn: this.isCheckedIn,
      checkInLocation: this.checkInLocation,
      checkOutLocation: this.checkOutLocation,
      workPeriod: this.workPeriod,
    };
    localStorage.setItem('attendanceData', JSON.stringify(data));
  }

  private loadAttendanceData(): void {
    const savedData = localStorage.getItem('attendanceData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        this.isCheckedIn = data.isCheckedIn;
        this.checkInTime = data.checkInTime ? new Date(data.checkInTime) : null;
        this.checkOutTime = data.checkOutTime
          ? new Date(data.checkOutTime)
          : null;
        this.checkInLocation = data.checkInLocation;
        this.checkOutLocation = data.checkOutLocation;
        this.workPeriod = data.workPeriod || {
          name: 'صباحي',
          start: '08:00',
          end: '16:00',
        };
        if (this.isCheckedIn) this.calculateWorkHours();
      } catch (error) {
        console.error('Failed to load attendance data:', error);
        localStorage.removeItem('attendanceData');
      }
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'حدث خطأ أثناء الاتصال بالخادم';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `خطأ: ${error.error.message}`;
    } else {
      errorMessage = `رمز الخطأ: ${error.status}, الرسالة: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
