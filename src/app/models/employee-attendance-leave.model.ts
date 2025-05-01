export interface EmployeeAttendanceLeaveReport {
  employeeName: string;
  email: string;
  date: string;
  timeOfAttend: string;
  timeOfLeave: string;
  branchName: string;
  numberOfOverTime: number;
  numberOfLateHour: number;
}

export interface EmployeeAttendanceLeaveResponse {
  success: boolean;
  data: EmployeeAttendanceLeaveReport[];
}
