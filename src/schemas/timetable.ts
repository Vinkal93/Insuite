import { z } from "zod";

export const dayOfWeekEnum = z.enum([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

export const periodTypeEnum = z.enum([
  "Regular",
  "Break",
  "Lunch",
  "Assembly",
  "Other",
]);

export const periodStatusEnum = z.enum(["active", "inactive"]);

export const periodSchema = z
  .object({
    name: z.string().min(1, "Period name is required"),
    number: z.coerce.number().min(1, "Period number must be at least 1"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    type: periodTypeEnum.default("Regular"),
    status: periodStatusEnum.default("active"),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type PeriodInput = z.infer<typeof periodSchema>;

export const roomTypeEnum = z.enum([
  "Classroom",
  "Laboratory",
  "Computer Lab",
  "Library",
  "Auditorium",
  "Other",
]);

export const roomStatusEnum = z.enum(["Available", "Unavailable"]);

export const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  type: roomTypeEnum.default("Classroom"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  floor: z.string().default("Ground Floor"),
  building: z.string().default("Main Building"),
  status: roomStatusEnum.default("Available"),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const timetableEntrySchema = z.object({
  academicSessionId: z.string().min(1, "Academic Session is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  roomId: z.string().optional().nullable(),
  dayOfWeek: dayOfWeekEnum,
  periodId: z.string().min(1, "Period is required"),
});

export type TimetableEntryInput = z.infer<typeof timetableEntrySchema>;

export const substitutionStatusEnum = z.enum([
  "Pending",
  "Assigned",
  "Completed",
  "Cancelled",
]);

export const substitutionSchema = z
  .object({
    academicSessionId: z.string().min(1, "Academic session is required"),
    date: z.string().min(1, "Date is required"),
    periodId: z.string().min(1, "Period is required"),
    absentTeacherId: z.string().min(1, "Absent teacher is required"),
    substituteTeacherId: z.string().min(1, "Substitute teacher is required"),
    classId: z.string().min(1, "Class is required"),
    sectionId: z.string().min(1, "Section is required"),
    subjectId: z.string().min(1, "Subject is required"),
    reason: z.string().min(2, "Reason is required"),
    notes: z.string().optional().nullable(),
    status: substitutionStatusEnum.default("Assigned"),
  })
  .refine(
    (data) => {
      return data.absentTeacherId !== data.substituteTeacherId;
    },
    {
      message: "Substitute teacher cannot be the same as the absent teacher",
      path: ["substituteTeacherId"],
    }
  );

export type SubstitutionInput = z.infer<typeof substitutionSchema>;

export const timetableSettingsSchema = z.object({
  workingDays: z.array(dayOfWeekEnum).default([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]),
  defaultView: z.enum(["grid", "list"]).default("grid"),
  allowSaturday: z.boolean().default(true),
  allowSunday: z.boolean().default(false),
  conflictRules: z
    .object({
      teacher: z.boolean().default(true),
      class: z.boolean().default(true),
      room: z.boolean().default(true),
    })
    .default({
      teacher: true,
      class: true,
      room: true,
    }),
  substitutionSettings: z
    .object({
      notifyTeacher: z.boolean().default(false),
      autoDetectAbsences: z.boolean().default(true),
    })
    .default({
      notifyTeacher: false,
      autoDetectAbsences: true,
    }),
});

export type TimetableSettingsInput = z.infer<typeof timetableSettingsSchema>;
