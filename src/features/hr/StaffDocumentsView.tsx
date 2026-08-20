import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listAllStaffDocuments } from "@/services/hrService";
import type { Staff, StaffDocument } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const StaffDocumentsView: React.FC = () => {
  const { organization } = useAuth();
  const [docEntries, setDocEntries] = useState<{ staff: Staff; document: StaffDocument }[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAllStaffDocuments(organization.id, selectedStatus);
      setDocEntries(data);
    } catch (err: any) {
      console.error("Staff documents load error:", err);
      setError(err.message || "Failed to load staff compliance documents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [organization, selectedStatus]);

  const expiringCount = docEntries.filter((d) => d.document.status === "Expiring Soon").length;
  const expiredCount = docEntries.filter((d) => d.document.status === "Expired").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Staff Document & Compliance Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor faculty certificates, ID verifications, contracts, and validity periods.
          </p>
        </div>
      </div>

      {/* Compliance Warnings Banner */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">
                Document Expiry Action Required
              </p>
              <p className="text-[11px] text-muted-foreground">
                {expiredCount} document(s) have expired and {expiringCount} are expiring within 30 days.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStatus("Expiring Soon")}
              className="rounded-xl text-xs h-7 text-amber-700 border-amber-500/30"
            >
              Filter Expiring Soon
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStatus("Expired")}
              className="rounded-xl text-xs h-7 text-destructive border-destructive/30"
            >
              Filter Expired
            </Button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-foreground">Filter by Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Documents</option>
            <option value="Valid">Valid</option>
            <option value="Expiring Soon">Expiring Soon (30 Days)</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadDocuments} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : docEntries.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No documents found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Staff documents uploaded in employee dossiers will be listed here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docEntries.map(({ staff, document }) => (
                <tr key={document.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{staff.fullName}</p>
                    <span className="font-mono text-[10px] text-primary font-bold">
                      {staff.employeeId}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{document.name}</td>
                  <td className="py-3 px-4 uppercase text-[10px] font-bold text-muted-foreground">
                    {document.documentType.replace("_", " ")}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {document.uploadedAt.split("T")[0]}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {document.expiryDate || "No Expiry"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        document.status === "Expired"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : document.status === "Expiring Soon"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}
                    >
                      {document.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-bold text-xs flex items-center gap-1"
                      >
                        <Download className="size-3.5" /> Download
                      </a>
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link to="/hr/staff/$staffId" params={{ staffId: staff.id }}>
                          Profile →
                        </Link>
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
  );
};
