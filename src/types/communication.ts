export type AudienceType =
  | "Entire School"
  | "Students"
  | "Parents"
  | "Teachers"
  | "Staff"
  | "Specific Class"
  | "Specific Section"
  | "Specific Group";

export type AnnouncementPriority = "Normal" | "Important" | "Urgent";

export type AnnouncementStatus =
  | "Draft"
  | "Scheduled"
  | "Published"
  | "Expired"
  | "Archived";

export interface Announcement {
  id: string;
  organizationId: string;
  title: string;
  content: string;
  audienceType: AudienceType;
  targetClassId?: string;
  targetClassName?: string;
  targetSectionId?: string;
  targetSectionName?: string;
  priority: AnnouncementPriority;
  attachments?: { name: string; url: string; size?: number }[];
  status: AnnouncementStatus;
  publishMode: "NOW" | "SCHEDULED";
  publishAt?: string;
  expiresAt?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
}

export type NoticeCategory =
  | "Academic"
  | "Holiday"
  | "Exam"
  | "Fee"
  | "Attendance"
  | "Event"
  | "General"
  | "Emergency"
  | "Other";

export type NoticeStatus = "Draft" | "Published" | "Archived";

export interface Notice {
  id: string;
  organizationId: string;
  noticeNumber: string;
  title: string;
  category: string;
  content: string;
  audienceType: AudienceType;
  targetClassId?: string;
  targetClassName?: string;
  targetSectionId?: string;
  targetSectionName?: string;
  publishDate: string;
  expiryDate?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  signatureTitle?: string;
  issuedBy: string;
  status: NoticeStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export type CommunicationChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";

export type MessageDeliveryStatus =
  | "SUBMITTED"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "READ";

export interface CommunicationMessage {
  id: string;
  organizationId: string;
  channel: CommunicationChannel;
  audienceType: AudienceType;
  recipientIds?: string[];
  recipientNames?: string[];
  recipientCount: number;
  subject: string;
  content: string;
  attachments?: { name: string; url: string }[];
  status: MessageDeliveryStatus;
  provider?: string;
  providerMessageId?: string;
  submittedAt: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export type TemplateCategory =
  | "Admissions"
  | "Fees"
  | "Attendance"
  | "Exams"
  | "General"
  | "Emergency";

export interface CommunicationTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: TemplateCategory;
  channel: CommunicationChannel;
  subject: string;
  body: string;
  variables: string[];
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "ADMISSION"
  | "FEE"
  | "ATTENDANCE"
  | "ASSIGNMENT"
  | "EXAM"
  | "NOTICE"
  | "GENERAL";

export interface InAppNotification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface CommunicationHistoryItem {
  id: string;
  organizationId: string;
  timestamp: string;
  type: "ANNOUNCEMENT" | "NOTICE" | "MESSAGE" | "NOTIFICATION";
  channel: string;
  recipientSummary: string;
  subject: string;
  status: string;
  actorId: string;
  actorName: string;
}

export interface CommunicationSettingsConfig {
  enabledChannels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  providers: {
    email: { providerName: string; isConfigured: boolean };
    sms: { providerName: string; isConfigured: boolean };
    whatsapp: { providerName: string; isConfigured: boolean };
  };
  noticeNumberPrefix: string;
  autoNumberNotices: boolean;
  noticeCategories: string[];
}

export interface UserNotificationPreferences {
  userId: string;
  organizationId: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  eventTypes: {
    admissions: boolean;
    fees: boolean;
    attendance: boolean;
    assignments: boolean;
    exams: boolean;
    notices: boolean;
  };
}

export interface CommunicationStats {
  publishedAnnouncements: number;
  draftAnnouncements: number;
  scheduledMessages: number;
  notificationsSent: number;
  failedDeliveries: number;
  pendingCommunication: number;
}
