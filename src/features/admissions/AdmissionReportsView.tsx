import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  PhoneCall,
  FileCheck,
  CheckCircle2,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listEnquiries,
  listFollowUps,
  listApplications,
  listAdmissions,
  listWaitlist,
} from "@/services/admissionService";
import type {
  Enquiry,
  FollowUp,
  Application,
  AdmissionRecord,
  AdmissionWaitlistRecord,
} from "@/types/admission";
import { Button } from "@/components/ui/button";

export const AdmissionReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [waitlist, setWaitlist] = useState<AdmissionWaitlistRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [eList, fList, appList, admList, wList] = await Promise.all([
        listEnquiries(organization.id),
        listFollowUps(organization.id),
        listApplications(organization.id),
        listAdmissions(organization.id),
        listWaitlist(organization.id),
      ]);
      setEnquiries(eList);
      setFollowUps(fList);
      setApplications(appList);
      setAdmissions(admList);
      setWaitlist(wList);
    } catch (err: any) {
      console.error("loadReportsData error:", err);
      setError(err.message || "Failed to load admission reports data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportEnquiries = () => {
    const headers = ["Enquiry ID", "Student Name", "Applying Class", "Parent/Guardian", "Mobile", "Email", "Source", "Status", "Date"];
    const rows = enquiries.map((e) => [
      e.enquiryNumber,
      e.student.fullName,
      e.student.interestedClass,
      e.parent.fatherName || e.parent.guardianName || "Guardian",
      e.parent.mobile,
      e.parent.email || "—",
      e.source,
      e.status,
      e.createdAt.split("T")[0],
    ]);
    downloadCSV("admission_enquiries_report", headers, rows);
  };

  const exportApplications = () => {
    const headers = ["Application No", "Student Name", "Class", "Gender", "DOB", "Mobile", "Status", "Applied Date"];
    const rows = applications.map((a) => [
      a.applicationNumber,
      a.student.fullName,
      a.applyingClass,
      a.student.gender,
      a.student.dob,
      a.contact.mobile,
      a.status,
      a.createdAt.split("T")[0],
    ]);
    downloadCSV("admission_applications_report", headers, rows);
  };

  const exportAdmissions = () => {
    const headers = ["Admission No", "Student Name", "Class", "Section", "Admission Date", "Status"];
    const rows = admissions.map((a) => [
      a.admissionNumber,
      a.studentName,
      a.className,
      a.sectionName || "Section A",
      a.admissionDate,
      a.status,
    ]);
    downloadCSV("admitted_students_register", headers, rows);
  };

  const exportWaitlist = () => {
    const headers = ["Rank", "Student Name", "Application No", "Class", "Mobile", "Priority", "Status"];
    const rows = waitlist.map((w) => [
      w.waitlistPosition,
      w.studentName,
      w.applicationNumber,
      w.applyingClass,
      w.mobile,
      w.priority,
      w.status,
    ]);
    downloadCSV("admission_waitlist_manifest", headers, rows);
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
        <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
          <RefreshCw className="size-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Admissions & CRM Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Export verified data sheets for admissions committee reviews, board compliance, and enrolment records.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 1. Enquiries */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <PhoneCall className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Enquiries & Leads Report</h2>
              <p className="text-xs text-muted-foreground">Total records: {enquiries.length}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete log of prospect enquiries, lead sources, parent contact details, and conversion status.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportEnquiries}
            disabled={enquiries.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Enquiries (.CSV)
          </Button>
        </div>

        {/* 2. Applications */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <FileCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Applications Dossier</h2>
              <p className="text-xs text-muted-foreground">Total records: {applications.length}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Application submission status, demographic data, verified documents count, and review remarks.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportApplications}
            disabled={applications.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Applications (.CSV)
          </Button>
        </div>

        {/* 3. Admitted Students */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Admitted Students Register</h2>
              <p className="text-xs text-muted-foreground">Total enrolled: {admissions.length}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Official admission numbers, allocated classes, sections, and date of admission.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAdmissions}
            disabled={admissions.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Admission Register (.CSV)
          </Button>
        </div>

        {/* 4. Waitlist Manifest */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Waitlist & Standby Manifest</h2>
              <p className="text-xs text-muted-foreground">Total waitlisted: {waitlist.length}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Prioritized standby rank order, contact information, and seat offer status.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportWaitlist}
            disabled={waitlist.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Waitlist (.CSV)
          </Button>
        </div>
      </div>
    </div>
  );
};
