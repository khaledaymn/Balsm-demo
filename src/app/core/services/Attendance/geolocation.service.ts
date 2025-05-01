// src/app/services/geolocation.service.ts
import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  getCurrentPosition(): Observable<{ latitude: number; longitude: number }> {
    return from(
      Geolocation.getCurrentPosition().then((position) => ({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }))
    );
  }
}
