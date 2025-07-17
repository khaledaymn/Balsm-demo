import { Component, OnInit ,HostListener} from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterLink, RouterLinkActive, Router } from "@angular/router"
import { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-top-nav",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: "./top-nav.component.html",
  styleUrls: ["./top-nav.component.scss"],
})
export class TopNavComponent implements OnInit {
  userInfo: any = null
  isLoading = false
  isMenuOpen = false;
  isMobile = window.innerWidth <= 768;
  isLogoutConfirmationVisible = false;
  isOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if(this.authService.isAdmin() && this.authService.isEmployee()){
      this.isOpen = true
    }
    this.loadUserInfo()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
    console.log(this.isMenuOpen);
      this.isMenuOpen = false;
    }
  }
  private loadUserInfo(): void {
    this.isLoading = true
    // Assuming AuthService has a method to get user info
    const userId = this.authService.getUserId()
    // if (userId) {
    //   // You can implement getUserInfo method in AuthService
    //   this.userInfo = this.authService.()
    // }
    this.isLoading = false
  }

  toggleMenu() {
    console.log(this.isMenuOpen);
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  // logout(): void {
  //   if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
  //     this.authService.logout()
  //     this.router.navigate(["/login"])
  //   }
  // }

  showLogoutConfirmation(): void {
    this.isLogoutConfirmationVisible = true;
  }

  confirmLogout(): void {
    this.isLogoutConfirmationVisible = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  cancelLogout(): void {
    this.isLogoutConfirmationVisible = false;
  }

  onRoleSwitch() {
    this.router.navigate(['app/role-select']);
  }
}
