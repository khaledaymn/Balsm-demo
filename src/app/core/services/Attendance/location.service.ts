import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AttendanceStatus,
  LocationData,
  WorkLocation,
} from '../../../models/attendance.model';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  userLocation = signal<LocationData | null>(null);

  getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('المتصفح لا يدعم تحديد الموقع'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          this.userLocation.set(location);
          resolve(location);
        },
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

  validateLocation(
    location: LocationData,
    workLocation: WorkLocation
  ): AttendanceStatus {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      workLocation.latitude,
      workLocation.longitude
    );
    if (distance <= workLocation.radius) {
      return { isWithinLocation: true, locationName: workLocation.name };
    }
    return {
      isWithinLocation: false,
      errorMessage: 'أنت خارج موقع العمل المسموح',
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
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
}
