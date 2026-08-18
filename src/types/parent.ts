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
  authUserId?: string; // Reserved for future parent portal authentication
  childrenIds: string[];
  status: ParentStatus;
  createdAt: string;
  updatedAt: string;
}
