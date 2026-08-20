import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { HelpCircle, Plus, Search, Eye, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listEnquiries } from "@/services/admissionService";
import type { Enquiry } from "@/types/admission";
import { Button } from "@/components/ui/button";

export const FrontOfficeEnquiriesView: React.FC = () => {
  const { organization } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEnquiries = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listEnquiries(organization.id, {
        status: statusFilter || undefined,
        searchQuery: search || undefined,
      });
      setEnquiries(list);
    } catch (err: any) {
      console.error("loadFrontOfficeEnquiries error:", err);
      setError(err.message || "Failed to load enquiries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [organization, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Front Desk Admission Enquiries
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Integrated live with Admissions CRM — no duplicate entry, shared counsellor assignment.
          </p>
        </div>

        <Link
          to="/admissions/enquiries/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> New Admission Enquiry
        </Link>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, enquiry number, or mobile..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Enquiry Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="FOLLOW_UP_SCHEDULED">Follow-up Scheduled</option>
          <option value="CAMPUS_VISIT_SCHEDULED">Campus Visit Scheduled</option>
          <option value="APPLICATION_SUBMITTED">Application Submitted</option>
          <option value="ADMITTED">Admitted</option>
        </select>
      </div>

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
          <Button onClick={loadEnquiries} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <HelpCircle className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No admission enquiries found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Register prospective students from reception.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Enquiry No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Parent / Contact</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {e.enquiryNumber}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{e.student.fullName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Class: {e.student.interestedClass || "N/A"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground block">{e.parent.fullName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {e.parent.mobile}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">{e.source || "Walk-in"}</td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-foreground border border-border">
                        {e.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/admissions/enquiries/${e.id}`}
                        className="font-bold text-primary hover:underline text-[11px] flex items-center justify-end gap-1"
                      >
                        <Eye className="size-3" /> View in CRM
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
