import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { exhaustMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

// Assuming a service to handle forgot password requests
import { AuthService } from '../../core/services/auth.service';

// Define a typed interface for the form
interface ForgotPasswordForm {
  email: FormControl<string | null>;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup<ForgotPasswordForm>;
  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string>('');
  successMessage = signal(
    'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني!'
  );

  private fb = inject(FormBuilder);
  private authService = inject(AuthService); // Using AuthService for password reset
  private router = inject(Router);

  constructor() {
    this.forgotPasswordForm = this.fb.group<ForgotPasswordForm>({
      email: this.fb.control('', [Validators.required, Validators.email]),
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email } = this.forgotPasswordForm.value as { email: string };

    of(null)
      .pipe(
        exhaustMap(() =>
          this.authService.requestPasswordReset(email).pipe(
            tap(() => {
              this.isLoading.set(false);
              this.isSubmitted.set(true);
              this.forgotPasswordForm.reset();
            })
          )
        )
      )
      .subscribe({
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            'فشل إرسال الرابط. تحقق من البريد الإلكتروني وحاول مرة أخرى.'
          );
          console.error('Password reset error:', err);
        },
      });
  }

  backToLogin() {
    this.router.navigate(['/auth/login']);
  }

  // Getter for template access
  get emailControl(): FormControl<string | null> {
    return this.forgotPasswordForm.controls.email;
  }
}
