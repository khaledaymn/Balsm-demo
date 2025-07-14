import { Component, Signal, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';

// Interface for Shift data from localStorage
interface Shift {
  id: number;
  startTime: string;
  endTime: string;
  employeeId: string;
}

// Interface for Branch data from localStorage
interface Branch {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>نظام تسجيل الحضور والانصراف</h1>
      <button id="checkInBtn" [disabled]="!canCheckIn()" (click)="checkIn()">تسجيل الحضور</button>
      <button id="checkOutBtn" [disabled]="!canCheckOut()" (click)="checkOut()">تسجيل الانصراف</button>
      <div id="status">{{ status() }}</div>
    </div>
  `,
  styles: [`
    .container {
      font-family: Arial, sans-serif;
      text-align: center;
      direction: rtl;
      margin-top: 50px;
      background-color: #f4f4f4;
    }
    h1 {
      color: #333;
    }
    button {
      padding: 12px 24px;
      margin: 10px;
      font-size: 16px;
      cursor: pointer;
      border: none;
      border-radius: 5px;
      background-color: #4CAF50;
      color: white;
      transition: background-color 0.3s;
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
      background-color: #cccccc;
    }
    #status {
      margin-top: 20px;
      font-weight: bold;
      color: #333;
    }
  `]
})
export class AttendanceComponent {
  // Signals for reactive state management
  currentTime = signal(this.getCurrentTimeInMinutes());
  status = signal('لا توجد وردية نشطة الآن.');
  shifts = signal<Shift[]>(this.getShiftsFromLocalStorage());
  hasCheckedIn = signal(!!localStorage.getItem('checkedIn'));
  checkedInShift = signal<Shift | null>(this.getCheckedInShift());
isCheckout!:boolean;

  constructor() {
    // Update current time every minute
    interval(60000).subscribe(() => {
      this.currentTime.set(this.getCurrentTimeInMinutes());
      this.updateShiftsEveryHour();
      this.resetCheckInStatus();
    });

    // Effect to update button states and status reactively
    effect(() => {
      this.updateStatus();
    });

    // Initial shift fetch
    this.updateShiftsEveryHour();
  }

  // Convert time (HH:MM) to minutes since midnight
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Get current time in minutes
  private getCurrentTimeInMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  // Get shifts from localStorage
  private getShiftsFromLocalStorage(): Shift[] {
    const shiftsJson = localStorage.getItem('auth_shifts');
    return shiftsJson ? JSON.parse(shiftsJson) : [];
  }

  // Get branch (workplace) details from localStorage
  private getBranch(): Branch {
    const branchJson = localStorage.getItem('auth_branchName');
    return branchJson ? JSON.parse(branchJson) : {
      id: 1,
      name: 'البيت',
      latitude: 30.4524582,
      longitude: 30.974379,
      radius: 999999999
    };
  }

  // Get the shift that was checked in
  private getCheckedInShift(): Shift | null {
    const checkedInShiftIndex = localStorage.getItem('checkedInShiftIndex');
    if (checkedInShiftIndex !== null) {
      const shifts = this.getShiftsFromLocalStorage();
      return shifts[parseInt(checkedInShiftIndex)] || null;
    }
    return null;
  }

  // Check if there is an active shift
  private isShiftActive(): Shift | null {
    const currentMinutes = this.currentTime();
    const shift = this.shifts().find(shift => {
      let startMinutes = this.timeToMinutes(shift.startTime) - 10; // 10 minutes before shift
      let endMinutes = this.timeToMinutes(shift.endTime);
      // Handle shifts crossing midnight
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
        if (currentMinutes < startMinutes) {
          startMinutes -= 24 * 60;
          endMinutes -= 24 * 60;
        }
      }
      console.log(`Current: ${currentMinutes}, Shift: ${shift.startTime}-${shift.endTime}, Start: ${startMinutes}, End: ${endMinutes}`);
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
    console.log(`Is Shift Active: ${shift ? 'Yes' : 'No'}`);
    return shift || null;
  }

  // Calculate distance between two points in meters
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Check user's location
  private checkLocation(shift: Shift, successCallback: (lat: number, lon: number) => void, errorCallback: (error: string) => void) {
    const branch = this.getBranch();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const distance = this.getDistance(userLat, userLon, branch.latitude, branch.longitude);
          if (distance <= branch.radius) {
            successCallback(userLat, userLon);
          } else {
            errorCallback(`أنت لست في مكان العمل! موقعك الحالي: خط العرض ${userLat.toFixed(4)}, خط الطول ${userLon.toFixed(4)}`);
          }
        },
        () => errorCallback('فشل في الحصول على الموقع. تأكد من تفعيل إذن الموقع.')
      );
    } else {
      errorCallback('المتصفح لا يدعم خاصية تحديد الموقع.');
    }
  }

  // Update shifts every hour (mocked, replace with actual API call)
  private updateShiftsEveryHour() {
    const now = new Date();
    if (now.getMinutes() === 0) { // Run at the start of every hour
      console.log('Fetching shifts from server...');
      // Mock: Update localStorage with shifts (replace with actual HTTP call)
      const shifts: Shift[] = [{
        id: 43,
        startTime: '8:00',
        endTime: '12:00',
        employeeId: '1334b932-406a-4562-85eb-42ef187c748b'
      }];
      localStorage.setItem('auth_shifts', JSON.stringify(shifts));
      this.shifts.set(shifts);
      console.log('Shifts updated:', shifts);
    }
  }

  // Reset check-in status at the start of the first shift
  private resetCheckInStatus() {
    const currentMinutes = this.currentTime();
    const firstShiftStart = this.timeToMinutes(this.shifts()[0]?.startTime || '00:00');
    if (currentMinutes < firstShiftStart && currentMinutes > 12 * 60) {
      localStorage.removeItem('checkedIn');
      localStorage.removeItem('checkedInShiftIndex');
      this.hasCheckedIn.set(false);
      this.checkedInShift.set(null);
      console.log('Check-in status reset');
    }
  }

  // Update status and button states
  private updateStatus() {
    const activeShift = this.isShiftActive();
    const hasCheckedIn = this.hasCheckedIn();
    const checkedInShift = this.checkedInShift();

    if (!activeShift && !hasCheckedIn) {
      this.status.set('لا توجد وردية نشطة الآن.');
      return;
    }

    const currentMinutes = this.currentTime();

    if (activeShift && !hasCheckedIn) {
      this.status.set('يمكنك تسجيل الحضور الآن.');
      return;
    }

    if (hasCheckedIn && checkedInShift) {
      let shiftEnd = this.timeToMinutes(checkedInShift.endTime);
      if (shiftEnd < this.timeToMinutes(checkedInShift.startTime)) {
        shiftEnd += 24 * 60;
      }
      if (currentMinutes >= shiftEnd) {
        this.status.set('يمكنك تسجيل الانصراف الآن.');
      } else {
        this.status.set('تم تسجيل الحضور. انتظر حتى نهاية الوردية لتسجيل الانصراف.');
      }
    }
  }

  // Check if Check-In button should be enabled
  canCheckIn(): boolean {
    return this.isCheckout||!this.hasCheckedIn()&&!!this.isShiftActive()  ;
  }
  // Check if Check-Out button should be enabled
  canCheckOut(): boolean {
    const checkedInShift = this.checkedInShift();
    if (!this.hasCheckedIn() || !checkedInShift) return false;
    let shiftEnd = this.timeToMinutes(checkedInShift.endTime);
    if (shiftEnd < this.timeToMinutes(checkedInShift.startTime)) {
      shiftEnd += 24 * 60;
    }
    return this.currentTime() >= shiftEnd;
  }

  // Handle Check-In
  checkIn() {
    const activeShift = this.isShiftActive();
    if (!activeShift) {
      this.status.set('لا يمكن تسجيل الحضور خارج وقت الوردية!');
      return;
    }
    this.checkLocation(
      activeShift,
      (userLat, userLon) => {
        localStorage.setItem('checkedIn', 'true');
        localStorage.setItem('checkedInShiftIndex', this.shifts().indexOf(activeShift).toString());
        this.hasCheckedIn.set(true);
        this.checkedInShift.set(activeShift);
        this.status.set(`تم تسجيل الحضور بنجاح! موقعك الحالي: خط العرض ${userLat.toFixed(4)}, خط الطول ${userLon.toFixed(4)}`);
      },
      (error) => {
        this.status.set(error);
      }
    );
  }

  // Handle Check-Out
  checkOut() {
    const checkedInShift = this.checkedInShift();
    if (!checkedInShift) {
      this.status.set('لا يوجد تسجيل حضور سابق!');
      return;
    }
    this.checkLocation(
      checkedInShift,
      (userLat, userLon) => {
        localStorage.removeItem('checkedIn');
        localStorage.removeItem('checkedInShiftIndex');
        this.hasCheckedIn.set(false);
        // this.canCheckIn()
        this.isCheckout=true;
        this.checkedInShift.set(null);
        this.status.set(`تم تسجيل الانصراف بنجاح! موقعك الحالي: خط العرض ${userLat.toFixed(4)}, خط الطول ${userLon.toFixed(4)}`);
      },
      (error) => {
        this.status.set(error);
      }
    );
  }
}