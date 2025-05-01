import { Branch } from './branch.model';

// Interface for the user's geolocation data
export interface LocationData {
  latitude: number; // Latitude of the user's location (e.g., 30.8117)
  longitude: number; // Longitude of the user's location (e.g., 30.97431)
  accuracy: number; // Accuracy of the location in meters (e.g., 20)
  timestamp: number; // Timestamp of the location data in milliseconds (e.g., 1698777600000)
}

// Alias WorkLocation to Branch (since they represent the same concept)
// If WorkLocation needs different properties, you can define it separately
export type WorkLocation = Branch;

// Interface for the result of location validation
export interface AttendanceStatus {
  isWithinLocation: boolean; // True if the user is within the work location
  locationName?: string; // Name of the work location if within range (e.g., "Main Branch")
  errorMessage?: string; // Error message if not within range (e.g., "أنت خارج موقع العمل المسموح")
}

// Existing Attendance interface
export interface Attendance {
  timeOfAttend: string; // ISO 8601 timestamp (e.g., "2025-04-28T07:38:03.597Z")
  latitude: number; // Latitude of the location (e.g., 30.8117)
  longitude: number; // Longitude of the location (e.g., 30.97431)
  employeeId: string; // The ID of the employee (e.g., "57e3845c-4fdd-48f9-8812-0ba6ad17e61d")
  shiftId?: number; // Optional: Added for app logic (e.g., 1)
  type?: string; // Optional: Added for app logic (e.g., "CheckIn" or "CheckOut")
  date?: string; // Optional: Derived from timeOfAttend as "YYYY-MM-DD" (e.g., "2025-04-28")
}
export interface Leave {
  timeOfLeave: string; // ISO 8601 timestamp (e.g., "2025-04-28T07:38:03.597Z")
  latitude: number; // Latitude of the location (e.g., 30.8117)
  longitude: number; // Longitude of the location (e.g., 30.97431)
  employeeId: string; // The ID of the employee (e.g., "57e3845c-4fdd-48f9-8812-0ba6ad17e61d")
  shiftId?: number; // Optional: Added for app logic (e.g., 1)
  type?: string; // Optional: Added for app logic (e.g., "CheckIn" or "CheckOut")
  date?: string; // Optional: Derived from timeOfAttend as "YYYY-MM-DD" (e.g., "2025-04-28")
}
