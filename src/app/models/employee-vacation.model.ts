export interface EmployeeVacationDetail {
  hours: number;
  date: string;
}

export interface EmployeeVacation {
  employeeName: string;
  totalVacationDays: number;
  employeeVacationDetails: EmployeeVacationDetail[];
}
