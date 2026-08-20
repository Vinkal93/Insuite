import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  BookOpen,
  BookMarked,
  Clock,
  Receipt,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listBooks,
  listTransactions,
  listFines,
  searchLibraryMembers,
} from "@/services/libraryService";
import { Button } from "@/components/ui/button";

export const LibraryReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [reportType, setReportType] = useState<
    "inventory" | "loans" | "overdue" | "fines" | "members"
  >("inventory");
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
      if (reportType === "inventory") {
        const books = await listBooks(organization.id);
        const rows = [
          ["Title", "Subtitle", "ISBN", "Author", "Category", "Publisher", "Total Copies", "Available Copies", "Issued Copies", "Shelf", "Rack", "Status"],
          ...books.map((b) => [
            b.title,
            b.subtitle || "",
            b.isbn || "",
            b.authorName,
            b.categoryName,
            b.publisherName || "",
            b.totalCopies,
            b.availableCopies,
            b.issuedCopies,
            b.shelf || "",
            b.rack || "",
            b.status,
          ]),
        ];
        exportCSV("Library_Inventory_Report", rows);
      } else if (reportType === "loans") {
        const loans = await listTransactions(organization.id);
        const rows = [
          ["Book Title", "Accession No.", "Borrower Name", "Borrower Type", "Borrower ID", "Issued Date", "Due Date", "Returned Date", "Status", "Renewals"],
          ...loans.map((l) => [
            l.bookTitle,
            l.accessionNumber,
            l.memberName,
            l.memberType,
            l.memberIdentifier,
            l.issuedAt.split("T")[0],
            l.dueAt,
            l.returnedAt ? l.returnedAt.split("T")[0] : "—",
            l.status,
            l.renewalCount,
          ]),
        ];
        exportCSV("Library_Loans_Circulation_Report", rows);
      } else if (reportType === "overdue") {
        const loans = await listTransactions(organization.id, { status: "Issued" });
        const todayStr = new Date().toISOString().split("T")[0];
        const overdue = loans.filter((l) => l.dueAt < todayStr);
        const rows = [
          ["Book Title", "Accession No.", "Borrower Name", "Borrower Type", "Borrower ID", "Issued Date", "Due Date", "Days Overdue"],
          ...overdue.map((l) => {
            const dueTime = new Date(l.dueAt).getTime();
            const todayTime = new Date(todayStr).getTime();
            const days = Math.ceil((todayTime - dueTime) / (1000 * 60 * 60 * 24));
            return [
              l.bookTitle,
              l.accessionNumber,
              l.memberName,
              l.memberType,
              l.memberIdentifier,
              l.issuedAt.split("T")[0],
              l.dueAt,
              days,
            ];
          }),
        ];
        exportCSV("Library_Overdue_Audit_Report", rows);
      } else if (reportType === "fines") {
        const fines = await listFines(organization.id);
        const rows = [
          ["Borrower Name", "Borrower Type", "Book Title", "Accession No.", "Days Overdue", "Fine Amount", "Status", "Payment Method", "Transaction Ref", "Waiver Reason"],
          ...fines.map((f) => [
            f.memberName,
            f.memberType,
            f.bookTitle,
            f.accessionNumber,
            f.daysOverdue,
            f.amount,
            f.status,
            f.paymentMethod || "—",
            f.transactionReference || "—",
            f.waiverReason || "—",
          ]),
        ];
        exportCSV("Library_Fines_Audit_Report", rows);
      } else if (reportType === "members") {
        const members = await searchLibraryMembers(organization.id);
        const rows = [
          ["Name", "Member Type", "ID Number", "Class / Department", "Active Loans", "Outstanding Fines", "Status"],
          ...members.map((m) => [
            m.name,
            m.memberType,
            m.identifier,
            m.departmentOrClass,
            m.booksIssuedCount,
            m.activeFinesAmount,
            m.status,
          ]),
        ];
        exportCSV("Library_Members_Activity_Report", rows);
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
          Library Analytical & Audit Reports
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate official verified CSV audits for physical catalog, circulation history, overdue fines, and borrower profiles.
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { id: "inventory", label: "Book Inventory Census", desc: "Complete physical & digital catalog", icon: BookOpen },
          { id: "loans", label: "Circulation Register", desc: "Full issue, renewal, and return logs", icon: BookMarked },
          { id: "overdue", label: "Overdue Books Audit", desc: "Borrowers with delinquent loans", icon: Clock },
          { id: "fines", label: "Fines & Revenue Log", desc: "Collected fees, receipts, and waivers", icon: Receipt },
          { id: "members", label: "Borrower Activity Roll", desc: "Student & faculty lending statistics", icon: Users },
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

      {/* Export Action Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Export Library Data</h3>
          <p className="text-xs text-muted-foreground">
            Download actual data for spreadsheets, institutional audits, and stock verification.
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
