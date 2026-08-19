import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  Edit,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAcademicSessionsList,
  setActiveAcademicSessionFull,
  archiveAcademicSession,
} from "@/services";
import type { AcademicSessionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AcademicSessionsListView: React.FC = () => {
  const { organization, firebaseUser, refreshUserData } = useAuth();
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await getAcademicSessionsList(organization.id);
      setSessions(list);
    } catch (err: any) {
      setError(err.message || "Failed to load academic sessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [organization]);

  const handleSetActive = async (sessionId: string, sessionName: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm(`Are you sure you want to set "${sessionName}" as the Active Academic Session?`)) return;

    setProcessingId(sessionId);
    setSuccessMsg(null);
    setError(null);
    try {
      await setActiveAcademicSessionFull(organization.id, sessionId, firebaseUser.uid);
      setSuccessMsg(`Session "${sessionName}" is now the active academic session.`);
      await fetchSessions();
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || "Failed to set active session");
    } finally {
      setProcessingId(null);
    }
  };

  const handleArchive = async (sessionId: string, sessionName: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm(`Are you sure you want to archive "${sessionName}"? Data will be preserved.`)) return;

    setProcessingId(sessionId);
    setSuccessMsg(null);
    setError(null);
    try {
      await archiveAcademicSession(organization.id, sessionId, firebaseUser.uid);
      setSuccessMsg(`Session "${sessionName}" has been archived.`);
      await fetchSessions();
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || "Failed to archive session");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Academic Sessions
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure institutional school years, active sessions, and archived academic periods.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/academics/sessions/new">
            <Plus className="size-3.5 mr-1" /> New Academic Session
          </Link>
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search academic sessions..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "active", "draft", "completed", "archived"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Table & Responsive Cards */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading academic sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Calendar className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No academic sessions found.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/academics/sessions/new">+ Create New Session</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Session Name</th>
                  <th className="px-4 py-3.5 font-bold">Duration</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold text-center">Classes</th>
                  <th className="px-4 py-3.5 font-bold text-center">Students</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                          <Calendar className="size-4" />
                        </div>
                        <div>
                          <Link
                            to="/academics/sessions/$sessionId"
                            params={{ sessionId: s.id }}
                            className="hover:underline text-sm font-extrabold text-foreground"
                          >
                            {s.name}
                          </Link>
                          {s.isActive && (
                            <span className="ml-2 rounded bg-primary/15 text-primary px-2 py-0.5 text-[9px] font-extrabold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {s.startDate} → {s.endDate}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          s.status === "active"
                            ? "bg-success/15 text-success"
                            : s.status === "archived"
                            ? "bg-muted text-muted-foreground"
                            : s.status === "completed"
                            ? "bg-blue-500/15 text-blue-500"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      {s.classesCount ?? 0}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      {s.studentsCount ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!s.isActive && s.status !== "archived" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActive(s.id, s.name)}
                            disabled={processingId === s.id}
                            className="rounded-xl text-[11px] font-bold text-primary hover:bg-primary/10"
                          >
                            {processingId === s.id ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                            Set Active
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                          <Link to="/academics/sessions/$sessionId" params={{ sessionId: s.id }}>
                            <Eye className="size-3.5 mr-1" /> View
                          </Link>
                        </Button>
                        {s.status !== "archived" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchive(s.id, s.name)}
                            disabled={processingId === s.id || s.isActive}
                            title={s.isActive ? "Cannot archive an active session" : "Archive session"}
                            className="size-8 rounded-xl text-muted-foreground hover:text-destructive"
                          >
                            <Archive className="size-3.5" />
                          </Button>
                        )}
                      </div>
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
