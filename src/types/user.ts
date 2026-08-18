import type { Timestamp } from "firebase/firestore";

export type UserStatus = "active" | "disabled" | "pending";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  phone?: string | null;
  status: UserStatus;
  currentOrganizationId?: string | null;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  lastLoginAt: Timestamp | string;
}
