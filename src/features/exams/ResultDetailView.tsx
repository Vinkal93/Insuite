import React, { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  GraduationCap,
  ArrowLeft,
  FileText,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Unlock,
  Lock,
  Loader2,
  X,
  Printer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ExamResult } from "@/types/exams";
import { getResult, unlockResult } from "@/services/examService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ResultDetailView: React.FC = () => {
  const { resultId } = useParams({ strict: false }) as { resultId: string };
  const { organization, userProfile } = useAuth();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unlock modal
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  const loadData = async () => {
    if (!organization || !resultId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getResult(organization.id, resultId);
      if (!data) {
        setErrorMsg("Result record not found.");
        return;
      }
      setResult(data);
    } catch (err: any) {
      console.error("Load result error:", err);
      setErrorMsg("Failed to load result details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, resultId]);

  const handleUnlock = async () => {
    if (!organization || !userProfile || !result || !unlockReason.trim()) return;
    setIsUnlocking(true);
    try {
      await unlockResult(organization.id, result.id, unlockReason.trim(), {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      setIsUnlockModalOpen(false);
      setUnlockReason("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to unlock result.");
    } finally {
      setIsUnlocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
        <div className="h-44 animate-pulse rounded-3xl bg-secondary/80 border border-border/50" />
      </div>
    );
  }

  if (errorMsg || !result) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive my-8">
        <AlertCircle className="size-8 mb-2" />
        <h3 className="text-base font-bold">{errorMsg || "Result not found"}</h3>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/exams/results">Back to Results</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/exams/results">
            <ArrowLeft className="size-3.5 mr-1.5" /> Back to Results
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {result.status === "published" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUnlockModalOpen(true)}
              className="rounded-xl text-xs font-semibold text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
            >
              <Unlock className="size-3.5 mr-1.5" /> Unlock for Re-evaluation
            </Button>
          )}
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/exams/report-cards">
              <Printer className="size-3.5 mr-1.5" /> Printable Report Card
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Student Scorecard Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-xl">
              {result.studentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground sm:text-2xl">{result.studentName}</h1>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    result.resultStatus === "Pass"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : result.resultStatus === "Fail"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {result.resultStatus}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Class: <strong className="text-foreground">{result.className} ({result.sectionName})</strong> • Roll No:{" "}
                <strong className="text-foreground font-mono">{result.rollNumber || "—"}</strong> • Student ID:{" "}
                <span className="font-mono">{result.studentIdentifier || "—"}</span>
              </p>
              <p className="text-xs text-primary font-bold mt-0.5">{result.examName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {result.rank && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                <Trophy className="size-5 text-amber-600 mx-auto" />
                <span className="text-[10px] font-bold text-amber-700 uppercase">Rank</span>
                <p className="text-base font-black text-amber-600">#{result.rank}</p>
              </div>
            )}
            <div className="rounded-2xl border border-border bg-surface p-3 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Grade</span>
              <p className="text-base font-black text-primary">{result.grade}</p>
            </div>
          </div>
        </div>

        {/* 4-KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Marks</span>
            <p className="text-xl font-black text-foreground">
              {result.totalObtained} / {result.totalMaximum}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Percentage</span>
            <p className="text-xl font-black text-foreground">{result.percentage}%</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Grade Point</span>
            <p className="text-xl font-black text-foreground">{result.gradePoint}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
            <p className="text-xl font-black text-foreground uppercase text-xs mt-1">
              {result.status}
            </p>
          </div>
        </div>

        {/* Subject-Wise Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Subject Assessment Breakdown</h3>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                <tr>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Max Marks</th>
                  <th className="px-4 py-3">Marks Obtained</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {result.subjectResults.map((s) => (
                  <tr key={s.subjectId} className="hover:bg-surface/30">
                    <td className="px-4 py-3 font-bold text-foreground">{s.subjectName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.maximumMarks}</td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {s.absent ? (
                        <span className="text-destructive">Absent</span>
                      ) : s.marksObtained !== null ? (
                        s.marksObtained
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">{s.percentage}%</td>
                    <td className="px-4 py-3 font-bold text-primary">{s.grade}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          s.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {s.passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {result.unlockReason && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
            <span className="font-bold">Unlock Audit Note:</span> {result.unlockReason}
          </div>
        )}
      </div>

      {/* Unlock Confirmation Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Unlock className="size-5 text-amber-600" />
                <h3 className="text-base font-black text-foreground">Unlock Published Result</h3>
              </div>
              <button onClick={() => setIsUnlockModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-surface">
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Unlocking this result will change its status back to Draft, permitting authorized mark corrections. Please record an official rationale.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="unlockReason" className="text-xs font-bold">
                Reason for Modification *
              </Label>
              <Input
                id="unlockReason"
                placeholder="e.g. Scrutiny recount / teacher clerical correction"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setIsUnlockModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button
                variant="hero"
                size="sm"
                disabled={isUnlocking || !unlockReason.trim()}
                onClick={handleUnlock}
                className="rounded-xl text-xs font-bold"
              >
                {isUnlocking ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Confirm Unlock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
