import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { exhaustMap, tap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

// Typed interface for the form
interface ResetPasswordForm {
  password: FormControl<string | null>;
  confirmPassword: FormControl<string | null>;
}

// Custom validator for password matching
function passwordMatchValidator(
  form: FormGroup
): { [key: string]: boolean } | null {
  const password = form.get('password')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  resetPasswordForm: FormGroup<ResetPasswordForm>;
  isTokenValidating = signal(true);
  isTokenValid = signal(false);
  isLoading = signal(false);
  submitted = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal<string>('');
  successMessage = signal(
    'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.'
  );

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    this.resetPasswordForm = this.fb.group(
      {
        password: this.fb.control('', [
          Validators.required,
          Validators.minLength(8),
        ]),
        confirmPassword: this.fb.control('', [Validators.required]),
      },
      { validators: passwordMatchValidator }
    );

    // Validate the reset token from the URL
    this.validateToken();
  }

  validateToken() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.isTokenValidating.set(false);
      this.isTokenValid.set(false);
      this.errorMessage.set('رمز إعادة التعيين غير صالح أو مفقود.');
      return;
    }

    this.authService
      .validateResetToken(token)
      .pipe(
        tap((response) => {
          this.isTokenValidating.set(false);
          this.isTokenValid.set(true);
        })
      )
      .subscribe({
        error: (err) => {
          this.isTokenValidating.set(false);
          this.isTokenValid.set(false);
          this.errorMessage.set(
            'رمز إعادة التعيين غير صالح أو منتهي الصلاحية.'
          );
          console.error('Token validation error:', err);
        },
      });
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { password } = this.resetPasswordForm.value as { password: string };
    const token = this.route.snapshot.queryParamMap.get('token')!;

    of(null)
      .pipe(
        exhaustMap(() =>
          this.authService.resetPassword(token, password).pipe(
            tap(() => {
              this.isLoading.set(false);
              this.submitted.set(true);
            })
          )
        )
      )
      .subscribe({
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set('فشل إعادة تعيين كلمة المرور. حاول مرة أخرى.');
          console.error('Reset password error:', err);
        },
      });
  }

  togglePasswordVisibility() {
    this.showPassword.update((current) => !current);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((current) => !current);
  }

  backToLogin() {
    this.router.navigate(['/auth/login']);
  }

  // Getters for template access
  get passwordControl(): FormControl<string | null> {
    return this.resetPasswordForm.controls.password;
  }

  get confirmPasswordControl(): FormControl<string | null> {
    return this.resetPasswordForm.controls.confirmPassword;
  }
}
