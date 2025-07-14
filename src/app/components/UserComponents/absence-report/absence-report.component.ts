import { Component, signal, OnInit, OnDestroy } from "@angular/core"
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { Subscription } from "rxjs"
import { debounceTime, distinctUntilChanged } from "rxjs/operators"
import { ReportsService } from "../../../core/services/reports.service"
import { AuthService } from "../../../core/services/auth.service"
import { AbsenceReport } from "../../../models/absence-report.model"
import { animate, style, transition, trigger } from "@angular/animations"

interface Notification {
  type: "success" | "error" | "info"
  message: string
}

interface AbsenceSummary {
  employeeName: string
  totalAbsenceHours: number
  totalAbsenceDays: number
  averageAbsencePerDay: number
}

@Component({
  selector: "app-absence-report",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./absence-report.component.html",
  styleUrl: "./absence-report.component.scss",
  animations: [
    trigger("fadeIn", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(20px)" }),
        animate("400ms ease-out", style({ opacity: 1, transform: "translateY(0)" })),
      ]),
    ]),
    trigger("slideIn", [
      transition(":enter", [
        style({ transform: "translateX(-100%)", opacity: 0 }),
        animate("500ms ease-out", style({ transform: "translateX(0)", opacity: 1 })),
      ]),
    ]),
  ],
})
export class AbsenceReportComponent implements OnInit, OnDestroy {
  isLoading = signal<boolean>(true)
  absenceReports = signal<AbsenceReport[]>([])
  absenceSummary = signal<AbsenceSummary | null>(null)
  notification = signal<Notification | null>(null)
  employeeId = signal<string | null>(null)

  // Pagination
  pageNumber = signal<number>(1)
  pageSize = signal<number>(10)
  totalRecords = signal<number>(0)

  // Filters
  absenceFilterForm = new FormGroup({
    reportType: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dayDate: new FormControl<string>("", {
      validators: [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    fromDate: new FormControl<string>("", {
      validators: [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    toDate: new FormControl<string>("", {
      validators: [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    month: new FormControl<number | null>(null),
  })

  private subscription: Subscription = new Subscription()

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId()
    if (userId) {
      this.employeeId.set(userId)
      this.resetFilters()
      this.loadAbsenceReport()
      this.subscription.add(
        this.absenceFilterForm.valueChanges
          .pipe(
            debounceTime(300),
            distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
          )
          .subscribe(() => {
            if (this.absenceFilterForm.valid) {
              console.log("Absence Form Value Changed:", this.absenceFilterForm.value)
              this.pageNumber.set(1)
              this.loadAbsenceReport()
            } else {
              console.warn("Absence Form Invalid:", this.absenceFilterForm.errors)
              this.showNotification("error", "يرجى إدخال بيانات صالحة للفلاتر.")
            }
          }),
      )
    } else {
      this.showNotification("error", "معرف الموظف غير متوفر. يرجى تسجيل الدخول.")
      this.isLoading.set(false)
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  loadAbsenceReport(): void {
    if (!this.employeeId()) {
      this.showNotification("error", "معرف الموظف غير متوفر.")
      this.isLoading.set(false)
      return
    }
    this.isLoading.set(true)

    const { reportType, dayDate, fromDate, toDate, month } = this.absenceFilterForm.value

    if (reportType === 0 && (!dayDate || !this.absenceFilterForm.controls.dayDate.valid)) {
      this.showNotification("error", "يرجى تحديد تاريخ صالح للتقرير اليومي (YYYY-MM-DD).")
      this.isLoading.set(false)
      return
    }
    if (
      reportType === 1 &&
      (!fromDate ||
        !toDate ||
        !this.absenceFilterForm.controls.fromDate.valid ||
        !this.absenceFilterForm.controls.toDate.valid)
    ) {
      this.showNotification("error", "يرجى تحديد تواريخ صالحة للتقرير الشهري (YYYY-MM-DD).")
      this.isLoading.set(false)
      return
    }

    const filterParams: any = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
    }
    if (reportType == 0) {
      filterParams.dayDate = dayDate
    } else {
      filterParams.fromDate = fromDate
      filterParams.toDate = toDate
      filterParams.month = month || null
    }

    console.log("Absence Report Filter Params:", {
      employeeId: this.employeeId(),
      reportType,
      filterParams,
    })

    this.reportsService.getAbsenceReport(this.employeeId()!, reportType!, filterParams).subscribe({
      next: (response) => {
        console.log("Absence Report Response:", response)
        if (response.success) {
          this.absenceReports.set(response.data || [])
          this.calculateAbsenceSummary(response.data || [])
          this.totalRecords.set(response.data?.reduce((sum, report) => sum + report.data.length, 0) || 0)
          if (
            !response.data ||
            response.data.length === 0 ||
            response.data.every((report) => report.data.length === 0)
          ) {
            this.showNotification("info", "لا توجد بيانات غياب متاحة لهذه الفلاتر.")
          } else {
            this.showNotification("success", "تم تحميل تقرير الغياب بنجاح.")
          }
        } else {
          this.showNotification("error", "فشل في تحميل تقرير الغياب.")
          this.absenceReports.set([])
          this.absenceSummary.set(null)
        }
        this.isLoading.set(false)
      },
      error: (error) => {
        console.error("Absence Report Error:", error)
        this.showNotification("error", error.message || "حدث خطأ أثناء تحميل تقرير الغياب.")
        this.absenceReports.set([])
        this.absenceSummary.set(null)
        this.isLoading.set(false)
      },
    })
  }

  private calculateAbsenceSummary(reports: AbsenceReport[]): void {
    if (!reports || reports.length === 0) {
      this.absenceSummary.set(null)
      return
    }

    const employeeName = reports[0]?.email || "الموظف"
    let totalHours = 0
    let totalDays = 0

    reports.forEach((report) => {
      report.data.forEach((detail) => {
        totalHours += detail.hours
        totalDays += 1
      })
    })

    const averageAbsencePerDay = totalDays > 0 ? totalHours / totalDays : 0

    this.absenceSummary.set({
      employeeName,
      totalAbsenceHours: totalHours,
      totalAbsenceDays: totalDays,
      averageAbsencePerDay,
    })
  }

  changePage(newPage: number): void {
    if (newPage >= 1) {
      this.pageNumber.set(newPage)
      this.loadAbsenceReport()
    }
  }

  resetFilters(): void {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const firstDay = new Date(currentYear, currentMonth - 1, 1)
    const lastDay = new Date(currentYear, currentMonth - 1, new Date(currentYear, currentMonth, 0).getDate())
    this.absenceFilterForm.reset({
      reportType: 1,
      dayDate: "",
      fromDate: firstDay.toISOString().split("T")[0],
      toDate: lastDay.toISOString().split("T")[0],
      month: null,
    })
  }

  showNotification(type: "success" | "error" | "info", message: string): void {
    this.notification.set({ type, message })
    setTimeout(() => this.notification.set(null), 5000)
  }

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

  getReportTypeText(): string {
    const reportType = this.absenceFilterForm.controls.reportType.value
    return reportType === 0 ? "يومي" : "شهري"
  }

  formatHours(hours: number): string {
    if (hours === 0) return "0 ساعات"

    const wholeHours = Math.floor(hours)
    const remainingMinutes = Math.round((hours - wholeHours) * 60)

    if (remainingMinutes === 0) {
      return wholeHours === 1 ? "ساعة واحدة" : `${wholeHours} ساعات`
    }

    let result = ""
    if (wholeHours > 0) {
      result += wholeHours === 1 ? "ساعة واحدة" : `${wholeHours} ساعات`
    }

    if (remainingMinutes > 0) {
      if (result) result += " و "
      result += remainingMinutes === 1 ? "دقيقة واحدة" : `${remainingMinutes} دقيقة`
    }

    return result
  }

  hasReport():Boolean {
    return this.absenceReports().some(report => report.data.length > 0)
  }

  isEmpty() :Boolean
  {
    return this.absenceReports()?.every(report => report?.data?.length === 0)
  }
}
