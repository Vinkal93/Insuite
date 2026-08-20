import React, { useState, useEffect } from "react";
import { Trophy, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { listResults, listExams } from "@/services/examService";
import type { ExamResult, Exam } from "@/types/exam";
import { Button } from "@/components/ui/button";

export const StudentExamsListView: React.FC = () => {
  const { organization } = useAuth();
  const { student } = useStudent();

  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const sessionId = student.academic.sessionId;
      const [resList, examList] = await Promise.all([
        listResults(organization.id, {
          studentId: student.id,
          status: "PUBLISHED",
        }),
        listExams(organization.id, {
          sessionId,
          classId: student.academic.classId,
        }),
      ]);
      setResults(resList);
      setExams(examList);
    } catch (err: any) {
      console.error("loadStudentExams error:", err);
      setError(err.message || "Failed to load examination reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [organization, student]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Assessments & Results
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Term examination scorecards and published academic report cards.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadExams} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Trophy className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No published results yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Term results will be published once grading is finalized.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-3xl border border-border bg-card shadow-soft space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">{r.examName}</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Published: {r.publishedAt?.split("T")[0] || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl font-mono font-black text-xs bg-primary/10 text-primary border border-primary/20">
                    {r.percentage}% ({r.grade})
                  </span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${
                      r.resultStatus === "PASS"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}
                  >
                    {r.resultStatus}
                  </span>
                </div>
              </div>

              {r.subjectMarks && r.subjectMarks.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold text-[10px]">
                        <th className="py-2 px-2">Subject</th>
                        <th className="py-2 px-2 text-right">Max Marks</th>
                        <th className="py-2 px-2 text-right">Marks Obtained</th>
                        <th className="py-2 px-2 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {r.subjectMarks.map((sm, i) => (
                        <tr key={i}>
                          <td className="py-2 px-2 font-bold text-foreground">{sm.subjectName}</td>
                          <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                            {sm.maxMarks}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-primary">
                            {sm.marksObtained}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-foreground">
                            {sm.grade || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
