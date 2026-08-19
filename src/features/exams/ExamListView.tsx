import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Edit3,
  Trash2,
  Eye,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Exam } from "@/types/exams";
import { listExams, deleteExam } from "@/services/examService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ExamListView: React.FC = () => {
  const { organization, selectedSession, userProfile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadExams = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await listExams(organization.id, {
        sessionId: selectedSession?.id,
      });
      setExams(data);
    } catch (err: any) {
      console.error("Failed to load exams:", err);
      setErrorMsg("Unable to load examinations list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [organization, selectedSession]);

  const handleDelete = async (examId: string, examName: string) => {
    if (!organization || !userProfile) return;
    if (!confirm(`Are you sure you want to delete examination "${examName}"?`)) return;

    setActionLoadingId(examId);
    try {
      await deleteExam(organization.id, examId, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      setExams((prev) => prev.filter((e) => e.id !== examId));
    } catch (err: any) {
      alert(err.message || "Failed to delete exam.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = exams.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Examinations Directory
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            View and manage examination terms, dates, target classes, and publication statuses.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/exams/new">
            <Plus className="size-3.5 mr-1.5" /> Create Exam
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exams by name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="ALL">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Result Processing">Result Processing</option>
          <option value="Published">Published</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Table / Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/80 border border-border/50" />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive">
          <AlertCircle className="size-8 mb-2" />
          <p className="text-xs font-bold">{errorMsg}</p>
          <Button onClick={loadExams} variant="outline" size="sm" className="mt-4 rounded-xl text-xs font-semibold">
            <RefreshCw className="size-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <GraduationCap className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">No examinations found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || statusFilter !== "ALL"
              ? "No examinations match your search or filter criteria."
              : "No examinations have been created yet. Click 'Create Exam' to begin."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Exam Name</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Classes</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filtered.map((ex) => (
                  <tr key={ex.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      <Link to="/exams/$examId" params={{ examId: ex.id }} className="hover:text-primary transition-colors">
                        {ex.name}
                      </Link>
                      {ex.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 font-normal">
                          {ex.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{ex.type}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {ex.startDate} → {ex.endDate}
                    </td>
                    <td className="px-4 py-3.5 text-foreground">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                        {ex.classIds?.length || 0} Classes
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ex.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : ex.status === "Ongoing"
                            ? "bg-blue-500/10 text-blue-600"
                            : ex.status === "Result Processing"
                            ? "bg-purple-500/10 text-purple-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 rounded-lg text-xs">
                          <Link to="/exams/$examId" params={{ examId: ex.id }}>
                            <Eye className="size-3.5 mr-1" /> View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 rounded-lg text-xs">
                          <Link to="/exams/marks/$examId" params={{ examId: ex.id }}>
                            <Edit3 className="size-3.5 mr-1" /> Marks
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoadingId === ex.id}
                          onClick={() => handleDelete(ex.id, ex.name)}
                          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
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
