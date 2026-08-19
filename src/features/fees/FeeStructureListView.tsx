import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeeStructure, SchoolClass } from "@/types";
import { listFeeStructures, deactivateFeeStructure } from "@/services/feeService";
import { getSchoolClasses } from "@/services/academicService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const FeeStructureListView: React.FC = () => {
  const { organization, selectedSession, firebaseUser } = useAuth();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
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
        listFeeStructures(organization.id, {
          sessionId: selectedSession?.id,
          classId: selectedClassId || undefined,
        }),
        getSchoolClasses(organization.id, selectedSession?.id),
      ]);
      setStructures(list);
      setClasses(cls);
    } catch (err: any) {
      console.error("listFeeStructures error:", err);
      setErrorMsg("Unable to load fee structures.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession, selectedClassId]);

  const handleDeactivate = async (structureId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to deactivate this fee structure? Existing historical invoices will be preserved.")) return;
    try {
      await deactivateFeeStructure(organization.id, structureId, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "Admin",
      });
      loadData();
    } catch (err: any) {
      alert("Failed to deactivate: " + err.message);
    }
  };

  const filteredStructures = structures.filter((s) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(term) || (s.className && s.className.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Fee Structures
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Define grade-wise recurring and one-time fee breakdowns, tuition components, and schedules.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/fees/structure/new">
            <Plus className="size-3.5 mr-1.5" /> Create Fee Structure
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by structure name..."
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
          {[...Array(3)].map((_, i) => (
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
      ) : filteredStructures.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Layers className="mx-auto size-8 text-muted-foreground opacity-50" />
          <p className="text-xs font-semibold text-muted-foreground">No fee structures configured for this class.</p>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/fees/structure/new">
              <Plus className="size-3.5 mr-1.5" /> Create Fee Structure
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Structure Name</th>
                  <th className="px-4 py-3.5">Class</th>
                  <th className="px-4 py-3.5">Billing Frequency</th>
                  <th className="px-4 py-3.5">Total Components</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStructures.map((st) => (
                  <tr key={st.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-foreground">
                      <Link to="/fees/structure/$structureId" params={{ structureId: st.id }} className="hover:text-primary transition-colors">
                        {st.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{st.className || "Class"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{st.frequency}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{st.components.length} Components</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-foreground">₹{st.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold ${
                          st.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <Button variant="ghost" size="sm" asChild className="rounded-lg h-7 px-2 text-xs">
                        <Link to="/fees/structure/$structureId" params={{ structureId: st.id }}>
                          <Eye className="size-3.5 mr-1 text-primary" /> View & Bill
                        </Link>
                      </Button>
                      {st.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(st.id)}
                          className="rounded-lg h-7 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          Deactivate
                        </Button>
                      )}
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
