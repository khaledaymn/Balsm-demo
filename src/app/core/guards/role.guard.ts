import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    const userRoles = this.authService.getRoles(); // Use getRoles() from AuthService

    if (
      !userRoles.length ||
      !requiredRoles.some((role) => userRoles.includes(role))
    ) {
      this.router.navigate(['/auth/login']); // Or redirect to a "forbidden" page
      return false;
    }
    return true;
  }
}
