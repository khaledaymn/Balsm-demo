export interface AbsenceDetail {
  hours: number;
  date: string;
}

export interface AbsenceReport {
  employeeName: string;
  email: string;
  data: AbsenceDetail[];
}

export interface AbsenceReportResponse {
  success: boolean;
  data: AbsenceReport[];
}
