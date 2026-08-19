import { z } from "zod";

export const attendanceStatusEnum = z.enum(["present", "absent", "late", "half_day", "leave"]);

export const attendanceRecordSchema = z.object({
  date: z.string().min(1, "Date is required"),
  academicSessionId: z.string().min(1, "Academic Session is required"),
  personType: z.enum(["student", "staff"]),
  personId: z.string().min(1, "Person ID is required"),
  personName: z.string().min(1, "Person Name is required"),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: attendanceStatusEnum,
  remarks: z.string().optional(),
  changeReason: z.string().optional(),
});

export const bulkAttendanceEntrySchema = z.object({
  personId: z.string().min(1),
  personName: z.string().min(1),
  rollNumber: z.string().optional(),
  admissionNumber: z.string().optional(),
  employeeId: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  status: attendanceStatusEnum,
  remarks: z.string().optional(),
});

export const bulkStudentAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  academicSessionId: z.string().min(1, "Academic Session is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  entries: z.array(bulkAttendanceEntrySchema).min(1, "At least one student record is required"),
});

export type BulkStudentAttendanceInput = z.infer<typeof bulkStudentAttendanceSchema>;

export const bulkStaffAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  academicSessionId: z.string().min(1, "Academic Session is required"),
  entries: z.array(bulkAttendanceEntrySchema).min(1, "At least one staff record is required"),
});

export type BulkStaffAttendanceInput = z.infer<typeof bulkStaffAttendanceSchema>;

export const leaveRequestSchema = z
  .object({
    leaveType: z.enum(["casual", "sick", "earned", "maternity", "unpaid", "other"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().min(3, "Reason is required (at least 3 characters)"),
    attachmentUrl: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  );

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const approveLeaveSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "rejected") {
        return !!data.rejectionReason && data.rejectionReason.trim().length > 0;
      }
      return true;
    },
    {
      message: "Rejection reason is required when rejecting a leave request",
      path: ["rejectionReason"],
    }
  );

export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;

export const attendanceSettingsSchema = z.object({
  defaultAttendanceStatus: attendanceStatusEnum.default("present"),
  lateThresholdTime: z.string().default("08:30"),
  halfDayThresholdHours: z.coerce.number().min(1).max(12).default(4),
  allowAttendanceEditing: z.boolean().default(true),
  requireReasonForChange: z.boolean().default(true),
  enableParentNotification: z.boolean().default(false),
  workingDays: z.array(z.string()).default([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]),
});

export type AttendanceSettingsInput = z.infer<typeof attendanceSettingsSchema>;
