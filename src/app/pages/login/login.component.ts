import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router'; // Add RouterLink
import { inject } from '@angular/core';
import { exhaustMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

interface LoginForm {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  rememberMe: FormControl<boolean | null>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup<LoginForm>;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string>('');

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.fb.group<LoginForm>({
      email: this.fb.control('', [Validators.required, Validators.email]),
      password: this.fb.control('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      rememberMe: this.fb.control(false),
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update((current) => !current);
  }
  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value as {
      email: string;
      password: string;
    };

    of(null)
      .pipe(
        exhaustMap(() =>
          this.authService.login(email, password).pipe(
            tap(() => {
              this.isLoading.set(false);
              const roles = this.authService.getRoles();
              const isAdmin = this.authService.isAdmin();
              const isEmployee = this.authService.isEmployee();
              this.router.navigate(['/app/role-select']);
            })
          )
        )
      )
      .subscribe({
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            'فشل تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.'
          );
          console.error('Login error:', err);
        },
      });
  }

  get emailControl(): FormControl<string | null> {
    return this.loginForm.controls.email;
  }

  get passwordControl(): FormControl<string | null> {
    return this.loginForm.controls.password;
  }
}
