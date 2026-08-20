import React, { useState, useEffect } from "react";
import { FileText, Download, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listVisits } from "@/services/frontOfficeService";
import type { FrontOfficeVisit } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const FrontOfficeReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [visits, setVisits] = useState<FrontOfficeVisit[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listVisits(organization.id, {
        status: statusFilter || undefined,
      });
      setVisits(list);
    } catch (err: any) {
      console.error("loadFrontOfficeReports error:", err);
      setError(err.message || "Failed to load front office reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [organization, statusFilter]);

  const handleExportCSV = () => {
    if (visits.length === 0) return;
    const headers = "VisitorName,Mobile,Type,PersonToMeet,Purpose,EntryTime,ExitTime,GatePassNumber,Status\n";
    const rows = visits
      .map(
        (v) =>
          `"${v.visitorName}","${v.visitorMobile}","${v.visitorType}","${v.personToMeetName}","${v.purpose}","${v.entryTime}","${v.exitTime || ""}","${v.gatePassNumber || ""}","${v.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Front_Office_Visitors_${new Date().toISOString().split("T")[0]}.csv`);
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
            Front Office Reports & Audit Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Security audit logs, visitor footfall reports, and exportable campus entry logs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={visits.length === 0}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1.5" /> Export Visitor CSV
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Inside", "Exited"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? `${st} (${visits.filter((v) => (st ? v.status === st : true)).length})` : `All Records (${visits.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
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
          <Button onClick={loadReport} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : visits.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No reports found</h3>
          <p className="mt-1 text-xs text-muted-foreground">No visitor records matching selected filter criteria.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Pass No</th>
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Person To Meet</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Entry</th>
                  <th className="py-3 px-4">Exit</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {v.gatePassNumber || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{v.visitorName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{v.visitorMobile}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{v.visitorType}</td>
                    <td className="py-3 px-4 text-foreground font-semibold">{v.personToMeetName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{v.purpose}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {v.exitTime
                        ? new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          v.status === "Inside"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {v.status}
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
