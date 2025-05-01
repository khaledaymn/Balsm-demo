export interface AttendanceReport {
  employeeId: string;
  name: string;
  email: string;
  numberOfMonthlyWorkingHours: number;
  numberOfLateHours: number;
  numberOfAbsentDays: number;
  numberOfVacationDays: number;
  numberOfOverTime: number;
}

export interface AttendanceReportResponse {
  success: boolean;
  data: AttendanceReport[];
}
