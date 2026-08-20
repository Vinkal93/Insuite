export type ParentRelation = "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER";
export type ParentStatus = "ACTIVE" | "INACTIVE";

export interface Parent {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  relation: ParentRelation;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  occupation?: string;
  address?: string;
  authUserId?: string; // Firebase Auth UID for parent portal authentication
  childrenIds: string[];
  status: ParentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ParentStudentRelation {
  id: string;
  organizationId: string;
  parentId: string;
  studentId: string;
  studentName: string;
  relationship: ParentRelation;
  isPrimary: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ParentNotificationPreference {
  emailAlerts: boolean;
  smsAlerts: boolean;
  whatsappAlerts: boolean;
  feeReminders: boolean;
  attendanceAlerts: boolean;
  examResults: boolean;
  homeworkAlerts: boolean;
  generalNotices: boolean;
}
