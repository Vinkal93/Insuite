import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Send,
  Eye,
  FileText,
  Trophy,
  Lock,
  Unlock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Exam, ExamResult } from "@/types/exams";
import type { SchoolClass, Section } from "@/types";
import {
  listExams,
  processClassResults,
  listResults,
  publishResults,
  getMarksProgress,
} from "@/services/examService";
import { getSchoolClasses, getSectionsByClass } from "@/services/academicService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const ResultsProcessingView: React.FC = () => {
  const { organization, selectedSession, userProfile } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const [results, setResults] = useState<ExamResult[]>([]);
  const [marksProgress, setMarksProgress] = useState<{ totalRequired: number; enteredCount: number; percentage: number }>({
    totalRequired: 0,
    enteredCount: 0,
    percentage: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initial dependencies
  useEffect(() => {
    if (!organization) return;
    Promise.all([
      listExams(organization.id, { sessionId: selectedSession?.id }),
      getSchoolClasses(organization.id),
    ]).then(([exList, clsList]) => {
      setExams(exList);
      setClasses(clsList);
      if (exList.length > 0) setSelectedExamId(exList[0].id);
      if (clsList.length > 0) setSelectedClassId(clsList[0].id);
    });
  }, [organization, selectedSession]);

  // Load sections when class changes
  useEffect(() => {
    if (!organization || !selectedClassId) return;
    getSectionsByClass(organization.id, selectedClassId).then((secList) => {
      setSections(secList);
      if (secList.length > 0) setSelectedSectionId(secList[0].id);
    });
  }, [organization, selectedClassId]);

  // Load existing processed results & progress
  const loadResults = async () => {
    if (!organization || !selectedExamId || !selectedClassId || !selectedSectionId) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resList, prog] = await Promise.all([
        listResults(organization.id, {
          examId: selectedExamId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
        }),
        getMarksProgress(organization.id, selectedExamId, selectedClassId, selectedSectionId),
      ]);
      setResults(resList);
      setMarksProgress(prog);
    } catch (err: any) {
      console.error("Load results error:", err);
      setErrorMsg("Unable to load results for this class.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [organization, selectedExamId, selectedClassId, selectedSectionId]);

  const handleProcessResults = async () => {
    if (!organization || !userProfile || !selectedExamId || !selectedClassId || !selectedSectionId) return;

    if (marksProgress.enteredCount < marksProgress.totalRequired) {
      const proceed = confirm(
        `Warning: Only ${marksProgress.enteredCount} of ${marksProgress.totalRequired} marks entries are completed. Do you wish to process results anyway? Unentered marks will be marked Incomplete.`
      );
      if (!proceed) return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const out = await processClassResults(
        organization.id,
        selectedExamId,
        selectedClassId,
        selectedSectionId,
        {
          uid: userProfile.uid,
          name: userProfile.displayName || "Admin",
        }
      );

      setSuccessMsg(`Successfully processed examination results for ${out.processedCount} students!`);
      await loadResults();
    } catch (err: any) {
      console.error("Process results error:", err);
      setErrorMsg(err.message || "Failed to process results.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishResults = async () => {
    if (!organization || !userProfile || !selectedExamId || results.length === 0) return;

    const count = results.length;
    if (!confirm(`Publish official examination results for ${count} students? Published results are visible on report cards.`)) {
      return;
    }

    setIsPublishing(true);
    try {
      await publishResults(
        organization.id,
        selectedExamId,
        selectedClassId,
        selectedSectionId,
        {
          uid: userProfile.uid,
          name: userProfile.displayName || "Admin",
        }
      );
      setSuccessMsg(`Official results published for ${count} students!`);
      await loadResults();
    } catch (err: any) {
      console.error("Publish results error:", err);
      alert(err.message || "Failed to publish results.");
    } finally {
      setIsPublishing(false);
    }
  };

  const passedCount = results.filter((r) => r.resultStatus === "Pass").length;
  const passPercentage = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;
  const isAllPublished = results.length > 0 && results.every((r) => r.status === "published");

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Result Processing & Publication
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Calculate subject totals, percentage, grade boundaries, and publish institutional report cards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleProcessResults}
            disabled={isProcessing || !selectedExamId}
            variant="hero"
            size="sm"
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" /> Processing Marks...
              </>
            ) : (
              <>
                <Layers className="size-3.5 mr-1.5" /> Calculate & Process Results
              </>
            )}
          </Button>

          {results.length > 0 && !isAllPublished && (
            <Button
              onClick={handlePublishResults}
              disabled={isPublishing}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            >
              {isPublishing ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Send className="size-3.5 mr-1.5" />
              )}
              Publish Class Results
            </Button>
          )}
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-3">
        {/* Exam */}
        <div className="space-y-1">
          <Label htmlFor="resExamSel" className="text-xs font-semibold">
            Examination:
          </Label>
          <select
            id="resExamSel"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.type})
              </option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div className="space-y-1">
          <Label htmlFor="resClsSel" className="text-xs font-semibold">
            Class:
          </Label>
          <select
            id="resClsSel"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div className="space-y-1">
          <Label htmlFor="resSecSel" className="text-xs font-semibold">
            Section:
          </Label>
          <select
            id="resSecSel"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Analytics Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
          <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Marks Entry Status</span>
          <p className="text-lg font-black text-foreground">
            {marksProgress.enteredCount} / {marksProgress.totalRequired}
          </p>
          <p className="text-[10px] text-muted-foreground">{marksProgress.percentage}% Submitted</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
          <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Students Processed</span>
          <p className="text-lg font-black text-foreground">{results.length}</p>
          <p className="text-[10px] text-muted-foreground">Class Strength</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-soft">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Passed Students</span>
          <p className="text-lg font-black text-emerald-600">{passedCount}</p>
          <p className="text-[10px] text-emerald-700/80">{passPercentage}% Pass Rate</p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-soft">
          <span className="text-[10px] font-extrabold uppercase text-purple-600">Publication Status</span>
          <p className="text-lg font-black text-purple-600">
            {isAllPublished ? "Published" : results.length > 0 ? "Draft Processed" : "Not Processed"}
          </p>
          <p className="text-[10px] text-purple-700/80">Report Cards Ready</p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-600">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-secondary/80 border border-border/50" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Layers className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">No processed results available</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Click "Calculate & Process Results" above to compute grade sheets from entered marks.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                <tr>
                  <th className="px-4 py-3.5 w-16">Rank</th>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Roll</th>
                  <th className="px-4 py-3.5">Total Marks</th>
                  <th className="px-4 py-3.5">Percentage</th>
                  <th className="px-4 py-3.5">Grade</th>
                  <th className="px-4 py-3.5">Result</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-primary">
                      {r.rank ? `#${r.rank}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-foreground">{r.studentName}</td>
                    <td className="px-4 py-3.5 font-mono text-muted-foreground">{r.rollNumber || "—"}</td>
                    <td className="px-4 py-3.5 text-foreground">
                      <strong className="text-foreground">{r.totalObtained}</strong> / {r.totalMaximum}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-foreground">{r.percentage}%</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-secondary px-2 py-0.5 font-black text-primary">
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          r.resultStatus === "Pass"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : r.resultStatus === "Fail"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.resultStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          r.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                          <Link to="/exams/results/$resultId" params={{ resultId: r.id }}>
                            <Eye className="size-3.5 mr-1" /> Scorecard
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                          <Link to="/exams/report-cards">
                            <FileText className="size-3.5" />
                          </Link>
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
