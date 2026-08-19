import { z } from "zod";

export const examSchema = z.object({
  name: z.string().min(2, "Exam name must be at least 2 characters"),
  academicSessionId: z.string().min(1, "Academic session is required"),
  type: z.string().min(1, "Exam type is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().optional(),
  status: z.enum([
    "Draft",
    "Scheduled",
    "Ongoing",
    "Completed",
    "Result Processing",
    "Published",
    "Archived",
  ]).default("Draft"),
  classIds: z.array(z.string()).min(1, "Select at least one class for this exam"),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be greater than or equal to start date",
  path: ["endDate"],
});

export type ExamInput = z.infer<typeof examSchema>;

export const examScheduleSchema = z.object({
  examId: z.string().min(1, "Exam is required"),
  academicSessionId: z.string().min(1, "Academic session is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  subjectId: z.string().min(1, "Subject is required"),
  roomId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  instructions: z.string().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type ExamScheduleInput = z.infer<typeof examScheduleSchema>;

export const examSubjectSchema = z.object({
  classId: z.string().min(1, "Class required"),
  subjectId: z.string().min(1, "Subject required"),
  subjectName: z.string().min(1, "Subject name required"),
  maximumMarks: z.coerce.number().min(1, "Maximum marks must be greater than 0"),
  passingMarks: z.coerce.number().min(0, "Passing marks must be >= 0"),
  theoryMarks: z.coerce.number().min(0).optional(),
  practicalMarks: z.coerce.number().min(0).optional(),
  weightage: z.coerce.number().min(0).max(100).optional(),
}).refine((data) => data.passingMarks <= data.maximumMarks, {
  message: "Passing marks cannot exceed maximum marks",
  path: ["passingMarks"],
});

export type ExamSubjectInput = z.infer<typeof examSubjectSchema>;

export const marksEntryItemSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  rollNumber: z.string().optional(),
  marksObtained: z.coerce.number().nullable().optional(),
  absent: z.boolean().default(false),
  remarks: z.string().optional(),
});

export const marksEntryBulkSchema = z.object({
  examId: z.string().min(1),
  examSubjectId: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  maximumMarks: z.coerce.number().min(1),
  entries: z.array(marksEntryItemSchema),
});

export type MarksEntryBulkInput = z.infer<typeof marksEntryBulkSchema>;

export const gradeRuleSchema = z.object({
  grade: z.string().min(1, "Grade label required"),
  minPercentage: z.coerce.number().min(0).max(100),
  maxPercentage: z.coerce.number().min(0).max(100),
  gradePoint: z.coerce.number().min(0),
  description: z.string().optional(),
});

export const gradingScaleSchema = z.object({
  name: z.string().min(2, "Grading scale name required"),
  isDefault: z.boolean().default(true),
  grades: z.array(gradeRuleSchema).min(1, "At least one grade boundary is required"),
});

export type GradingScaleInput = z.infer<typeof gradingScaleSchema>;

export const examSettingsSchema = z.object({
  examTypes: z.array(z.string()).min(1, "At least one exam type required"),
  defaultPassingPercentage: z.coerce.number().min(1).max(100).default(33),
  requireAllSubjectsPass: z.boolean().default(true),
  enableRankings: z.boolean().default(true),
  showAttendanceOnReportCard: z.boolean().default(true),
  reportCardHeaderNote: z.string().optional(),
  reportCardFooterNote: z.string().optional(),
});

export type ExamSettingsInput = z.infer<typeof examSettingsSchema>;
