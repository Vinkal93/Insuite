import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Users,
  Building2,
  CalendarCheck,
  CalendarDays,
  FileText,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listStaff,
  listDepartments,
  listAllStaffDocuments,
  listPayrollRecords,
} from "@/services/hrService";
import { getStaffAttendanceRecords, getLeaveRequests } from "@/services/attendanceService";
import { Button } from "@/components/ui/button";

export const HrReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [reportType, setReportType] = useState<
    "directory" | "departments" | "attendance" | "leaves" | "documents" | "payroll"
  >("directory");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    if (!organization) return;
    setIsExporting(true);
    try {
      if (reportType === "directory") {
        const staff = await listStaff(organization.id);
        const rows = [
          ["Employee ID", "Full Name", "Department", "Designation", "Employment Type", "Joining Date", "Mobile", "Email", "Status"],
          ...staff.map((s) => [
            s.employeeId,
            s.fullName,
            s.professional.departmentName,
            s.professional.designationName,
            s.professional.employmentType,
            s.professional.joiningDate,
            s.contact.mobile,
            s.contact.email || "",
            s.status,
          ]),
        ];
        exportCSV("Staff_Directory_Report", rows);
      } else if (reportType === "departments") {
        const depts = await listDepartments(organization.id);
        const rows = [
          ["Department Name", "Code", "Head of Department", "Status"],
          ...depts.map((d) => [d.name, d.code, d.headStaffName || "—", d.status]),
        ];
        exportCSV("Departments_Summary_Report", rows);
      } else if (reportType === "attendance") {
        const records = await getStaffAttendanceRecords(organization.id, selectedDate);
        const rows = [
          ["Date", "Employee ID", "Staff Name", "Department", "Designation", "Status", "Marked At", "Remarks"],
          ...records.map((r) => [
            r.date,
            r.employeeId || "",
            r.personName,
            r.department || "",
            r.designation || "",
            r.status.toUpperCase(),
            r.markedAt || "",
            r.remarks || "",
          ]),
        ];
        exportCSV(`Staff_Attendance_${selectedDate}`, rows);
      } else if (reportType === "leaves") {
        const leaves = await getLeaveRequests(organization.id);
        const staffLeaves = leaves.filter((l) => l.applicantType !== "student");
        const rows = [
          ["Applicant Name", "Department", "Leave Type", "Start Date", "End Date", "Days", "Reason", "Status", "Approved By"],
          ...staffLeaves.map((l) => [
            l.applicantName,
            l.department || "",
            l.leaveType.toUpperCase(),
            l.startDate,
            l.endDate,
            l.days,
            l.reason,
            l.status.toUpperCase(),
            l.approvedByName || "",
          ]),
        ];
        exportCSV("Staff_Leaves_Report", rows);
      } else if (reportType === "documents") {
        const docs = await listAllStaffDocuments(organization.id);
        const rows = [
          ["Employee ID", "Staff Name", "Document Title", "Type", "Expiry Date", "Status", "Uploaded Date"],
          ...docs.map(({ staff, document }) => [
            staff.employeeId,
            staff.fullName,
            document.name,
            document.documentType,
            document.expiryDate || "No Expiry",
            document.status,
            document.uploadedAt.split("T")[0],
          ]),
        ];
        exportCSV("Staff_Document_Compliance_Report", rows);
      } else if (reportType === "payroll") {
        const records = await listPayrollRecords(organization.id);
        const rows = [
          ["Period", "Employee ID", "Staff Name", "Department", "Basic Salary", "Allowances", "Deductions", "Net Salary", "Status"],
          ...records.map((p) => [
            p.period,
            p.employeeId,
            p.staffName,
            p.departmentName,
            p.basic,
            p.totalAllowances,
            p.totalDeductions,
            p.net,
            p.status,
          ]),
        ];
        exportCSV("Payroll_Disbursement_Report", rows);
      }
    } catch (err: any) {
      alert("Failed to export report: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Staff & HR Analytical Reports
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate verified audits for employee rolls, attendance, leaves, compliance, and payroll.
        </p>
      </div>

      {/* Report Selection Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { id: "directory", label: "Staff Directory Report", desc: "Complete active/inactive employee census", icon: Users },
          { id: "departments", label: "Departmental Breakdown", desc: "Operational and faculty division summary", icon: Building2 },
          { id: "attendance", label: "Daily Attendance Roll", desc: "Selected date attendance log and time-stamps", icon: CalendarCheck },
          { id: "leaves", label: "Leave & Absence Audit", desc: "Authorized time-off and approval history", icon: CalendarDays },
          { id: "documents", label: "Compliance & Expiry", desc: "Certificates, verification proofs, and validity", icon: FileText },
          { id: "payroll", label: "Payroll Disbursement", desc: "Gross payouts, deductions, and payment status", icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = reportType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setReportType(item.id as any)}
              className={`rounded-3xl border p-5 text-left transition-all space-y-2 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-surface"
              }`}
            >
              <div className={`size-10 rounded-2xl flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                <Icon className="size-5" />
              </div>
              <div>
                <h2 className="text-xs font-extrabold text-foreground">{item.label}</h2>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Date Filter for Attendance */}
      {reportType === "attendance" && (
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-xs">
          <label className="block text-xs font-semibold text-foreground mb-1">
            Select Attendance Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {/* Export Action Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Export Data to CSV</h3>
          <p className="text-xs text-muted-foreground">
            Download actual records for spreadsheets, auditing, and official school records.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Download className="size-3.5 mr-1.5" />
          {isExporting ? "Generating Export..." : "Download CSV Report"}
        </Button>
      </div>
    </div>
  );
};
