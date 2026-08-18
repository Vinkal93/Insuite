export type Gender = "MALE" | "FEMALE" | "OTHER";
export type StudentStatus = "ACTIVE" | "INACTIVE" | "TRANSFERRED" | "WITHDRAWN";

export interface StudentContact {
  mobile?: string;
  email?: string;
}

export interface StudentAddress {
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface StudentAcademic {
  sessionId: string;
  sessionName?: string;
  classId: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  rollNumber?: string;
  admissionDate: string;
}

export interface StudentParentIds {
  fatherId?: string;
  motherId?: string;
  guardianId?: string;
}

export interface Student {
  id: string;
  organizationId: string;
  studentId: string; // Permanent Unique ID e.g. INS-2026-000001
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  photoUrl?: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  previousSchool?: string;
  contact: StudentContact;
  address: StudentAddress;
  academic: StudentAcademic;
  parentIds: StudentParentIds;
  status: StudentStatus;
  deactivationReason?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
