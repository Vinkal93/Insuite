import { z } from "zod";

export const studentSchema = z.object({
  // Basic Information
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50),
  photoUrl: z.string().url().optional().or(z.literal("")),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    errorMap: () => ({ message: "Please select gender" }),
  }),
  bloodGroup: z.string().optional(),
  nationality: z.string().default("Indian"),
  religion: z.string().optional(),
  category: z.string().optional(),
  previousSchool: z.string().optional(),

  // Contact Information
  mobile: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  addressLine: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("India"),

  // Academic Information
  sessionId: z.string().min(1, "Academic session is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  admissionDate: z.string().min(1, "Admission date is required"),
  admissionNumber: z.string().optional(),
  rollNumber: z.string().optional(),

  // Parents / Guardians
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
});

export type StudentFormInput = z.infer<typeof studentSchema>;
