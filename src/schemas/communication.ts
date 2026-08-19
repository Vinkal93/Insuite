import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(5, "Content must be at least 5 characters"),
  audienceType: z.enum([
    "Entire School",
    "Students",
    "Parents",
    "Teachers",
    "Staff",
    "Specific Class",
    "Specific Section",
    "Specific Group",
  ]),
  targetClassId: z.string().optional(),
  targetClassName: z.string().optional(),
  targetSectionId: z.string().optional(),
  targetSectionName: z.string().optional(),
  priority: z.enum(["Normal", "Important", "Urgent"]).default("Normal"),
  publishMode: z.enum(["NOW", "SCHEDULED"]).default("NOW"),
  publishAt: z.string().optional(),
  expiresAt: z.string().optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
      })
    )
    .optional(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const noticeSchema = z.object({
  title: z.string().min(3, "Notice title must be at least 3 characters"),
  category: z.string().min(1, "Notice category is required"),
  noticeNumber: z.string().optional(),
  content: z.string().min(10, "Notice content must be at least 10 characters"),
  audienceType: z.enum([
    "Entire School",
    "Students",
    "Parents",
    "Teachers",
    "Staff",
    "Specific Class",
    "Specific Section",
    "Specific Group",
  ]),
  targetClassId: z.string().optional(),
  targetClassName: z.string().optional(),
  targetSectionId: z.string().optional(),
  targetSectionName: z.string().optional(),
  publishDate: z.string().min(1, "Publish date required"),
  expiryDate: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  signatureTitle: z.string().optional(),
  issuedBy: z.string().min(2, "Issued by designation required"),
  status: z.enum(["Draft", "Published", "Archived"]).default("Draft"),
});

export type NoticeInput = z.infer<typeof noticeSchema>;

export const messageSchema = z.object({
  channel: z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]),
  audienceType: z.enum([
    "Entire School",
    "Students",
    "Parents",
    "Teachers",
    "Staff",
    "Specific Class",
    "Specific Section",
    "Specific Group",
  ]),
  targetClassId: z.string().optional(),
  targetSectionId: z.string().optional(),
  recipientIds: z.array(z.string()).optional(),
  subject: z.string().min(2, "Subject is required"),
  content: z.string().min(5, "Message body is required"),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      })
    )
    .optional(),
});

export type MessageInput = z.infer<typeof messageSchema>;

export const templateSchema = z.object({
  name: z.string().min(2, "Template name required"),
  category: z.enum(["Admissions", "Fees", "Attendance", "Exams", "General", "Emergency"]),
  channel: z.enum(["IN_APP", "EMAIL", "SMS", "WHATSAPP"]),
  subject: z.string().min(2, "Subject line required"),
  body: z.string().min(5, "Template content required"),
  variables: z.array(z.string()).default([]),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export type TemplateInput = z.infer<typeof templateSchema>;

export const communicationSettingsSchema = z.object({
  enabledChannels: z.object({
    inApp: z.boolean().default(true),
    email: z.boolean().default(false),
    sms: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
  }),
  noticeNumberPrefix: z.string().default("NTC-2026"),
  autoNumberNotices: z.boolean().default(true),
  noticeCategories: z.array(z.string()).min(1),
});

export type CommunicationSettingsInput = z.infer<typeof communicationSettingsSchema>;
