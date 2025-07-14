import { Component, signal, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { EmployeeService } from "../../../core/services/employee.service"
import { AuthService } from "../../../core/services/auth.service"
import { Employee } from "../../../models/employee.model"
import { animate, style, transition, trigger } from "@angular/animations"

interface Notification {
  type: "success" | "error" | "info"
  message: string
}

@Component({
  selector: "app-user-profile",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./user-profile.component.html",
  styleUrl: "./user-profile.component.scss",
  animations: [
    trigger("fadeIn", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(20px)" }),
        animate("400ms ease-out", style({ opacity: 1, transform: "translateY(0)" })),
      ]),
    ]),
    trigger("expand", [
      transition(":enter", [
        style({ height: 0, opacity: 0, overflow: "hidden" }),
        animate("400ms ease-out", style({ height: "*", opacity: 1 })),
      ]),
      transition(":leave", [animate("300ms ease-in", style({ height: 0, opacity: 0, overflow: "hidden" }))]),
    ]),
    trigger("slideIn", [
      transition(":enter", [
        style({ transform: "translateX(-100%)", opacity: 0 }),
        animate("500ms ease-out", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
    ]),
  ],
})
export class UserProfileComponent implements OnInit {
  isLoading = signal<boolean>(true)
  employee = signal<Employee | null>(null)
  notification = signal<Notification | null>(null)
  isShiftsExpanded = signal<boolean>(false)

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId()
    if (userId) {
      this.loadEmployee(userId)
    } else {
      // this.showNotification("error", "معرف الموظف غير متوفر. يرجى تسجيل الدخول.")
      this.isLoading.set(false)
    }
  }

  loadEmployee(id: string): void {
    this.isLoading.set(true)
    this.employeeService.getEmployeeById(id).subscribe({
      next: (response) => {
        console.log("Employee Profile Response:", response)
        if (response.success && response.data) {
          this.employee.set(response.data)    
                
          // this.showNotification("success", "تم تحميل بيانات الملف الشخصي بنجاح.")
        } else {
          // this.showNotification("error", response.message || "فشل في تحميل بيانات الملف الشخصي.")
          this.employee.set(null)
        }
        this.isLoading.set(false)
      },
      error: (error) => {
        console.error("Employee Profile Error:", error)
        // this.showNotification("error", error.message || "حدث خطأ أثناء تحميل بيانات الملف الشخصي.")
        this.employee.set(null)
        this.isLoading.set(false)
      },
    })
  }

  toggleShifts(): void {
    this.isShiftsExpanded.set(!this.isShiftsExpanded())
  }

  // showNotification(type: "success" | "error" | "info", message: string): void {
  //   this.notification.set({ type, message })
  //   setTimeout(() => this.notification.set(null), 5000)
  // }

  getNotificationIcon(type: string): string {
    switch (type) {
      case "success":
        return "check_circle"
      case "error":
        return "error"
      case "info":
        return "info"
      default:
        return "info"
    }
  }

  getYearsOfExperience(): string {
    if (!this.employee()?.hiringDate) return "0 سنوات"

    const hireDate = new Date(this.employee()!.hiringDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - hireDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)

    if (years === 0) {
      return months === 1 ? "شهر واحد" : `${months} أشهر`
    } else if (months === 0) {
      return years === 1 ? "سنة واحدة" : `${years} سنوات`
    } else {
      const yearText = years === 1 ? "سنة" : "سنوات"
      const monthText = months === 1 ? "شهر" : "أشهر"
      return `${years} ${yearText} و ${months} ${monthText}`
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return "غير محدد"
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  getGenderText(gender: string): string {
    return gender === "Male" ? "ذكر" : "أنثى"
  }

  getRolesText(): string {
    const roles = this.employee()?.roles
    if (!roles || roles.length === 0) return "لا توجد أدوار"
    return roles.join(", ")
  }
}
