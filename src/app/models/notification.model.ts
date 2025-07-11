export interface Notification {
  id: number;
  title: string;
  createdAt: string;
  name: string;
  startTime: string;
  endTime: string;
  message: string;
  employeeId: string;
  shiftId: number;
}

export interface TakeLeaveResponse {
  message: string;
}
