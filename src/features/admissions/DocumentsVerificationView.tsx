import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Clock,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listApplications } from "@/services/admissionService";
import type { Application } from "@/types/admission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const DocumentsVerificationView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const list = await listApplications(organization.id, { sessionId: selectedSession?.id });
      setApplications(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedSession]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Document Verification Workspace</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {applications.length} Applications Under Review
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Verify Birth Certificates, Transfer Certificates, and Previous Marksheets submitted by candidates.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-bold text-foreground">No verification tasks pending</h3>
            <p className="mt-1 text-xs text-muted-foreground">All application documentation is up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Application No</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Applying Class</th>
                  <th className="px-4 py-3">TC No / Previous School</th>
                  <th className="px-4 py-3">Application Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{app.applicationNumber}</td>
                    <td className="px-4 py-3 font-bold text-foreground">{app.student.fullName}</td>
                    <td className="px-4 py-3 font-medium">{app.applyingClass}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.academicHistory.transferCertificateNo ? `TC: ${app.academicHistory.transferCertificateNo}` : app.academicHistory.previousSchool || "Not Provided"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-foreground">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="hero" size="sm" asChild className="h-7 rounded-lg text-xs font-bold">
                        <Link to="/admissions/applications/$applicationId" params={{ applicationId: app.id }}>
                          <Eye className="size-3 mr-1" /> Review Docs
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
