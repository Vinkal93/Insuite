import React, { useState, useEffect } from "react";
import { FileText, Download, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listPtmAppointments, listPtmEvents } from "@/services/ptmService";
import type { PtmAppointment, PtmEvent } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const PtmReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [appointments, setAppointments] = useState<PtmAppointment[]>([]);
  const [events, setEvents] = useState<PtmEvent[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [apptList, evList] = await Promise.all([
        listPtmAppointments(organization.id, {
          status: selectedStatus || undefined,
        }),
        listPtmEvents(organization.id),
      ]);
      setAppointments(apptList);
      setEvents(evList);
    } catch (err: any) {
      console.error("loadPtmReports error:", err);
      setError(err.message || "Failed to load reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [organization, selectedStatus]);

  const handleExportCSV = () => {
    if (appointments.length === 0) return;
    const headers = "Date,Time,Student,Parent,Teacher,Class,Mode,Status\n";
    const rows = appointments
      .map(
        (a) =>
          `"${a.date}","${a.startTime}-${a.endTime}","${a.studentName}","${a.parentName}","${a.teacherName}","${a.className}-${a.sectionName}","${a.mode}","${a.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PTM_Report_${new Date().toISOString().split("T")[0]}.csv`);
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
            PTM Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit parent participation rates, completed conference meetings, and cancellations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={appointments.length === 0}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1.5" /> Export CSV Report
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedStatus === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? st : "All Statuses"} ({st ? appointments.filter((a) => a.status === st).length : appointments.length})
          </button>
        ))}
      </div>

      {/* Report Table */}
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
          <Button onClick={loadReports} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No records found</h3>
          <p className="mt-1 text-xs text-muted-foreground">No appointments matching selected filters.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Parent</th>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono">{a.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {a.startTime} - {a.endTime}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{a.studentName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.parentName}</td>
                    <td className="py-3 px-4 text-foreground">{a.teacherName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.mode}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          a.status === "COMPLETED" || a.status === "CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : a.status === "CANCELLED"
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
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
