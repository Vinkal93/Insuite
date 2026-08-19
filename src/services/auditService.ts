import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AuditLog, AuditAction, AuditEntityType } from "@/types";

export const createAuditLog = async (
  orgId: string,
  entry: {
    actorId: string;
    actorName: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    metadata?: Record<string, any>;
  }
): Promise<void> => {
  try {
    const logsCol = collection(db, "organizations", orgId, "auditLogs");
    const newLogDoc = doc(logsCol);
    const auditLog: AuditLog = {
      id: newLogDoc.id,
      organizationId: orgId,
      actorId: entry.actorId,
      actorName: entry.actorName,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      timestamp: new Date().toISOString(),
      metadata: entry.metadata || {},
    };
    await setDoc(newLogDoc, auditLog);
  } catch (err) {
    console.warn("Failed to write audit log:", err);
  }
};

/**
 * Backwards-compatible alias for logAuditEvent
 */
export const logAuditEvent = async (
  orgId: string,
  entry: {
    action: any;
    entity?: any;
    entityType?: any;
    entityId?: string;
    performedBy?: { uid: string; name: string };
    actorId?: string;
    actorName?: string;
    entityName?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> => {
  return createAuditLog(orgId, {
    actorId: entry.performedBy?.uid || entry.actorId || "system",
    actorName: entry.performedBy?.name || entry.actorName || "System",
    action: entry.action,
    entityType: entry.entityType || entry.entity || "SCHOOL",
    entityId: entry.entityId || "global",
    metadata: {
      entityName: entry.entityName,
      ...entry.metadata,
    },
  });
};

export const getAuditLogsForEntity = async (
  orgId: string,
  entityId: string
): Promise<AuditLog[]> => {
  const logsCol = collection(db, "organizations", orgId, "auditLogs");
  const q = query(
    logsCol,
    where("entityId", "==", entityId),
    orderBy("timestamp", "desc"),
    firestoreLimit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AuditLog);
};

export const getRecentAuditLogs = async (
  orgId: string,
  count = 20
): Promise<AuditLog[]> => {
  const logsCol = collection(db, "organizations", orgId, "auditLogs");
  const q = query(logsCol, orderBy("timestamp", "desc"), firestoreLimit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AuditLog);
};
