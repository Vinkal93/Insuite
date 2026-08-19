import { z } from "zod";

export const academicSessionSchema = z
  .object({
    name: z.string().min(2, "Session name must be at least 2 characters"),
    startDate: z.string().min(10, "Start date is required (YYYY-MM-DD)"),
    endDate: z.string().min(10, "End date is required (YYYY-MM-DD)"),
    isActive: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be strictly after start date",
      path: ["endDate"],
    }
  );

export type AcademicSessionInput = z.infer<typeof academicSessionSchema>;

export const schoolClassSchema = z.object({
  name: z.string().min(1, "Class name is required (e.g. Class 10, Grade 5, Nursery)"),
  code: z.string().min(1, "Class code is required").max(10, "Code max 10 characters").toUpperCase(),
  academicSessionId: z.string().min(1, "Academic session is required"),
  displayOrder: z.coerce.number().min(0, "Display order must be 0 or greater").default(1),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export type SchoolClassInput = z.infer<typeof schoolClassSchema>;

export const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required (e.g. Section A, Blue)"),
  code: z.string().min(1, "Section code is required").max(10, "Code max 10 chars").toUpperCase(),
  academicSessionId: z.string().min(1, "Academic session is required"),
  classId: z.string().min(1, "Class selection is required"),
  room: z.string().optional().nullable(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1 student").max(200, "Capacity maximum 200").default(40),
  classTeacherId: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export type SectionInput = z.infer<typeof sectionSchema>;

export const subjectSchema = z
  .object({
    name: z.string().min(2, "Subject name is required (e.g. Mathematics)"),
    code: z.string().min(1, "Subject code is required (e.g. MATH-101)").max(15, "Code max 15 chars").toUpperCase(),
    type: z.enum(["Core", "Elective", "Optional", "Language", "Practical", "Other"]).default("Core"),
    description: z.string().optional().nullable(),
    maximumMarks: z.coerce.number().min(1, "Maximum marks must be greater than 0").default(100),
    passingMarks: z.coerce.number().min(0, "Passing marks must be 0 or greater").default(33),
    theoryMarks: z.coerce.number().min(0).default(70),
    practicalMarks: z.coerce.number().min(0).default(30),
    status: z.enum(["active", "inactive", "archived"]).default("active"),
  })
  .refine(
    (data) => data.passingMarks <= data.maximumMarks,
    {
      message: "Passing marks cannot exceed maximum marks",
      path: ["passingMarks"],
    }
  )
  .refine(
    (data) => (data.theoryMarks || 0) + (data.practicalMarks || 0) <= data.maximumMarks,
    {
      message: "Sum of Theory and Practical marks cannot exceed Maximum marks",
      path: ["practicalMarks"],
    }
  );

export type SubjectInput = z.infer<typeof subjectSchema>;

export const teacherSchema = z.object({
  personal: z.object({
    firstName: z.string().min(2, "First name is required"),
    middleName: z.string().optional().nullable(),
    lastName: z.string().min(1, "Last name is required"),
    photoUrl: z.string().optional().nullable(),
    dob: z.string().optional().nullable(),
    gender: z.enum(["male", "female", "other"]).default("male"),
    bloodGroup: z.string().optional().nullable(),
  }),
  contact: z.object({
    mobile: z.string().min(10, "Valid 10-digit mobile number required").max(15),
    email: z.string().email("Valid email required").optional().or(z.literal("")).nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
  }),
  professional: z.object({
    employeeId: z.string().min(1, "Employee ID is required").toUpperCase(),
    joiningDate: z.string().min(10, "Joining date is required (YYYY-MM-DD)"),
    department: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    qualification: z.string().optional().nullable(),
    experience: z.string().optional().nullable(),
    specialization: z.string().optional().nullable(),
  }),
  emergencyContact: z
    .object({
      contactName: z.string().optional().nullable(),
      relation: z.string().optional().nullable(),
      mobile: z.string().optional().nullable(),
    })
    .optional(),
  status: z.enum(["active", "inactive", "on_leave", "resigned", "terminated"]).default("active"),
});

export type TeacherInput = z.infer<typeof teacherSchema>;

export const classTeacherAssignmentSchema = z.object({
  academicSessionId: z.string().min(1, "Academic session required"),
  classId: z.string().min(1, "Class selection required"),
  sectionId: z.string().min(1, "Section selection required"),
  teacherId: z.string().min(1, "Teacher selection required"),
});

export type ClassTeacherAssignmentInput = z.infer<typeof classTeacherAssignmentSchema>;

export const subjectTeacherAssignmentSchema = z.object({
  academicSessionId: z.string().min(1, "Academic session required"),
  classId: z.string().min(1, "Class selection required"),
  sectionId: z.string().optional().nullable(),
  subjectId: z.string().min(1, "Subject selection required"),
  teacherId: z.string().min(1, "Teacher selection required"),
});

export type SubjectTeacherAssignmentInput = z.infer<typeof subjectTeacherAssignmentSchema>;

export const academicSettingsSchema = z.object({
  classCodeFormat: z.string().default("NUMERIC"),
  defaultSectionCapacity: z.coerce.number().min(5).max(200).default(40),
  sectionCodeFormat: z.string().default("ALPHA"),
  subjectTypes: z.array(z.string()).default(["Core", "Elective", "Optional", "Language", "Practical", "Other"]),
  defaultMaximumMarks: z.coerce.number().default(100),
  defaultPassingMarks: z.coerce.number().default(33),
  employeeIdFormat: z.string().default("TCH-YYYY-XXXX"),
  defaultDesignations: z.array(z.string()).default([
    "Principal",
    "Vice Principal",
    "Headmaster / Headmistress",
    "PGT (Post Graduate Teacher)",
    "TGT (Trained Graduate Teacher)",
    "PRT (Primary Teacher)",
    "Assistant Teacher",
    "Special Educator",
    "Lab Assistant",
    "Librarian",
    "Physical Education Trainer",
  ]),
  defaultDepartments: z.array(z.string()).default([
    "Mathematics",
    "Science",
    "English & Literature",
    "Social Studies & Humanities",
    "Hindi & Regional Languages",
    "Computer Science & IT",
    "Arts & Crafts",
    "Physical Education",
  ]),
  sessionNamingFormat: z.string().default("YYYY-YY"),
});

export type AcademicSettingsInput = z.infer<typeof academicSettingsSchema>;
