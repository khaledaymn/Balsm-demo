import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  resetPasswordForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  submitted = signal(false);
  email: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );

    this.email = this.route.snapshot.queryParamMap.get('email');
    if (this.email) {
      this.resetPasswordForm.patchValue({ email: this.email });
    }

    // Navigate to login after successful submission
    effect(() => {
      if (this.submitted() && !this.errorMessage()) {
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      }
    });
  }

  passwordMatchValidator(form: FormGroup): { mismatch: boolean } | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.resetPasswordForm.invalid) {
      this.errorMessage.set('يرجى ملء جميع الحقول بشكل صحيح.');
      console.log('Form invalid:', this.resetPasswordForm.value);
      return;
    }

    const { password, email } = this.resetPasswordForm.value;
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!email || !token) {
      this.errorMessage.set('البريد الإلكتروني أو رمز إعادة التعيين مفقود.');
      console.log('Missing email or token:', { email, token });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    console.log('Submitting:', { email, token, password });

    this.authService.resetPassword(password, email, token).subscribe({
      next: (response: { success: boolean; message?: string }) => {
        console.log(password, email, token), this.isLoading.set(false);
        if (response.success) {
          this.submitted.set(true);
        } else {
          this.errorMessage.set(
            response.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور.'
          );
        }
      },
      error: (err: HttpErrorResponse) => {
        console.log(password, email, token), this.isLoading.set(false);
        let errorMsg = 'فشل إعادة تعيين كلمة المرور.';
        if (err.status === 400) {
          errorMsg = 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية.';
        } else if (err.status === 404) {
          errorMsg = 'البريد الإلكتروني غير موجود.';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        this.errorMessage.set(errorMsg);
        console.error('Reset password error:', {
          status: err.status,
          message: err.message,
          error: err.error,
        });
      },
    });
  }
}
