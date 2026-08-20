import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Receipt,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CreditCard,
  ExternalLink,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listStudentAssignments } from "@/services/transportService";
import type { StudentTransportAssignment } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const TransportFeesView: React.FC = () => {
  const { organization } = useAuth();
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const aList = await listStudentAssignments(organization.id, { status: "Active" });
      setAssignments(aList);
    } catch (err: any) {
      console.error("loadTransportFees error:", err);
      setError(err.message || "Failed to load transport fee allocations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      return (
        a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.routeName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [assignments, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Transport Fees & Billing Integration
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transport fee components integrated with the central institutional Fee Engine.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/fees/invoices">
            <Receipt className="size-3.5 mr-1.5" /> View Fee Invoices
          </Link>
        </Button>
      </div>

      {/* Integration Info Banner */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-soft flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-foreground">
              Direct Fee Engine Synchronization
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Transport fees are applied as line items in student invoices based on assigned routes.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
          <Link to="/fees/structures">Manage Fee Heads</Link>
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Receipt className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No active transport fee riders</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign students to routes to begin transport fee billing.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Assigned Route</th>
                <th className="py-3 px-4">Designated Stop</th>
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4">Billing Status</th>
                <th className="py-3 px-4 text-right">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{a.studentName}</p>
                    <p className="font-mono text-[10px] text-primary">{a.admissionNumber}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {a.className} - {a.sectionName}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{a.routeName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.stopName}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{a.effectiveFrom}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Active Invoicing
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-primary">
                      <Link to="/fees/invoices">
                        <ExternalLink className="size-3.5 mr-1" /> Fee Ledger
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
  );
};
