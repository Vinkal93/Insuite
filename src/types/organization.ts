import type { Timestamp } from "firebase/firestore";

export type OrganizationRole = "OWNER" | "ADMIN" | "PRINCIPAL" | "TEACHER" | "ACCOUNTANT" | "STAFF";

export interface OrganizationMember {
  uid: string;
  role: OrganizationRole;
  status: "active" | "invited" | "disabled";
  joinedAt: Timestamp | string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  principalName?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  setupCompleted: boolean;
  status: "active" | "suspended" | "pending";
  createdBy: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}
