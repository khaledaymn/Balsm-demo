import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAppInitializer, inject } from '@angular/core';
import { appRoutes } from './app.routes';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { NgModule, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return lastValueFrom(authService.checkAuthStatus()).catch((err) => {
        console.error('Failed to check auth status on init:', err);
        return null;
      });
    }),
    { provide: LOCALE_ID, useValue: 'ar' },
  ],
};
