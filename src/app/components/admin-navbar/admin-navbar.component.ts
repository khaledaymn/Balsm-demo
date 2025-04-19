import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.scss'],
})
export class AdminNavbarComponent implements OnInit {
  currentUser: { name: string; role: string; avatar: string } = {
    name: 'Guest',
    role: 'Unknown',
    avatar: 'assets/images/default-avatar.png', // Default avatar
  };
  isDropdownOpen = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    if (this.authService.isLoggedIn()) {
      const roles = this.authService.getRoles();
      this.currentUser = {
        name: 'User Name', // Replace with actual user name from backend or service
        role: roles.length > 0 ? roles[0] : 'User', // Use first role or fallback
        avatar: 'assets/images/user-avatar.png', // Replace with actual avatar URL
      };
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        window.location.href = '/auth/login'; // Redirect after logout
      },
      error: () => {
        console.error('Logout failed:');
        window.location.href = '/auth/login'; // Redirect even on error
      },
    });
  }
}
