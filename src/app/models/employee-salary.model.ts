export interface EmployeeSalary {
  employeeId: string;
  employeeName: string;
  netSalary: number;
  month?: number;
  year?: number;
}

export interface EmployeeSalaryDetails {
  employeeName: string;
  baseSalary: number;
  overTime: number;
  overTimeSalary: number;
  lateTime: number;
  lateTimeSalary: number;
  numberOfAbsentDays: number;
  absentDaysSalary: number;
  salesPresentage: number;
  totalSalary: number;
  month: number;
  year: number;
}
export interface UpdateSalesPercentageRequest {
  employeeId: string;
  salesPercentage: number;
  month: number;
  year: number;
}
// export interface EmployeeSalaryResponse {
//   success: boolean;
//   data: EmployeeSalary[];
// }

// export interface EmployeeSalaryDetailsResponse {
//   success: boolean;
//   data: EmployeeSalaryDetails;
// }
