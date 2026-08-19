import { z } from "zod";

export const enquirySchema = z.object({
  // Student
  firstName: z.string().min(1, "Student first name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Student last name is required"),
  dob: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  interestedClass: z.string().min(1, "Interested class is required"),
  interestedCourse: z.string().optional(),

  // Parent & Contact
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianName: z.string().optional(),
  mobile: z.string().min(10, "Valid 10-digit mobile number is required"),
  alternateMobile: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),

  // Address
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),

  // Enquiry Details
  sessionId: z.string().min(1, "Academic session is required"),
  source: z.string().min(1, "Lead source is required"),
  referralDetails: z.string().optional(),
  preferredContactMethod: z.enum(["Call", "WhatsApp", "Email", "In Person"]).default("Call"),
  notes: z.string().optional(),
  assignedCounsellorName: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
});

export type EnquiryFormInput = z.infer<typeof enquirySchema>;

export const followUpSchema = z.object({
  scheduledDate: z.string().min(1, "Follow-up date is required"),
  scheduledTime: z.string().optional(),
  contactMethod: z.enum(["Call", "WhatsApp", "SMS", "Email", "In Person"]).default("Call"),
  purpose: z.string().min(1, "Purpose of follow-up is required"),
  notes: z.string().optional(),
  assignedToName: z.string().optional(),
});

export type FollowUpFormInput = z.infer<typeof followUpSchema>;

export const counsellingSchema = z.object({
  interestLevel: z.enum(["High", "Medium", "Low"]),
  discussionNotes: z.string().min(1, "Discussion notes are required"),
  feeDiscussionNotes: z.string().optional(),
  courseDiscussionNotes: z.string().optional(),
  counsellorRecommendations: z.string().optional(),
  status: z.enum(["Pending", "In Progress", "Converted", "Lost"]),
  nextFollowUpDate: z.string().optional(),
});

export type CounsellingFormInput = z.infer<typeof counsellingSchema>;

export const applicationSchema = z.object({
  // Student
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.string().optional(),
  nationality: z.string().default("Indian"),
  religion: z.string().optional(),
  category: z.string().default("General"),
  photoUrl: z.string().optional(),

  // Parent
  fatherName: z.string().optional(),
  fatherMobile: z.string().optional(),
  fatherEmail: z.string().email().optional().or(z.literal("")),
  fatherOccupation: z.string().optional(),
  motherName: z.string().optional(),
  motherMobile: z.string().optional(),
  motherEmail: z.string().email().optional().or(z.literal("")),
  motherOccupation: z.string().optional(),
  guardianName: z.string().optional(),
  guardianMobile: z.string().optional(),
  guardianRelation: z.string().optional(),

  // Contact & Address
  mobile: z.string().min(10, "Primary mobile number is required"),
  email: z.string().email().optional().or(z.literal("")),
  addressLine: z.string().min(1, "Residential address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),

  // Academic History
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  previousBoard: z.string().optional(),
  previousGradePercentage: z.string().optional(),
  transferCertificateNo: z.string().optional(),

  // Placement Preference
  sessionId: z.string().min(1, "Academic session is required"),
  applyingClass: z.string().min(1, "Class is required"),
  sectionPreference: z.string().optional(),
  enquiryId: z.string().optional(),
});

export type ApplicationFormInput = z.infer<typeof applicationSchema>;

export const admissionSettingsSchema = z.object({
  admissionPrefix: z.string().default("ADM"),
  admissionStartNumber: z.number().default(1001),
  applicationPrefix: z.string().default("APP"),
  enquiryPrefix: z.string().default("ENQ"),
  autoGenerateAdmissionNo: z.boolean().default(true),
  requiredDocuments: z.array(z.string()),
  enquirySources: z.array(z.string()),
});

export type AdmissionSettingsFormInput = z.infer<typeof admissionSettingsSchema>;
