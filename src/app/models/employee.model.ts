import { Shift } from './shifts.model';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  nationalId: string;
  salary: number;
  shift: {
    id: number;
    startTime: string;
    endTime: string;
    employeeId: string;
  }[];
  password: string;
  gender: string;
  hiringDate: string;
  dateOfBarth: string;
  roles: string[];
  branch: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface addEmployee {
  id?: string;
  name: string;
  email: string;
  password: string | 'P@ssword123';
  phoneNumber: string;
  address: string;
  nationalId: string;
  salary: number;
  gender: string;
  hiringDate: string;
  dateOfBarth: string;
  roles: string[] | ['User'];
  branchId: number;
}
export interface editEmployee {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  nationalId: string;
  salary: number;
  gender: string;
  hiringDate: string;
  dateOfBarth: string;
  branchId: number;
}
