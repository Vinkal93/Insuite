import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Search,
  CreditCard,
  Phone,
  ArrowRight,
  RefreshCw,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeeInvoice, SchoolClass } from "@/types";
import { listDefaulters } from "@/services/feeService";
import { getSchoolClasses } from "@/services/academicService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const DefaultersListView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [defaulters, setDefaulters] = useState<FeeInvoice[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [list, cls] = await Promise.all([
        listDefaulters(organization.id, {
          sessionId: selectedSession?.id,
          classId: selectedClassId || undefined,
        }),
        getSchoolClasses(organization.id, selectedSession?.id),
      ]);
      setDefaulters(list);
      setClasses(cls);
    } catch (err: any) {
      console.error("listDefaulters error:", err);
      setErrorMsg("Unable to load fee defaulters list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession, selectedClassId]);

  const filteredDefaulters = defaulters.filter((d) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      d.studentName.toLowerCase().includes(term) ||
      (d.admissionNumber && d.admissionNumber.toLowerCase().includes(term)) ||
      (d.parentMobile && d.parentMobile.includes(term))
    );
  });

  const totalOverdue = filteredDefaulters.reduce((sum, d) => sum + (d.balanceAmount || 0), 0);

  const getDaysOverdue = (dueDateStr: string) => {
    const due = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Fee Defaulters Directory
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Identify and follow up on students with past-due pending fee installments.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or parent contact..."
            className="pl-8 text-xs rounded-xl"
          />
        </div>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/70" />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive">
          <AlertCircle className="size-6 mb-1.5" />
          <p className="text-xs font-bold">{errorMsg}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 rounded-xl text-xs font-semibold">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredDefaulters.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
          <p className="text-xs font-semibold text-foreground">Zero outstanding defaulter cases!</p>
          <p className="text-xs text-muted-foreground">All active invoices are either settled or within their scheduled grace period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground">{filteredDefaulters.length} Defaulter Invoices</span>
            <span className="font-bold text-foreground">
              Total Overdue Exposure: <strong className="font-mono text-rose-500">₹{totalOverdue.toLocaleString()}</strong>
            </span>
          </div>

          <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Class</th>
                    <th className="px-4 py-3.5">Parent Contact</th>
                    <th className="px-4 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Due Date</th>
                    <th className="px-4 py-3.5">Days Past Due</th>
                    <th className="px-4 py-3.5">Overdue Balance</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDefaulters.map((d) => {
                    const daysPast = getDaysOverdue(d.dueDate);
                    return (
                      <tr key={d.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-foreground">
                          <Link to="/fees/students/$studentId" params={{ studentId: d.studentId }} className="hover:text-primary transition-colors">
                            {d.studentName}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">{d.className}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            <span>{d.parentMobile || d.parentName || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">{d.invoiceNumber}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{d.dueDate}</td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                            {daysPast} Days Overdue
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-black text-rose-500">
                          ₹{d.balanceAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Button variant="hero" size="sm" asChild className="rounded-lg h-7 px-2.5 text-xs font-bold shadow-soft">
                            <Link to="/fees/collect" search={{ studentId: d.studentId, invoiceId: d.id }}>
                              <CreditCard className="size-3.5 mr-1" /> Collect
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
