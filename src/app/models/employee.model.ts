import { Shift } from './shifts.model';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  nationalId: string;
  baseSalary: number;
  shift: {
    id: number;
    startTime: string;
    endTime: string;
    employeeId: string;
  }[];
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
  baseSalary: number;
  gender: string;
  hiringDate: string;
  dateOfBarth: string;
  roles: ['User' | 'Admin'];
  branchId: number;
}
