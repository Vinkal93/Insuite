import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Announcement,
  Notice,
  CommunicationMessage,
  CommunicationTemplate,
  InAppNotification,
  CommunicationHistoryItem,
  CommunicationSettingsConfig,
  CommunicationStats,
  NotificationType,
  AudienceType,
} from "@/types/communication";
import type {
  AnnouncementInput,
  NoticeInput,
  MessageInput,
  TemplateInput,
  CommunicationSettingsInput,
} from "@/schemas/communication";
import { createAuditLog } from "./auditService";
import { listStudents } from "./studentService";
import { getSchoolClassById, getSectionById } from "./academicService";
import { providerRegistry } from "./communicationProvider";

export const DEFAULT_COMMUNICATION_SETTINGS: CommunicationSettingsConfig = {
  enabledChannels: {
    inApp: true,
    email: false,
    sms: false,
    whatsapp: false,
  },
  providers: {
    email: { providerName: "SMTP / SendGrid", isConfigured: false },
    sms: { providerName: "Twilio / MSG91", isConfigured: false },
    whatsapp: { providerName: "Meta WhatsApp Cloud API", isConfigured: false },
  },
  noticeNumberPrefix: "NTC-2026",
  autoNumberNotices: true,
  noticeCategories: [
    "Academic",
    "Holiday",
    "Exam",
    "Fee",
    "Attendance",
    "Event",
    "General",
    "Emergency",
    "Other",
  ],
};

// ----------------------------------------------------
// 1. SETTINGS & NUMBER GENERATION
// ----------------------------------------------------

export const getCommunicationSettings = async (
  orgId: string
): Promise<CommunicationSettingsConfig> => {
  try {
    const docRef = doc(db, "organizations", orgId, "communicationSettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_COMMUNICATION_SETTINGS;
    return { ...DEFAULT_COMMUNICATION_SETTINGS, ...snap.data() } as CommunicationSettingsConfig;
  } catch (err) {
    console.error("getCommunicationSettings error:", err);
    return DEFAULT_COMMUNICATION_SETTINGS;
  }
};

export const updateCommunicationSettings = async (
  orgId: string,
  input: CommunicationSettingsInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "communicationSettings", "config");
  await setDoc(
    docRef,
    {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    },
    { merge: true }
  );

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "COMMUNICATION_SETTINGS_UPDATED",
    entityType: "COMMUNICATION_SETTINGS",
    entityId: "config",
  });
};

export const generateNextNoticeNumber = async (
  orgId: string,
  prefix = "NTC-2026"
): Promise<string> => {
  const counterRef = doc(db, "organizations", orgId, "counters", "notices");
  return await runTransaction(db, async (txn) => {
    const snap = await txn.get(counterRef);
    let nextCount = 1;
    if (snap.exists()) {
      nextCount = (snap.data().lastCount || 0) + 1;
    }
    txn.set(counterRef, { lastCount: nextCount, updatedAt: serverTimestamp() }, { merge: true });
    const padded = String(nextCount).padStart(5, "0");
    return `${prefix}-${padded}`;
  });
};

// ----------------------------------------------------
// 2. ANNOUNCEMENTS CRUD
// ----------------------------------------------------

export const createAnnouncement = async (
  orgId: string,
  input: AnnouncementInput,
  actor: { uid: string; name: string }
): Promise<Announcement> => {
  const colRef = collection(db, "organizations", orgId, "announcements");
  const docRef = doc(colRef);

  let targetClassName = input.targetClassName;
  let targetSectionName = input.targetSectionName;

  if (input.targetClassId && !targetClassName) {
    const cls = await getSchoolClassById(orgId, input.targetClassId);
    targetClassName = cls?.name;
  }
  if (input.targetSectionId && !targetSectionName) {
    const sec = await getSectionById(orgId, input.targetSectionId);
    targetSectionName = sec?.name;
  }

  const isPublishedNow = input.publishMode === "NOW";
  const now = new Date().toISOString();

  const announcement: Announcement = {
    id: docRef.id,
    organizationId: orgId,
    title: input.title,
    content: input.content,
    audienceType: input.audienceType,
    targetClassId: input.targetClassId,
    targetClassName,
    targetSectionId: input.targetSectionId,
    targetSectionName,
    priority: input.priority || "Normal",
    attachments: input.attachments || [],
    status: isPublishedNow ? "Published" : "Draft",
    publishMode: input.publishMode,
    publishAt: input.publishAt || (isPublishedNow ? now : undefined),
    expiresAt: input.expiresAt,
    createdBy: actor.uid,
    createdByName: actor.name,
    createdAt: now,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  await setDoc(docRef, announcement);

  // Write to Communication History
  const historyRef = doc(collection(db, "organizations", orgId, "communicationHistory"));
  await setDoc(historyRef, {
    id: historyRef.id,
    organizationId: orgId,
    timestamp: now,
    type: "ANNOUNCEMENT",
    channel: "IN_APP",
    recipientSummary: announcement.audienceType,
    subject: announcement.title,
    status: announcement.status,
    actorId: actor.uid,
    actorName: actor.name,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: isPublishedNow ? "ANNOUNCEMENT_PUBLISHED" : "ANNOUNCEMENT_CREATED",
    entityType: "ANNOUNCEMENT",
    entityId: docRef.id,
    metadata: { title: announcement.title, audience: announcement.audienceType },
  });

  return announcement;
};

export const getAnnouncement = async (
  orgId: string,
  id: string
): Promise<Announcement | null> => {
  const docRef = doc(db, "organizations", orgId, "announcements", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as Announcement;
};

export const updateAnnouncement = async (
  orgId: string,
  id: string,
  input: Partial<AnnouncementInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "announcements", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...input,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ANNOUNCEMENT_UPDATED",
    entityType: "ANNOUNCEMENT",
    entityId: id,
  });
};

export const publishAnnouncement = async (
  orgId: string,
  id: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "announcements", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Published",
    publishAt: now,
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ANNOUNCEMENT_PUBLISHED",
    entityType: "ANNOUNCEMENT",
    entityId: id,
  });
};

export const archiveAnnouncement = async (
  orgId: string,
  id: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "announcements", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Archived",
    updatedAt: now,
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "ANNOUNCEMENT_ARCHIVED",
    entityType: "ANNOUNCEMENT",
    entityId: id,
  });
};

export const listAnnouncements = async (
  orgId: string,
  filters?: { status?: string; audienceType?: string }
): Promise<Announcement[]> => {
  const colRef = collection(db, "organizations", orgId, "announcements");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Announcement);

  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.audienceType && filters.audienceType !== "ALL") {
    list = list.filter((a) => a.audienceType === filters.audienceType);
  }

  return list;
};

// ----------------------------------------------------
// 3. FORMAL NOTICES CRUD
// ----------------------------------------------------

export const createNotice = async (
  orgId: string,
  input: NoticeInput,
  actor: { uid: string; name: string }
): Promise<Notice> => {
  const colRef = collection(db, "organizations", orgId, "notices");
  const docRef = doc(colRef);

  let noticeNumber = input.noticeNumber;
  if (!noticeNumber) {
    const settings = await getCommunicationSettings(orgId);
    noticeNumber = await generateNextNoticeNumber(orgId, settings.noticeNumberPrefix);
  }

  let targetClassName = input.targetClassName;
  let targetSectionName = input.targetSectionName;

  if (input.targetClassId && !targetClassName) {
    const cls = await getSchoolClassById(orgId, input.targetClassId);
    targetClassName = cls?.name;
  }
  if (input.targetSectionId && !targetSectionName) {
    const sec = await getSectionById(orgId, input.targetSectionId);
    targetSectionName = sec?.name;
  }

  const now = new Date().toISOString();
  const notice: Notice = {
    id: docRef.id,
    organizationId: orgId,
    noticeNumber,
    title: input.title,
    category: input.category,
    content: input.content,
    audienceType: input.audienceType,
    targetClassId: input.targetClassId,
    targetClassName,
    targetSectionId: input.targetSectionId,
    targetSectionName,
    publishDate: input.publishDate,
    expiryDate: input.expiryDate,
    attachmentUrl: input.attachmentUrl,
    attachmentName: input.attachmentName,
    signatureTitle: input.signatureTitle || "Principal / Authorised Signatory",
    issuedBy: input.issuedBy,
    status: input.status || "Draft",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
  };

  await setDoc(docRef, notice);

  // Write to Communication History
  const historyRef = doc(collection(db, "organizations", orgId, "communicationHistory"));
  await setDoc(historyRef, {
    id: historyRef.id,
    organizationId: orgId,
    timestamp: now,
    type: "NOTICE",
    channel: "IN_APP",
    recipientSummary: notice.audienceType,
    subject: `[${notice.noticeNumber}] ${notice.title}`,
    status: notice.status,
    actorId: actor.uid,
    actorName: actor.name,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: notice.status === "Published" ? "NOTICE_PUBLISHED" : "NOTICE_CREATED",
    entityType: "NOTICE",
    entityId: docRef.id,
    metadata: { noticeNumber: notice.noticeNumber, title: notice.title },
  });

  return notice;
};

export const getNotice = async (orgId: string, id: string): Promise<Notice | null> => {
  const docRef = doc(db, "organizations", orgId, "notices", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as Notice;
};

export const updateNotice = async (
  orgId: string,
  id: string,
  input: Partial<NoticeInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "notices", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...input,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "NOTICE_UPDATED",
    entityType: "NOTICE",
    entityId: id,
  });
};

export const publishNotice = async (
  orgId: string,
  id: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "notices", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Published",
    publishDate: now.split("T")[0],
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "NOTICE_PUBLISHED",
    entityType: "NOTICE",
    entityId: id,
  });
};

export const archiveNotice = async (
  orgId: string,
  id: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "notices", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Archived",
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "NOTICE_ARCHIVED",
    entityType: "NOTICE",
    entityId: id,
  });
};

export const listNotices = async (
  orgId: string,
  filters?: { category?: string; status?: string }
): Promise<Notice[]> => {
  const colRef = collection(db, "organizations", orgId, "notices");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as Notice);

  if (filters?.category && filters.category !== "ALL") {
    list = list.filter((n) => n.category === filters.category);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((n) => n.status === filters.status);
  }

  return list;
};

// ----------------------------------------------------
// 4. MESSAGES & PROVIDER DISPATCH
// ----------------------------------------------------

export const sendMessage = async (
  orgId: string,
  input: MessageInput,
  actor: { uid: string; name: string }
): Promise<CommunicationMessage> => {
  const settings = await getCommunicationSettings(orgId);
  const provider = providerRegistry[input.channel];

  if (!provider) {
    throw new Error(`Unsupported communication channel: ${input.channel}`);
  }

  // Resolve actual recipient count
  let recipientCount = 1;
  let recipientIds = input.recipientIds || [];

  if (input.audienceType === "Entire School" || input.audienceType === "Students") {
    const students = await listStudents(orgId, { status: "ACTIVE" });
    recipientCount = Math.max(1, students.length);
    recipientIds = students.map((s) => s.id);
  } else if (input.audienceType === "Specific Class" && input.targetClassId) {
    const students = await listStudents(orgId, { classId: input.targetClassId, status: "ACTIVE" });
    recipientCount = Math.max(1, students.length);
    recipientIds = students.map((s) => s.id);
  }

  const dispatchResult = await provider.send(
    {
      organizationId: orgId,
      recipientIds,
      subject: input.subject,
      content: input.content,
    },
    settings
  );

  const docRef = doc(collection(db, "organizations", orgId, "communicationMessages"));
  const now = new Date().toISOString();

  const messageRecord: CommunicationMessage = {
    id: docRef.id,
    organizationId: orgId,
    channel: input.channel,
    audienceType: input.audienceType,
    recipientIds,
    recipientCount,
    subject: input.subject,
    content: input.content,
    attachments: input.attachments || [],
    status: dispatchResult.status,
    provider: dispatchResult.provider,
    providerMessageId: dispatchResult.providerMessageId,
    submittedAt: now,
    deliveredAt: dispatchResult.status === "DELIVERED" ? now : undefined,
    failedAt: dispatchResult.status === "FAILED" ? now : undefined,
    failureReason: dispatchResult.error,
    createdBy: actor.uid,
    createdByName: actor.name,
    createdAt: now,
  };

  await setDoc(docRef, messageRecord);

  // Write to Communication History
  const historyRef = doc(collection(db, "organizations", orgId, "communicationHistory"));
  await setDoc(historyRef, {
    id: historyRef.id,
    organizationId: orgId,
    timestamp: now,
    type: "MESSAGE",
    channel: input.channel,
    recipientSummary: `${input.audienceType} (${recipientCount} recipients)`,
    subject: input.subject,
    status: dispatchResult.status,
    actorId: actor.uid,
    actorName: actor.name,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: dispatchResult.success ? "MESSAGE_SENT" : "MESSAGE_FAILED",
    entityType: "COMMUNICATION_MESSAGE",
    entityId: docRef.id,
    metadata: {
      channel: input.channel,
      status: dispatchResult.status,
      error: dispatchResult.error,
    },
  });

  if (!dispatchResult.success) {
    throw new Error(dispatchResult.error || "Message delivery failed with external provider.");
  }

  return messageRecord;
};

export const listMessages = async (
  orgId: string,
  filters?: { channel?: string; status?: string }
): Promise<CommunicationMessage[]> => {
  const colRef = collection(db, "organizations", orgId, "communicationMessages");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as CommunicationMessage);

  if (filters?.channel && filters.channel !== "ALL") {
    list = list.filter((m) => m.channel === filters.channel);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((m) => m.status === filters.status);
  }

  return list;
};

// ----------------------------------------------------
// 5. TEMPLATES & VARIABLE INTERPOLATION
// ----------------------------------------------------

export const DEFAULT_TEMPLATES: Partial<CommunicationTemplate>[] = [
  {
    name: "Fee Due Reminder",
    category: "Fees",
    channel: "SMS",
    subject: "Fee Payment Reminder - InSuite Academy",
    body: "Dear {{parentName}}, this is a reminder that fee payment of Rs. {{amount}} for {{studentName}} (Class {{className}}) is due on {{dueDate}}.",
    variables: ["studentName", "parentName", "className", "amount", "dueDate"],
    status: "Active",
  },
  {
    name: "Exam Result Published",
    category: "Exams",
    channel: "IN_APP",
    subject: "Official Examination Results Published",
    body: "Results for {{examName}} have been processed and published for {{studentName}}. You can now view and download the official report card.",
    variables: ["studentName", "examName"],
    status: "Active",
  },
  {
    name: "Absence Alert",
    category: "Attendance",
    channel: "SMS",
    subject: "Student Absence Notification",
    body: "Dear {{parentName}}, your ward {{studentName}} has been marked absent today without prior leave authorization.",
    variables: ["studentName", "parentName"],
    status: "Active",
  },
];

export const createTemplate = async (
  orgId: string,
  input: TemplateInput,
  actor: { uid: string; name: string }
): Promise<CommunicationTemplate> => {
  const colRef = collection(db, "organizations", orgId, "communicationTemplates");
  const docRef = doc(colRef);
  const now = new Date().toISOString();

  const template: CommunicationTemplate = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    category: input.category,
    channel: input.channel,
    subject: input.subject,
    body: input.body,
    variables: input.variables || [],
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, template);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TEMPLATE_CREATED",
    entityType: "COMMUNICATION_TEMPLATE",
    entityId: docRef.id,
    metadata: { name: template.name },
  });

  return template;
};

export const updateTemplate = async (
  orgId: string,
  id: string,
  input: Partial<TemplateInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "communicationTemplates", id);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    ...input,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TEMPLATE_UPDATED",
    entityType: "COMMUNICATION_TEMPLATE",
    entityId: id,
  });
};

export const deleteTemplate = async (
  orgId: string,
  id: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "communicationTemplates", id);
  await deleteDoc(docRef);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "TEMPLATE_DELETED",
    entityType: "COMMUNICATION_TEMPLATE",
    entityId: id,
  });
};

export const listTemplates = async (
  orgId: string,
  channel?: string
): Promise<CommunicationTemplate[]> => {
  const colRef = collection(db, "organizations", orgId, "communicationTemplates");
  const snap = await getDocs(colRef);
  let list = snap.docs.map((d) => d.data() as CommunicationTemplate);

  if (channel && channel !== "ALL") {
    list = list.filter((t) => t.channel === channel);
  }

  return list;
};

export const renderTemplate = (
  templateBody: string,
  variables: Record<string, string | number>
): string => {
  let rendered = templateBody;
  for (const [key, val] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(pattern, String(val));
  }
  return rendered;
};

// ----------------------------------------------------
// 6. IN-APP NOTIFICATIONS & FEED
// ----------------------------------------------------

export const sendEventNotification = async (
  orgId: string,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
): Promise<InAppNotification> => {
  const docRef = doc(collection(db, "organizations", orgId, "notifications"));
  const now = new Date().toISOString();

  const item: InAppNotification = {
    id: docRef.id,
    organizationId: orgId,
    userId,
    type,
    title,
    message,
    entityType,
    entityId,
    read: false,
    createdAt: now,
  };

  await setDoc(docRef, item);
  return item;
};

export const listUserNotifications = async (
  orgId: string,
  userId: string,
  options?: { unreadOnly?: boolean }
): Promise<InAppNotification[]> => {
  const colRef = collection(db, "organizations", orgId, "notifications");
  const q = query(
    colRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    firestoreLimit(50)
  );

  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as InAppNotification);

  if (options?.unreadOnly) {
    list = list.filter((n) => !n.read);
  }

  return list;
};

export const markNotificationAsRead = async (
  orgId: string,
  notificationId: string
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "notifications", notificationId);
  await updateDoc(docRef, {
    read: true,
    readAt: new Date().toISOString(),
  });
};

export const markAllNotificationsAsRead = async (
  orgId: string,
  userId: string
): Promise<void> => {
  const colRef = collection(db, "organizations", orgId, "notifications");
  const q = query(colRef, where("userId", "==", userId), where("read", "==", false));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  snap.docs.forEach((d) => {
    batch.update(d.ref, { read: true, readAt: now });
  });

  await batch.commit();
};

// ----------------------------------------------------
// 7. HISTORY & ANALYTICS
// ----------------------------------------------------

export const listCommunicationHistory = async (
  orgId: string,
  filters?: { type?: string; channel?: string; status?: string }
): Promise<CommunicationHistoryItem[]> => {
  const colRef = collection(db, "organizations", orgId, "communicationHistory");
  const q = query(colRef, orderBy("timestamp", "desc"), firestoreLimit(100));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as CommunicationHistoryItem);

  if (filters?.type && filters.type !== "ALL") {
    list = list.filter((h) => h.type === filters.type);
  }
  if (filters?.channel && filters.channel !== "ALL") {
    list = list.filter((h) => h.channel === filters.channel);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((h) => h.status === filters.status);
  }

  return list;
};

export const getCommunicationStats = async (
  orgId: string
): Promise<CommunicationStats> => {
  const [announcements, messages, notices] = await Promise.all([
    listAnnouncements(orgId),
    listMessages(orgId),
    listNotices(orgId),
  ]);

  const publishedAnnouncements = announcements.filter((a) => a.status === "Published").length;
  const draftAnnouncements = announcements.filter((a) => a.status === "Draft").length;
  const scheduledMessages = announcements.filter((a) => a.status === "Scheduled").length;
  const notificationsSent = messages.filter((m) => m.status === "SENT" || m.status === "DELIVERED").length;
  const failedDeliveries = messages.filter((m) => m.status === "FAILED").length;
  const pendingCommunication = draftAnnouncements + scheduledMessages;

  return {
    publishedAnnouncements,
    draftAnnouncements,
    scheduledMessages,
    notificationsSent,
    failedDeliveries,
    pendingCommunication,
  };
};
