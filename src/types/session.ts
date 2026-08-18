import type { Timestamp } from "firebase/firestore";

export interface AcademicSession {
  id: string;
  name: string; // e.g. "2026-27"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
