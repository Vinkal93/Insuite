import React, { useState, useEffect } from "react";
import { FileText, Download, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listHostelAllocations } from "@/services/hostelService";
import type { HostelAllocation } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listHostelAllocations(organization.id, {
        status: statusFilter || undefined,
      });
      setAllocations(list);
    } catch (err: any) {
      console.error("loadHostelReports error:", err);
      setError(err.message || "Failed to load hostel reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, statusFilter]);

  const handleExportCSV = () => {
    if (allocations.length === 0) return;
    const headers = "StudentName,AdmissionNumber,Hostel,RoomNumber,BedNumber,AllocationDate,CheckoutDate,Status\n";
    const rows = allocations
      .map(
        (a) =>
          `"${a.studentName}","${a.admissionNumber || ""}","${a.hostelName}","${a.roomNumber}","${a.bedNumber}","${a.allocationDate}","${a.actualCheckoutDate || ""}","${a.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Hostel_Allocations_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Occupancy & Allocation Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Boarding room allotments, student resident directory, and exportable CSV ledgers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={allocations.length === 0}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1.5" /> Export CSV Ledger
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Active", "Completed"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? `${st} (${allocations.filter((a) => (st ? a.status === st : true)).length})` : `All Records (${allocations.length})`}
          </button>
        ))}
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
      ) : allocations.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No records found</h3>
          <p className="mt-1 text-xs text-muted-foreground">No allocation records matching selected filter criteria.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Room & Bed</th>
                  <th className="py-3 px-4">Allocated Date</th>
                  <th className="py-3 px-4">Checkout Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{a.studentName}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{a.admissionNumber || "—"}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{a.hostelName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      Rm {a.roomNumber} • {a.bedNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{a.allocationDate}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{a.actualCheckoutDate || "—"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          a.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {a.status}
                      </span>
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
