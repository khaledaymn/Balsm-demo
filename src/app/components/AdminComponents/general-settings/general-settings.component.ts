import { Component, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { CommonModule } from '@angular/common';
import { GeneralSettings } from '../../../models/general-settings.model';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class GeneralSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  loading = signal(false);
  saveLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.settingsForm = this.fb.group({
      numberOfVacationsInYear: [
        null,
        [Validators.required, Validators.min(0), Validators.max(365)],
      ],
      rateOfExtraAndLateHour: [null, [Validators.required, Validators.min(0)]],
      numberOfDayWorkingHours: [
        null,
        [Validators.required, Validators.min(1), Validators.max(24)],
      ],
    });
  }

  ngOnInit(): void {
    this.getSettings();
  }

  getSettings(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<GeneralSettings>(
        `${environment.apiUrl}/GeneralSettings/GetGeneralSetting`
      )
      .pipe(
        tap((settings) => {
          this.settingsForm.patchValue(settings);
        }),
        catchError((err) => {
          console.error('Error fetching settings:', err);
          this.error.set(
            'حدث خطأ أثناء جلب الإعدادات. يرجى المحاولة مرة أخرى.'
          );
          // For demo purposes, set default values if API fails
          this.settingsForm.patchValue({
            numberOfVacationsInYear: 0,
            rateOfExtraAndLateHour: 0,
            numberOfDayWorkingHours: 0,
          });
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe();
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.markFormGroupTouched(this.settingsForm);
      return;
    }

    this.saveLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    const settings: GeneralSettings = this.settingsForm.value;

    this.http
      .put<GeneralSettings>(
        `${environment.apiUrl}/GeneralSettings/UpdateGeneralSetting`,
        settings
      )
      .pipe(
        tap(() => {
          this.success.set('تم حفظ الإعدادات بنجاح');
          setTimeout(() => this.success.set(null), 5000);
        }),
        catchError((err) => {
          console.error('Error saving settings:', err);
          this.error.set(
            'حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.'
          );
          return of(null);
        }),
        finalize(() => {
          this.saveLoading.set(false);
        })
      )
      .subscribe();
  }

  resetForm(): void {
    this.getSettings();
    this.success.set(null);
    this.error.set(null);
  }

  clearMessages(): void {
    this.success.set(null);
    this.error.set(null);
  }

  // Helper method to mark all controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  // Form validation helpers
  hasError(controlName: string, errorName: string): boolean {
    const control = this.settingsForm.get(controlName);
    return (control?.touched && control?.hasError(errorName)) || false;
  }
}
