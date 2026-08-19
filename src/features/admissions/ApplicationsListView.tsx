import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Loader2,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listApplications } from "@/services/admissionService";
import type { Application, ApplicationStatus } from "@/types/admission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TABS: { id: ApplicationStatus | ""; label: string }[] = [
  { id: "", label: "All Applications" },
  { id: "Submitted", label: "Submitted" },
  { id: "Under Review", label: "Under Review" },
  { id: "Documents Pending", label: "Docs Pending" },
  { id: "Approved", label: "Approved" },
  { id: "Converted", label: "Admitted" },
  { id: "Rejected", label: "Rejected" },
];

export const ApplicationsListView: React.FC = () => {
  const { organization, selectedSession, allSessions } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const list = await listApplications(organization.id, {
        sessionId: selectedSession?.id,
        status: activeTab,
        searchQuery,
      });
      setApplications(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedSession, activeTab, searchQuery]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "Submitted":
        return <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">Submitted</span>;
      case "Under Review":
        return <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">Under Review</span>;
      case "Documents Pending":
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">Docs Pending</span>;
      case "Approved":
        return <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">Approved ✓</span>;
      case "Converted":
        return <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-600">Admitted 🎉</span>;
      case "Rejected":
        return <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-bold text-destructive">Rejected</span>;
      default:
        return <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Admission Applications</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {applications.length} Records
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Review submitted admission applications, verify attached documents, and approve candidates.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl font-bold">
          <Link to="/admissions/applications/new">
            <Plus className="size-4 mr-1.5" /> + New Application
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search Application No, Student, Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border-border bg-card pl-9 text-xs"
          />
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
            <h3 className="mt-3 text-sm font-bold text-foreground">No applications found</h3>
            <p className="mt-1 text-xs text-muted-foreground">No admission applications match the current tab filter.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs font-bold">
              <Link to="/admissions/applications/new">Submit Application</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Application No</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Applying Class</th>
                  <th className="px-4 py-3">Primary Contact</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {app.applicationNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{app.student.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">Gender: {app.student.gender} • DOB: {app.student.dob}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{app.applyingClass}</td>
                    <td className="px-4 py-3 font-mono text-foreground">{app.contact.mobile}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{app.createdAt.split("T")[0]}</td>
                    <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="hero" size="sm" asChild className="h-7 rounded-lg text-xs font-bold">
                        <Link to="/admissions/applications/$applicationId" params={{ applicationId: app.id }}>
                          <Eye className="size-3 mr-1" /> Review
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
