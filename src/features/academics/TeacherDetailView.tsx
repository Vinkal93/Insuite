import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  ArrowLeft,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Edit,
  PowerOff,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTeacherById,
  deactivateTeacher,
  getTeacherAssignments,
  uploadTeacherDoc,
  deleteTeacherDoc,
} from "@/services";
import type { Teacher, ClassTeacherAssignment, SubjectTeacherAssignment, TeacherStatus } from "@/types";
import { Button } from "@/components/ui/button";

interface TeacherDetailViewProps {
  teacherId: string;
}

export const TeacherDetailView: React.FC<TeacherDetailViewProps> = ({ teacherId }) => {
  const { organization, firebaseUser, selectedSession } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "subjects" | "documents" | "activity">("overview");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classAssignments, setClassAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectTeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Change State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<TeacherStatus>("inactive");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Document Upload State
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Certificate");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const t = await getTeacherById(organization.id, teacherId);
      if (!t) throw new Error("Teacher record not found");
      setTeacher(t);

      const assignments = await getTeacherAssignments(organization.id, teacherId, selectedSession?.id);
      setClassAssignments(assignments.classTeacherAssignments.filter((a) => a.status === "active"));
      setSubjectAssignments(assignments.subjectTeacherAssignments.filter((a) => a.status === "active"));
    } catch (err: any) {
      setError(err.message || "Failed to load teacher details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, teacherId, selectedSession]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !teacher) return;
    setIsUpdatingStatus(true);
    setSuccessMsg(null);
    setError(null);
    try {
      await deactivateTeacher(organization.id, teacher.id, newStatus, firebaseUser.uid);
      setSuccessMsg(`Teacher status changed to ${newStatus}.`);
      setShowStatusModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !teacher || !docFile || !docName) return;
    setIsUploadingDoc(true);
    setSuccessMsg(null);
    try {
      await uploadTeacherDoc(organization.id, teacher.id, docName, docType, docFile);
      setSuccessMsg("Document uploaded successfully.");
      setShowDocUploadModal(false);
      setDocName("");
      setDocFile(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!organization || !teacher) return;
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteTeacherDoc(organization.id, teacher.id, docId);
      setSuccessMsg("Document removed.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-7 animate-spin text-primary" />
        <p className="mt-2 text-xs">Loading teacher profile...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <p className="mt-2 text-sm font-bold">Teacher Not Found</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/academics/teachers">Back to Teachers</Link>
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Users },
    { id: "classes", label: `Assigned Classes (${classAssignments.length})`, icon: GraduationCap },
    { id: "subjects", label: `Assigned Subjects (${subjectAssignments.length})`, icon: BookOpen },
    { id: "documents", label: `Documents (${teacher.documents?.length || 0})`, icon: FileText },
    { id: "activity", label: "Activity Log", icon: Clock },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
            <Link to="/academics/teachers">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-3.5">
            {teacher.personal.photoUrl ? (
              <img src={teacher.personal.photoUrl} alt={teacher.personal.fullName} className="size-14 rounded-2xl object-cover border border-border shadow-soft" />
            ) : (
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary text-xl font-black border border-primary/20">
                {teacher.personal.firstName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                  {teacher.personal.fullName}
                </h1>
                <span className="rounded-md bg-card border border-border px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                  {teacher.employeeId}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                    teacher.status === "active"
                      ? "bg-success/15 text-success"
                      : teacher.status === "on_leave"
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {teacher.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {teacher.professional.designation} • {teacher.professional.department} Department
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStatus(teacher.status);
              setShowStatusModal(true);
            }}
            className="rounded-xl text-xs font-semibold"
          >
            <PowerOff className="size-3.5 mr-1 text-amber-500" /> Change Status
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/academics/assignments">
              <GraduationCap className="size-3.5 mr-1" /> Manage Assignments
            </Link>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal & Contact Details */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Personal & Contact Information
            </h2>
            <div className="grid gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Full Name</span>
                <span className="font-bold text-foreground">{teacher.personal.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-semibold text-foreground capitalize">{teacher.personal.gender}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="font-semibold text-foreground">{teacher.personal.dob || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Blood Group</span>
                <span className="font-bold text-foreground">{teacher.personal.bloodGroup || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Mobile</span>
                <span className="font-bold text-foreground">{teacher.contact.mobile}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold text-foreground">{teacher.contact.email || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-foreground text-right">{teacher.contact.address || "—"}, {teacher.contact.city || ""}</span>
              </div>
            </div>
          </div>

          {/* Professional & Employment */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Professional & Qualifications
            </h2>
            <div className="grid gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-mono font-bold text-primary">{teacher.employeeId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Joining Date</span>
                <span className="font-semibold text-foreground">{teacher.professional.joiningDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Department</span>
                <span className="font-bold text-foreground">{teacher.professional.department || "General"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Designation</span>
                <span className="font-semibold text-foreground">{teacher.professional.designation || "Faculty"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Qualification</span>
                <span className="font-bold text-foreground">{teacher.professional.qualification || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-semibold text-foreground">{teacher.professional.experience || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Specialization</span>
                <span className="font-semibold text-foreground">{teacher.professional.specialization || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Classes */}
      {activeTab === "classes" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
            Assigned Classes as Class Teacher
          </h2>

          {classAssignments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <GraduationCap className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">Not assigned as Class Teacher for any section currently.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classAssignments.map((ca) => (
                <div key={ca.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{ca.className}</p>
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-extrabold uppercase">
                      Class Teacher
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Section: {ca.sectionName}</p>
                  <p className="text-[10px] text-muted-foreground">Assigned on {ca.assignedDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Subjects */}
      {activeTab === "subjects" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
            Assigned Courses & Subjects
          </h2>

          {subjectAssignments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No subject teaching assignments yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjectAssignments.map((sa) => (
                <div key={sa.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{sa.subjectName}</p>
                    <span className="rounded-md bg-card border border-border px-1.5 py-0.5 text-[10px] font-mono font-bold">
                      {sa.subjectCode}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Class: <span className="font-semibold text-foreground">{sa.className}</span> {sa.sectionName ? `(${sa.sectionName})` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Documents */}
      {activeTab === "documents" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Teacher Records & Verified Certificates
            </h2>
            <Button
              variant="hero"
              size="sm"
              onClick={() => setShowDocUploadModal(true)}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              <Upload className="size-3.5 mr-1" /> Upload Document
            </Button>
          </div>

          {(!teacher.documents || teacher.documents.length === 0) ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teacher.documents.map((docItem) => (
                <div key={docItem.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{docItem.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{docItem.type} • {(docItem.fileSize / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
                      <a href={docItem.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="size-3.5" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDoc(docItem.id)}
                      className="size-8 rounded-xl text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Activity Log */}
      {activeTab === "activity" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            Audit Trail & History
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border">
              <CheckCircle2 className="size-4 text-success" />
              <div>
                <p className="font-bold text-foreground">Teacher Profile Created</p>
                <p className="text-[10px] text-muted-foreground">Registered on {teacher.professional.joiningDate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Update Faculty Status
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Change employment status for {teacher.personal.fullName}. Records will never be permanently deleted.
            </p>

            <form onSubmit={handleStatusUpdate} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TeacherStatus)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                  <option value="resigned">Resigned</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isUpdatingStatus}
                  className="rounded-xl text-xs font-bold"
                >
                  {isUpdatingStatus ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Save Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Upload Teacher Document
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Save certificates or identity files to Cloud Storage.
            </p>

            <form onSubmit={handleDocUpload} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Ed Degree Certificate"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Certificate">Certificate</option>
                  <option value="ID Proof">Government ID Proof</option>
                  <option value="Experience Letter">Experience Letter</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select File *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-xl file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDocUploadModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isUploadingDoc || !docFile || !docName}
                  className="rounded-xl text-xs font-bold"
                >
                  {isUploadingDoc ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Upload to Storage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
