import { z } from "zod";

export const assignmentTypeEnum = z.enum([
  "Homework",
  "Classwork",
  "Project",
  "Worksheet",
  "Practice",
  "Other",
]);

export const assignmentStatusEnum = z.enum(["draft", "published", "closed", "archived"]);

export const targetStudentTypeEnum = z.enum(["ALL_STUDENTS", "SELECTED_STUDENTS"]);

export const gradeTypeEnum = z.enum(["Marks", "Grade", "Percentage", "Rubric"]);

export const resourceCategoryEnum = z.enum([
  "Notes",
  "Worksheets",
  "PDF",
  "Presentation",
  "Video Link",
  "Reference",
  "Other",
]);

export const assignmentAttachmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  url: z.string().url(),
  size: z.number().min(0),
  mimeType: z.string().min(1),
});

export const assignmentSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().min(2, "Description is required"),
    type: assignmentTypeEnum.default("Homework"),
    academicSessionId: z.string().min(1, "Academic session is required"),
    classId: z.string().min(1, "Class is required"),
    sectionId: z.string().min(1, "Section is required"),
    subjectId: z.string().min(1, "Subject is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    targetType: targetStudentTypeEnum.default("ALL_STUDENTS"),
    assignedStudentIds: z.array(z.string()).optional(),
    assignedDate: z.string().min(1, "Assigned date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    dueTime: z.string().optional(),
    instructions: z.string().min(2, "Instructions are required"),
    attachments: z.array(assignmentAttachmentSchema).optional().default([]),
    grading: z
      .object({
        enabled: z.boolean().default(true),
        maximumMarks: z.coerce.number().min(1).optional().default(100),
        passingMarks: z.coerce.number().min(0).optional().default(40),
        gradeType: gradeTypeEnum.optional().default("Marks"),
      })
      .default({
        enabled: true,
        maximumMarks: 100,
        passingMarks: 40,
        gradeType: "Marks",
      }),
    status: assignmentStatusEnum.default("published"),
  })
  .refine(
    (data) => {
      if (!data.assignedDate || !data.dueDate) return true;
      return data.dueDate >= data.assignedDate;
    },
    {
      message: "Due date cannot be before assigned date",
      path: ["dueDate"],
    }
  )
  .refine(
    (data) => {
      if (data.grading?.enabled && data.grading.maximumMarks && data.grading.passingMarks) {
        return data.grading.passingMarks <= data.grading.maximumMarks;
      }
      return true;
    },
    {
      message: "Passing marks cannot exceed maximum marks",
      path: ["grading", "passingMarks"],
    }
  );

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export const gradeSubmissionSchema = z.object({
  marks: z.coerce.number().min(0, "Marks cannot be negative"),
  feedback: z.string().optional(),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;

export const returnSubmissionSchema = z
  .object({
    action: z.enum(["Return", "Request Resubmission"]),
    resubmissionReason: z.string().optional(),
    feedback: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === "Request Resubmission") {
        return !!data.resubmissionReason && data.resubmissionReason.trim().length > 0;
      }
      return true;
    },
    {
      message: "Reason is required when requesting a resubmission",
      path: ["resubmissionReason"],
    }
  );

export type ReturnSubmissionInput = z.infer<typeof returnSubmissionSchema>;

export const academicResourceSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  classId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  category: resourceCategoryEnum.default("Notes"),
  fileName: z.string().optional().nullable(),
  downloadUrl: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
});

export type AcademicResourceInput = z.infer<typeof academicResourceSchema>;

export const academicWorkSettingsSchema = z.object({
  assignmentDefaults: z.object({
    defaultType: assignmentTypeEnum.default("Homework"),
    allowLateSubmission: z.boolean().default(true),
    gracePeriodHours: z.coerce.number().min(0).default(24),
    allowResubmission: z.boolean().default(true),
  }),
  gradingSettings: z.object({
    defaultMaxMarks: z.coerce.number().min(1).default(100),
    defaultGradeType: gradeTypeEnum.default("Marks"),
    autoCalculatePercentage: z.boolean().default(true),
  }),
  attachmentSettings: z.object({
    maxFileSizeMB: z.coerce.number().min(1).max(50).default(10),
    allowedMimeTypes: z.array(z.string()).default([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
  }),
  notificationSettings: z.object({
    notifyOnPublish: z.boolean().default(true),
    notifyOnGrading: z.boolean().default(true),
  }),
});

export type AcademicWorkSettingsInput = z.infer<typeof academicWorkSettingsSchema>;
