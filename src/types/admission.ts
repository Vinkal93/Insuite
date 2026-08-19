export type EnquirySource =
  | "Website"
  | "Walk-in"
  | "Phone"
  | "WhatsApp"
  | "Referral"
  | "Advertisement"
  | "Social Media"
  | "School Event"
  | "Other";

export type EnquiryStatus =
  | "New"
  | "Contacted"
  | "Counselling"
  | "Interested"
  | "Application Started"
  | "Converted"
  | "Lost"
  | "Not Interested";

export interface EnquiryStudent {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dob?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  interestedClass: string;
  interestedCourse?: string;
}

export interface EnquiryParent {
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
}

export interface EnquiryAddress {
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface Enquiry {
  id: string;
  enquiryNumber: string; // e.g. ENQ-2026-001
  organizationId: string;
  academicSessionId: string;
  sessionName?: string;
  student: EnquiryStudent;
  parent: EnquiryParent;
  address?: EnquiryAddress;
  source: EnquirySource;
  referralDetails?: string;
  preferredContactMethod?: "Call" | "WhatsApp" | "Email" | "In Person";
  notes?: string;
  assignedCounsellorId?: string;
  assignedCounsellorName?: string;
  status: EnquiryStatus;
  nextFollowUpAt?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  updatedAt: string;
  updatedBy: string;
}

export type FollowUpContactMethod = "Call" | "WhatsApp" | "SMS" | "Email" | "In Person";
export type FollowUpStatus = "Pending" | "Completed" | "Cancelled";
export type FollowUpOutcome =
  | "Interested"
  | "Not Interested"
  | "Call Back"
  | "Application Started"
  | "Admission Ready"
  | "No Response"
  | "Other";

export interface FollowUp {
  id: string;
  organizationId: string;
  enquiryId?: string;
  applicationId?: string;
  studentName: string;
  parentName: string;
  mobile: string;
  scheduledDate: string;
  scheduledTime?: string;
  assignedToId?: string;
  assignedToName?: string;
  contactMethod: FollowUpContactMethod;
  purpose: string;
  notes?: string;
  status: FollowUpStatus;
  completedAt?: string;
  completedBy?: string;
  completedByName?: string;
  outcome?: FollowUpOutcome;
  outcomeNotes?: string;
  createdAt: string;
  createdBy: string;
}

export interface CounsellingRecord {
  id: string;
  organizationId: string;
  enquiryId: string;
  studentName: string;
  parentName: string;
  className: string;
  counsellorId: string;
  counsellorName: string;
  interestLevel: "High" | "Medium" | "Low";
  discussionNotes: string;
  feeDiscussionNotes?: string;
  courseDiscussionNotes?: string;
  counsellorRecommendations?: string;
  status: "Pending" | "In Progress" | "Converted" | "Lost";
  lastContactDate: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Documents Pending"
  | "Verified"
  | "Approved"
  | "Rejected"
  | "Converted";

export interface ApplicationDocument {
  id: string;
  name: string;
  documentType: string;
  fileUrl: string;
  uploadedAt: string;
  status: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface ApplicationAcademicHistory {
  previousSchool?: string;
  previousClass?: string;
  previousBoard?: string;
  previousGradePercentage?: string;
  transferCertificateNo?: string;
}

export interface Application {
  id: string;
  applicationNumber: string; // e.g. APP-2026-0001
  organizationId: string;
  academicSessionId: string;
  sessionName?: string;
  enquiryId?: string;
  
  student: {
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;
    dob: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    bloodGroup?: string;
    nationality?: string;
    religion?: string;
    category?: string;
    photoUrl?: string;
  };

  parent: {
    fatherName?: string;
    fatherMobile?: string;
    fatherEmail?: string;
    fatherOccupation?: string;
    motherName?: string;
    motherMobile?: string;
    motherEmail?: string;
    motherOccupation?: string;
    guardianName?: string;
    guardianMobile?: string;
    guardianRelation?: string;
  };

  contact: {
    mobile: string;
    email?: string;
    addressLine: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  academicHistory: ApplicationAcademicHistory;
  applyingClass: string;
  sectionPreference?: string;
  documents: ApplicationDocument[];
  status: ApplicationStatus;
  reviewNotes?: string;
  rejectionReason?: string;
  requestedDocuments?: string[];
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AdmissionRecord {
  id: string;
  admissionNumber: string; // Permanent school admission number
  organizationId: string;
  academicSessionId: string;
  sessionName?: string;
  applicationId: string;
  studentId: string; // Reference to created student doc
  studentName: string;
  studentPhotoUrl?: string;
  classId: string;
  className: string;
  sectionId?: string;
  sectionName?: string;
  admissionDate: string;
  source?: string;
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface AdmissionSettings {
  id: string;
  organizationId: string;
  admissionPrefix: string;
  admissionStartNumber: number;
  applicationPrefix: string;
  enquiryPrefix: string;
  defaultEnquiryStatus: EnquiryStatus;
  autoGenerateAdmissionNo: boolean;
  requiredDocuments: string[];
  enquirySources: string[];
  updatedAt: string;
}
