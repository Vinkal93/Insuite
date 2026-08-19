import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Eye,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Exam, ExamRankingItem, ExamSettingsConfig } from "@/types/exams";
import type { SchoolClass, Section } from "@/types";
import {
  listExams,
  getClassRankings,
  getExamSettings,
} from "@/services/examService";
import { getSchoolClasses, getSectionsByClass } from "@/services/academicService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const RankingsView: React.FC = () => {
  const { organization, selectedSession } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [rankings, setRankings] = useState<ExamRankingItem[]>([]);
  const [examSettings, setExamSettings] = useState<ExamSettingsConfig | null>(null);

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    Promise.all([
      listExams(organization.id, { sessionId: selectedSession?.id }),
      getSchoolClasses(organization.id),
      getExamSettings(organization.id),
    ]).then(([exList, clsList, settings]) => {
      setExams(exList);
      setClasses(clsList);
      setExamSettings(settings);
      if (exList.length > 0) setSelectedExamId(exList[0].id);
      if (clsList.length > 0) setSelectedClassId(clsList[0].id);
    });
  }, [organization, selectedSession]);

  useEffect(() => {
    if (!organization || !selectedClassId) return;
    getSectionsByClass(organization.id, selectedClassId).then((secList) => {
      setSections(secList);
    });
  }, [organization, selectedClassId]);

  const loadRankings = async () => {
    if (!organization || !selectedExamId || !selectedClassId) {
      setRankings([]);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getClassRankings(
        organization.id,
        selectedExamId,
        selectedClassId,
        selectedSectionId === "ALL" ? undefined : selectedSectionId
      );
      setRankings(data);
    } catch (err: any) {
      console.error("Load rankings error:", err);
      setErrorMsg("Failed to load class rankings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [organization, selectedExamId, selectedClassId, selectedSectionId]);

  if (examSettings && !examSettings.enableRankings) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
        <Trophy className="size-8 mx-auto text-muted-foreground/60" />
        <h3 className="text-sm font-bold text-foreground">Class Rankings Disabled</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Student rankings are currently disabled in examination settings.
        </p>
      </div>
    );
  }

  const topThree = rankings.slice(0, 3);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Academic Performance Rankings & Merit List
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Grade leaderboards and student merit standings with standard tie-handling.
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="rankExam" className="text-xs font-semibold">
            Examination:
          </Label>
          <select
            id="rankExam"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="rankCls" className="text-xs font-semibold">
            Class:
          </Label>
          <select
            id="rankCls"
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

        <div className="space-y-1">
          <Label htmlFor="rankSec" className="text-xs font-semibold">
            Section:
          </Label>
          <select
            id="rankSec"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">All Sections Combined</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {rankings.length >= 3 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Rank 2 - Silver */}
          <div className="order-2 sm:order-1 rounded-3xl border border-slate-300 bg-slate-100/60 dark:bg-slate-900/40 p-5 text-center shadow-soft">
            <div className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-slate-300 text-slate-700 font-bold">
              2
            </div>
            <h4 className="mt-2 text-sm font-extrabold text-foreground">{topThree[1]?.studentName}</h4>
            <p className="text-xs font-bold text-primary">{topThree[1]?.percentage}%</p>
            <p className="text-[10px] text-muted-foreground">
              {topThree[1]?.totalObtained} / {topThree[1]?.totalMaximum} Marks
            </p>
          </div>

          {/* Rank 1 - Gold */}
          <div className="order-1 sm:order-2 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 text-center shadow-soft -translate-y-1 sm:-translate-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white font-black text-lg shadow-sm">
              <Trophy className="size-6" />
            </div>
            <h4 className="mt-2 text-base font-black text-foreground">{topThree[0]?.studentName}</h4>
            <p className="text-sm font-black text-amber-600">{topThree[0]?.percentage}%</p>
            <p className="text-[11px] text-muted-foreground">
              {topThree[0]?.totalObtained} / {topThree[0]?.totalMaximum} Marks • Rank #1
            </p>
          </div>

          {/* Rank 3 - Bronze */}
          <div className="order-3 sm:order-3 rounded-3xl border border-amber-700/30 bg-amber-700/5 p-5 text-center shadow-soft">
            <div className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-amber-700/20 text-amber-800 dark:text-amber-400 font-bold">
              3
            </div>
            <h4 className="mt-2 text-sm font-extrabold text-foreground">{topThree[2]?.studentName}</h4>
            <p className="text-xs font-bold text-primary">{topThree[2]?.percentage}%</p>
            <p className="text-[10px] text-muted-foreground">
              {topThree[2]?.totalObtained} / {topThree[2]?.totalMaximum} Marks
            </p>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-secondary/80 border border-border/50" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Trophy className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">No ranking data available</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Ensure examination results have been calculated in the Result Processing workspace.
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
                  <th className="px-4 py-3.5">Roll No</th>
                  <th className="px-4 py-3.5">Class / Section</th>
                  <th className="px-4 py-3.5">Total Marks</th>
                  <th className="px-4 py-3.5">Percentage</th>
                  <th className="px-4 py-3.5">Grade</th>
                  <th className="px-4 py-3.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {rankings.map((r) => (
                  <tr key={r.studentId} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-black ${
                          r.rank === 1
                            ? "bg-amber-500 text-white"
                            : r.rank === 2
                            ? "bg-slate-300 text-slate-800"
                            : r.rank === 3
                            ? "bg-amber-700/30 text-amber-800"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-foreground">{r.studentName}</td>
                    <td className="px-4 py-3.5 font-mono text-muted-foreground">{r.rollNumber || "—"}</td>
                    <td className="px-4 py-3.5 text-foreground">
                      {r.className} ({r.sectionName})
                    </td>
                    <td className="px-4 py-3.5 text-foreground">
                      <strong className="text-foreground">{r.totalObtained}</strong> / {r.totalMaximum}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-primary">{r.percentage}%</td>
                    <td className="px-4 py-3.5 font-bold">{r.grade}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          r.resultStatus === "Pass"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {r.resultStatus}
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
