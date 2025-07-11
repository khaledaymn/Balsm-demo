import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-role-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-select.component.html',
  styleUrls: ['./role-select.component.scss'],
})
export class RoleSelectComponent {
  constructor(public authService: AuthService, private router: Router) {}

  selectRole(role: string) {
    if (role === 'admin') {
      this.router.navigate(['/app/admin']);
    } else if (role === 'employee') {
      this.router.navigate(['/app/userDashboard']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']); // Redirect even if API fails
  }
}
