import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  User,
  GraduationCap,
  Users,
  FileText,
  Activity,
  Edit,
  UserX,
  Printer,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  CreditCard,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getStudent, deactivateStudent } from "@/services/studentService";
import { getParent } from "@/services/parentService";
import {
  getStudentDocuments,
  uploadStudentDocument,
  deleteStudentDocument,
} from "@/services/documentService";
import { getAuditLogsForEntity } from "@/services/auditService";
import { getStudentAttendanceSummary } from "@/services/attendanceService";
import { getStudentFeeSummary } from "@/services/feeService";
import type {
  Student,
  Parent,
  StudentDocument,
  AuditLog,
  DocumentType,
  StudentAttendanceSummary,
  StudentFeeSummary,
} from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DeactivateStudentModal } from "./DeactivateStudentModal";

interface StudentProfileViewProps {
  studentId: string;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ studentId }) => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [father, setFather] = useState<Parent | null>(null);
  const [mother, setMother] = useState<Parent | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummary | null>(null);
  const [feeSummary, setFeeSummary] = useState<StudentFeeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "academic" | "attendance" | "parents" | "fees" | "documents" | "activity">("overview");

  // Deactivate modal
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  // Document upload modal
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docType, setDocType] = useState<DocumentType>("BIRTH_CERTIFICATE");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Document delete state
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const loadStudentData = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const studentData = await getStudent(organization.id, studentId);
      setStudent(studentData);

      if (studentData) {
        // Fetch Parents
        const parentPromises = [];
        if (studentData.parentIds?.fatherId) {
          parentPromises.push(getParent(organization.id, studentData.parentIds.fatherId).then(setFather));
        }
        if (studentData.parentIds?.motherId) {
          parentPromises.push(getParent(organization.id, studentData.parentIds.motherId).then(setMother));
        }

        // Fetch Documents, Audit Activity, Attendance Summary & Fee Summary
        const [docs, logs, attSummary, fSummary] = await Promise.all([
          getStudentDocuments(organization.id, studentData.id),
          getAuditLogsForEntity(organization.id, studentData.id),
          getStudentAttendanceSummary(organization.id, studentData.id, selectedSession?.id).catch(() => null),
          getStudentFeeSummary(organization.id, studentData.id).catch(() => null),
          ...parentPromises,
        ]);
        setDocuments(docs);
        setActivities(logs);
        setAttendanceSummary(attSummary);
        setFeeSummary(fSummary);
      }
    } catch (err) {
      console.error("Error loading student profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, studentId, selectedSession]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const handleDeactivate = async (
    status: "INACTIVE" | "TRANSFERRED" | "WITHDRAWN",
    reason: string
  ) => {
    if (!organization || !student || !firebaseUser) return;
    await deactivateStudent(
      organization.id,
      student.id,
      status,
      reason,
      { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
    );
    await loadStudentData();
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !student || !docFile || !firebaseUser) return;
    setIsUploading(true);
    setDocError(null);
    try {
      await uploadStudentDocument(
        organization.id,
        student.id,
        docFile,
        docType,
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setIsUploadDocOpen(false);
      setDocFile(null);
      const docs = await getStudentDocuments(organization.id, student.id);
      setDocuments(docs);
    } catch (err: any) {
      setDocError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!organization || !student || !firebaseUser) return;
    if (!confirm("Are you sure you want to delete this document?")) return;
    setDeletingDocId(docId);
    try {
      await deleteStudentDocument(
        organization.id,
        student.id,
        docId,
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      const docs = await getStudentDocuments(organization.id, student.id);
      setDocuments(docs);
    } catch (err) {
      console.error("Error deleting doc:", err);
    } finally {
      setDeletingDocId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-6">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="mt-3 text-lg font-bold">Student Record Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">The requested student ID does not exist in your school directory.</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/students">Back to Students Directory</Link>
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "academic", label: "Academic", icon: GraduationCap },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "fees", label: "Fees & Ledger", icon: CreditCard },
    { id: "parents", label: "Parents & Guardians", icon: Users },
    { id: "documents", label: `Documents (${documents.length})`, icon: FileText },
    { id: "activity", label: "Audit Activity", icon: Activity },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Student Profile Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {/* Student Photo */}
            <div className="size-20 rounded-2xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="font-bold text-xl text-muted-foreground">
                  {student.firstName[0]}{student.lastName[0]}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{student.fullName}</h1>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                  {student.studentId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    student.status === "ACTIVE"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Class: <strong className="text-foreground">{student.academic.className}</strong> ({student.academic.sectionName})</span>
                <span>•</span>
                <span>Admission No: <strong className="text-foreground font-mono">{student.admissionNumber}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
              <Link to="/students/$studentId/edit" params={{ studentId: student.id }}>
                <Edit className="size-3.5 mr-1 text-primary" /> Edit Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" disabled className="rounded-xl text-xs opacity-60">
              <Printer className="size-3.5 mr-1" /> ID Card
            </Button>
            {student.status === "ACTIVE" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeactivateOpen(true)}
                className="rounded-xl text-xs font-semibold"
              >
                <UserX className="size-3.5 mr-1" /> Deactivate
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <t.icon className="size-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Personal Info */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-semibold text-foreground font-mono mt-0.5">{student.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-semibold text-foreground capitalize mt-0.5">{student.gender.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Blood Group</p>
                <p className="font-semibold text-foreground mt-0.5">{student.bloodGroup || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Category</p>
                <p className="font-semibold text-foreground mt-0.5">{student.category || "General"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nationality</p>
                <p className="font-semibold text-foreground mt-0.5">{student.nationality || "Indian"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Religion</p>
                <p className="font-semibold text-foreground mt-0.5">{student.religion || "—"}</p>
              </div>
            </div>
          </div>

          {/* Contact & Address */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Contact & Residence
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-primary shrink-0" />
                <span>{student.contact.mobile || "No student phone mapped"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary shrink-0" />
                <span>{student.contact.email || "No student email mapped"}</span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-border/60">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{student.address.addressLine}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {[student.address.city, student.address.state, student.address.postalCode, student.address.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Academic */}
      {activeTab === "academic" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
            Current Academic Enrollment
          </h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-muted-foreground">Class / Grade</p>
              <p className="mt-1 font-display text-base font-extrabold text-foreground">{student.academic.className}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-muted-foreground">Section</p>
              <p className="mt-1 font-display text-base font-extrabold text-foreground">{student.academic.sectionName || "Section A"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-muted-foreground">Roll Number</p>
              <p className="mt-1 font-mono text-base font-extrabold text-primary">{student.academic.rollNumber || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-muted-foreground">Admission Date</p>
              <p className="mt-1 font-mono text-sm font-bold text-foreground">{student.academic.admissionDate}</p>
            </div>
          </div>

          {student.previousSchool && (
            <div className="rounded-2xl border border-border bg-surface p-4 text-xs">
              <p className="text-muted-foreground">Previous Institution</p>
              <p className="mt-1 font-semibold text-foreground">{student.previousSchool}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: Attendance */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attendance %</span>
              <p className="mt-1 text-2xl font-black text-foreground">
                {attendanceSummary?.percentage ?? 0}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Overall Presence</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Present</span>
              <p className="mt-1 text-2xl font-black text-emerald-600">
                {attendanceSummary?.present ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Days In School</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Absent</span>
              <p className="mt-1 text-2xl font-black text-rose-500">
                {attendanceSummary?.absent ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Days Absent</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Late</span>
              <p className="mt-1 text-2xl font-black text-amber-500">
                {attendanceSummary?.late ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tardy Arrivals</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Leave</span>
              <p className="mt-1 text-2xl font-black text-blue-500">
                {attendanceSummary?.leave ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Authorized Leaves</p>
            </div>
          </div>

          {/* Roll Call History Log */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attendance Calendar Log
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">
                Total Days: {attendanceSummary?.totalDays ?? 0}
              </span>
            </div>

            {(!attendanceSummary?.records || attendanceSummary.records.length === 0) ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No attendance roll call records found for this student.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Marked At</th>
                      <th className="px-4 py-3 font-bold">Marked By</th>
                      <th className="px-4 py-3 font-bold">Remarks / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendanceSummary.records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                          {rec.date}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              rec.status === "present"
                                ? "bg-success/15 text-success"
                                : rec.status === "absent"
                                ? "bg-rose-500/15 text-rose-500"
                                : rec.status === "late"
                                ? "bg-amber-500/15 text-amber-500"
                                : "bg-blue-500/15 text-blue-500"
                            }`}
                          >
                            {rec.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">
                          {new Date(rec.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {rec.markedByName || "Admin"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {rec.changeReason || rec.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Parents */}
      {activeTab === "parents" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Father Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Father's Information</h3>
              {father && (
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary">
                  <Link to="/parents/$parentId" params={{ parentId: father.id }}>
                    <ExternalLink className="size-3 mr-1" /> View Profile
                  </Link>
                </Button>
              )}
            </div>

            {father ? (
              <div className="space-y-2 text-xs">
                <p className="font-bold text-sm text-foreground">{father.fullName}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5 text-primary" /> {father.mobile}
                </div>
                {father.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 text-primary" /> {father.email}
                  </div>
                )}
                {father.occupation && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-semibold text-foreground">Occupation:</span> {father.occupation}
                  </div>
                )}
              </div>
            ) : (
              <p className="py-4 text-xs text-muted-foreground">No father record linked to this student.</p>
            )}
          </div>

          {/* Mother Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mother's Information</h3>
              {mother && (
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary">
                  <Link to="/parents/$parentId" params={{ parentId: mother.id }}>
                    <ExternalLink className="size-3 mr-1" /> View Profile
                  </Link>
                </Button>
              )}
            </div>

            {mother ? (
              <div className="space-y-2 text-xs">
                <p className="font-bold text-sm text-foreground">{mother.fullName}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5 text-primary" /> {mother.mobile}
                </div>
                {mother.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="size-3.5 text-primary" /> {mother.email}
                  </div>
                )}
                {mother.occupation && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-semibold text-foreground">Occupation:</span> {mother.occupation}
                  </div>
                )}
              </div>
            ) : (
              <p className="py-4 text-xs text-muted-foreground">No mother record linked to this student.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB: Fees & Ledger */}
      {activeTab === "fees" && (
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Assigned</span>
              <p className="text-xl font-black text-foreground">₹{(feeSummary?.totalAssigned || 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">All Invoices</p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600">Total Paid</span>
              <p className="text-xl font-black text-emerald-600">₹{(feeSummary?.totalPaid || 0).toLocaleString()}</p>
              <p className="text-[10px] text-emerald-700/80">Cleared Receipts</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Pending</span>
              <p className="text-xl font-black text-foreground">₹{(feeSummary?.totalPending || 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Outstanding</p>
            </div>

            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-rose-500">Overdue Balance</span>
              <p className="text-xl font-black text-rose-500">₹{(feeSummary?.totalOverdue || 0).toLocaleString()}</p>
              <p className="text-[10px] text-rose-600/80">Past Due Date</p>
            </div>
          </div>

          {/* Invoices List */}
          <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-sm font-extrabold text-foreground">Invoices ({feeSummary?.invoices.length || 0})</h3>
              {feeSummary && feeSummary.totalPending > 0 && (
                <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
                  <Link to="/fees/collect" search={{ studentId: student.id }}>
                    <CreditCard className="size-3.5 mr-1.5" /> Collect Payment
                  </Link>
                </Button>
              )}
            </div>

            {!feeSummary || feeSummary.invoices.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground italic">No fee invoices generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3.5">Invoice #</th>
                      <th className="px-4 py-3.5">Structure</th>
                      <th className="px-4 py-3.5">Due Date</th>
                      <th className="px-4 py-3.5">Amount</th>
                      <th className="px-4 py-3.5">Paid</th>
                      <th className="px-4 py-3.5">Balance</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {feeSummary.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-6 py-3.5 font-mono font-bold text-foreground">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3.5 font-medium">{inv.feeStructureName}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{inv.dueDate}</td>
                        <td className="px-4 py-3.5 font-mono font-bold">₹{inv.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold">₹{inv.paidAmount.toLocaleString()}</td>
                        <td className="px-4 py-3.5 font-mono text-rose-500 font-bold">₹{inv.balanceAmount.toLocaleString()}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : inv.status === "OVERDUE"
                                ? "bg-rose-500/10 text-rose-500"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {inv.balanceAmount > 0 && (
                            <Button variant="hero" size="sm" asChild className="rounded-lg h-7 px-2 text-xs font-bold">
                              <Link to="/fees/collect" search={{ studentId: student.id, invoiceId: inv.id }}>
                                Pay
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Documents */}
      {activeTab === "documents" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Uploaded Documents & Records</h3>
              <p className="text-xs text-muted-foreground">Official verification files, birth certs & marksheets</p>
            </div>
            <Button
              variant="hero"
              size="sm"
              onClick={() => setIsUploadDocOpen(true)}
              className="rounded-xl text-xs font-bold"
            >
              <Plus className="size-3.5 mr-1" /> Upload Document
            </Button>
          </div>

          {documents.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No documents uploaded for this student yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Document</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Uploaded Date</th>
                    <th className="px-4 py-2.5">Uploaded By</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{doc.fileName}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {doc.documentType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {doc.uploadedAt.split("T")[0]}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {doc.uploadedByName || "Admin"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild className="size-7 rounded-lg">
                            <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="size-3.5" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingDocId === doc.id}
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="size-7 rounded-lg text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Activity */}
      {activeTab === "activity" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Activity className="size-4 text-primary" />
            <h3 className="text-sm font-extrabold text-foreground">Student Audit Trail</h3>
          </div>

          {activities.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No recent activity recorded for this student.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 text-xs">
                  <div className="grid size-8 place-items-center rounded-xl bg-card border border-border text-primary shrink-0">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="font-bold text-foreground">{act.action.replace("_", " ")}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                      <span>By {act.actorName}</span>
                      <span>•</span>
                      <span className="font-mono">{act.timestamp.split("T")[0]}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUploadDoc}>
            <DialogHeader>
              <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="size-6" />
              </div>
              <DialogTitle className="text-center font-bold">Upload Student Document</DialogTitle>
              <DialogDescription className="text-center text-xs">
                Upload verified PDFs, JPGs, or PNGs up to 5MB.
              </DialogDescription>
            </DialogHeader>

            {docError && (
              <div className="my-2 rounded-xl bg-destructive/10 p-2 text-xs text-destructive">
                {docError}
              </div>
            )}

            <div className="space-y-4 py-4 text-xs">
              <div>
                <Label className="text-xs font-semibold">Document Category *</Label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
                >
                  <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                  <option value="PREVIOUS_MARKSHEET">Previous Marksheet</option>
                  <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC)</option>
                  <option value="PHOTO_ID">Govt / Photo ID</option>
                  <option value="OTHER">Other Official Document</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Select File *</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  required
                  onChange={(e) => {
                    if (e.target.files?.[0]) setDocFile(e.target.files[0]);
                  }}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadDocOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="hero" size="sm" disabled={isUploading || !docFile} className="rounded-xl font-bold">
                {isUploading ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                Upload Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Modal */}
      {isDeactivateOpen && (
        <DeactivateStudentModal
          isOpen={isDeactivateOpen}
          onClose={() => setIsDeactivateOpen(false)}
          studentName={student.fullName}
          studentId={student.id}
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
};
