import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Users,
  ArrowLeft,
  Edit2,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  FileText,
  CreditCard,
  History,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getStaff,
  changeStaffStatus,
  uploadStaffDocument,
  deleteStaffDocument,
  getStaffSalaryProfile,
} from "@/services/hrService";
import type { Staff, StaffSalaryProfile, StaffDocumentType, StaffStatus } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const StaffDetailView: React.FC = () => {
  const { staffId } = useParams({ from: "/hr/staff/$staffId" });
  const { organization, firebaseUser, userProfile } = useAuth();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [salaryProfile, setSalaryProfile] = useState<StaffSalaryProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "employment" | "documents" | "payroll" | "activity"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Change Dialog State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<StaffStatus>("Active");
  const [statusReason, setStatusReason] = useState("");
  const [statusDate, setStatusDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Document Upload Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState<StaffDocumentType>("ID_PROOF");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docExpiryDate, setDocExpiryDate] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const loadStaffData = async () => {
    if (!organization || !staffId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [stData, salData] = await Promise.all([
        getStaff(organization.id, staffId),
        getStaffSalaryProfile(organization.id, staffId).catch(() => null),
      ]);
      setStaff(stData);
      setSalaryProfile(salData);
      if (stData) setNewStatus(stData.status);
    } catch (err: any) {
      console.error("Staff detail load error:", err);
      setError(err.message || "Failed to load staff profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [organization, staffId]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !staffId) return;
    if (!statusReason.trim()) {
      alert("Please provide a reason for the status change.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await changeStaffStatus(
        organization.id,
        staffId,
        {
          status: newStatus,
          effectiveDate: statusDate,
          reason: statusReason.trim(),
          notes: statusNotes.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowStatusModal(false);
      await loadStaffData();
    } catch (err: any) {
      alert("Failed to change status: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !staffId || !docFile) return;

    setIsUploadingDoc(true);
    try {
      await uploadStaffDocument(
        organization.id,
        staffId,
        docFile,
        docType,
        docExpiryDate || null,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowDocModal(false);
      setDocFile(null);
      setDocExpiryDate("");
      await loadStaffData();
    } catch (err: any) {
      alert("Failed to upload document: " + err.message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!organization || !firebaseUser || !staffId) return;
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteStaffDocument(organization.id, staffId, docId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadStaffData();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !staff) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Staff Member Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The staff ID does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/hr/staff">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Directory
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Inactive":
        return "bg-muted text-muted-foreground border-border";
      case "On Leave":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-destructive/10 text-destructive border-destructive/20";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {staff.personal.photoUrl ? (
                <img src={staff.personal.photoUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="font-bold text-xl text-muted-foreground">
                  {staff.personal.firstName[0]}
                  {staff.personal.lastName[0]}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{staff.fullName}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                    staff.status
                  )}`}
                >
                  {staff.status}
                </span>
                {staff.professional.isTeachingStaff && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">
                    <GraduationCap className="size-3" /> Faculty
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {staff.professional.designationName} • {staff.professional.departmentName}
              </p>
              <p className="font-mono text-xs text-primary font-bold mt-1">
                ID: {staff.employeeId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/hr/staff/$staffId/edit" params={{ staffId: staff.id }}>
                <Edit2 className="size-3.5 mr-1" /> Edit Profile
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusModal(true)}
              className="rounded-xl text-xs h-8 text-muted-foreground"
            >
              <UserX className="size-3.5 mr-1" /> Change Status
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("employment")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "employment"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Employment
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "documents"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Documents ({staff.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "payroll"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Salary & Payroll
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Personal Information
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted-foreground text-[10px]">Date of Birth</dt>
                <dd className="font-semibold text-foreground">{staff.personal.dob || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px]">Gender</dt>
                <dd className="font-semibold text-foreground">{staff.personal.gender}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px]">Blood Group</dt>
                <dd className="font-semibold text-foreground">{staff.personal.bloodGroup || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px]">Joining Date</dt>
                <dd className="font-semibold text-foreground">{staff.professional.joiningDate}</dd>
              </div>
            </dl>
          </div>

          {/* Contact Details */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Contact & Address
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{staff.contact.mobile}</span>
                {staff.contact.alternateMobile && (
                  <span className="text-muted-foreground">({staff.contact.alternateMobile})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {staff.contact.email || "No email on record"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="size-3.5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  {[staff.contact.address, staff.contact.city, staff.contact.state, staff.contact.pinCode]
                    .filter(Boolean)
                    .join(", ") || "No address on record"}
                </span>
              </div>
            </dl>
          </div>

          {/* Emergency Contact */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 md:col-span-2">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Emergency Contact Information
            </h2>
            {staff.emergencyContact?.contactName ? (
              <dl className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground text-[10px]">Contact Person</dt>
                  <dd className="font-semibold text-foreground">
                    {staff.emergencyContact.contactName}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px]">Relationship</dt>
                  <dd className="font-semibold text-foreground">
                    {staff.emergencyContact.relation || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-[10px]">Phone Number</dt>
                  <dd className="font-semibold text-foreground">
                    {staff.emergencyContact.mobile || "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No emergency contact registered for this employee.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Employment */}
      {activeTab === "employment" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Employment Details & Academic Credentials
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Employee Number</span>
              <span className="font-mono font-bold text-primary text-sm">
                {staff.employeeId}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Department</span>
              <span className="font-semibold text-foreground">
                {staff.professional.departmentName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Designation</span>
              <span className="font-semibold text-foreground">
                {staff.professional.designationName}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Employment Type</span>
              <span className="font-semibold text-foreground">
                {staff.professional.employmentType}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Joining Date</span>
              <span className="font-semibold text-foreground">
                {staff.professional.joiningDate}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Faculty Designation</span>
              <span className="font-semibold text-foreground">
                {staff.professional.isTeachingStaff ? "Teaching Faculty" : "Administrative Staff"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Qualification</span>
              <span className="font-semibold text-foreground">
                {staff.professional.qualification || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Experience</span>
              <span className="font-semibold text-foreground">
                {staff.professional.experience || "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Specialization</span>
              <span className="font-semibold text-foreground">
                {staff.professional.specialization || "—"}
              </span>
            </div>
          </div>

          {staff.statusReason && (
            <div className="rounded-2xl border border-border bg-surface p-4 text-xs space-y-1">
              <span className="font-bold text-foreground">Status History Note</span>
              <p className="text-muted-foreground">
                Reason: {staff.statusReason} (Effective: {staff.statusEffectiveDate})
              </p>
              {staff.statusNotes && <p className="text-muted-foreground/80">{staff.statusNotes}</p>}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Documents */}
      {activeTab === "documents" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Uploaded Documents</h2>
              <p className="text-xs text-muted-foreground">
                Employee verification files, certificates, and contracts
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(true)}
              className="rounded-xl text-xs h-8 font-semibold"
            >
              <Upload className="size-3.5 mr-1" /> Upload Document
            </Button>
          </div>

          {!staff.documents || staff.documents.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No documents uploaded yet for this staff member.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {staff.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-border bg-surface/50 p-4 space-y-2 hover:bg-surface transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {doc.documentType.replace("_", " ")}
                      </span>
                      <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                        {doc.name}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        doc.status === "Expired"
                          ? "bg-destructive/10 text-destructive"
                          : doc.status === "Expiring Soon"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span>Uploaded: {doc.uploadedAt.split("T")[0]}</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-bold flex items-center gap-0.5"
                      >
                        <Download className="size-3" /> View
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-destructive hover:underline font-semibold"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Salary & Payroll Profile */}
      {activeTab === "payroll" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">
                Staff Salary Profile & Compensation
              </h2>
              <p className="text-xs text-muted-foreground">
                Base salary, monthly allowances, deductions, and gross take-home
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/hr/payroll/$staffId" params={{ staffId: staff.id }}>
                <CreditCard className="size-3.5 mr-1" /> Manage Compensation
              </Link>
            </Button>
          </div>

          {!salaryProfile ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No salary structure configured for this staff member yet. Click "Manage Compensation" to set
              base pay.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-surface/50 p-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Basic Salary
                  </span>
                  <p className="text-xl font-black text-foreground mt-1">
                    ₹{salaryProfile.basicSalary.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/50 p-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Gross Salary
                  </span>
                  <p className="text-xl font-black text-emerald-600 mt-1">
                    ₹{salaryProfile.grossSalary.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/50 p-4">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Net Monthly Salary
                  </span>
                  <p className="text-xl font-black text-primary mt-1">
                    ₹{salaryProfile.netSalary.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Change Employment Status</h3>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Reason *</label>
                <input
                  type="text"
                  required
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. End of contract / Resignation accepted"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional internal remarks"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isUpdatingStatus}
                  className="rounded-xl text-xs font-bold"
                >
                  {isUpdatingStatus ? "Saving..." : "Update Status"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Upload Staff Document</h3>
            <form onSubmit={handleDocumentUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="ID_PROOF">ID Proof</option>
                  <option value="QUALIFICATION_CERTIFICATE">Qualification Certificate</option>
                  <option value="EXPERIENCE_CERTIFICATE">Experience Certificate</option>
                  <option value="PHOTO">Profile Photo</option>
                  <option value="OTHER">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select File * (PDF, JPG, PNG)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/*"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={docExpiryDate}
                  onChange={(e) => setDocExpiryDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isUploadingDoc}
                  className="rounded-xl text-xs font-bold"
                >
                  {isUploadingDoc ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
