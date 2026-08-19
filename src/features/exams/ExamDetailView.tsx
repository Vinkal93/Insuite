import React, { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  GraduationCap,
  Calendar,
  Layers,
  Edit3,
  Trophy,
  FileText,
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Loader2,
  Lock,
  Send,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Exam, ExamSubject, ExamSchedule, ExamStatus } from "@/types/exams";
import {
  getExam,
  updateExam,
  getExamSubjects,
  saveExamSubjects,
  listExamSchedules,
  getMarksProgress,
  publishResults,
} from "@/services/examService";
import { getSchoolClasses, getSubjectsByClass } from "@/services/academicService";
import type { SchoolClass, Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ExamDetailView: React.FC = () => {
  const { examId } = useParams({ strict: false }) as { examId: string };
  const { organization, userProfile } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [marksProgress, setMarksProgress] = useState<{ totalRequired: number; enteredCount: number; percentage: number }>({
    totalRequired: 0,
    enteredCount: 0,
    percentage: 0,
  });

  const [activeTab, setActiveTab] = useState<"overview" | "subjects" | "schedule" | "progress">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subject Config State
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [subjectConfigs, setSubjectConfigs] = useState<
    { subjectId: string; subjectName: string; maximumMarks: number; passingMarks: number; theoryMarks?: number; practicalMarks?: number }[]
  >([]);
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Status update
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = async () => {
    if (!organization || !examId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [ex, clsList, exSubjs, schList, prog] = await Promise.all([
        getExam(organization.id, examId),
        getSchoolClasses(organization.id),
        getExamSubjects(organization.id, examId),
        listExamSchedules(organization.id, { examId }),
        getMarksProgress(organization.id, examId),
      ]);

      if (!ex) {
        setErrorMsg("Examination not found.");
        return;
      }

      setExam(ex);
      setClasses(clsList.filter((c) => ex.classIds?.includes(c.id)));
      setExamSubjects(exSubjs);
      setSchedules(schList);
      setMarksProgress(prog);

      if (ex.classIds && ex.classIds.length > 0) {
        setSelectedClassId(ex.classIds[0]);
      }
    } catch (err: any) {
      console.error("Exam detail load error:", err);
      setErrorMsg("Failed to load examination details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, examId]);

  // Load subjects for selected class
  useEffect(() => {
    if (!organization || !selectedClassId || !exam) return;
    getSubjectsByClass(organization.id, selectedClassId).then((subjs) => {
      setAvailableSubjects(subjs);

      const existingForClass = examSubjects.filter((s) => s.classId === selectedClassId);
      const rows = subjs.map((s) => {
        const found = existingForClass.find((efc) => efc.subjectId === s.id);
        return {
          subjectId: s.id,
          subjectName: s.name,
          maximumMarks: found?.maximumMarks || 100,
          passingMarks: found?.passingMarks || 33,
          theoryMarks: found?.theoryMarks,
          practicalMarks: found?.practicalMarks,
        };
      });
      setSubjectConfigs(rows);
    });
  }, [organization, selectedClassId, examSubjects, exam]);

  const handleSaveSubjects = async () => {
    if (!organization || !userProfile || !exam) return;
    setIsSavingSubjects(true);
    setSaveSuccessMsg(null);
    try {
      const payload = subjectConfigs.map((sc) => ({
        classId: selectedClassId,
        subjectId: sc.subjectId,
        subjectName: sc.subjectName,
        maximumMarks: Number(sc.maximumMarks),
        passingMarks: Number(sc.passingMarks),
        theoryMarks: sc.theoryMarks ? Number(sc.theoryMarks) : undefined,
        practicalMarks: sc.practicalMarks ? Number(sc.practicalMarks) : undefined,
      }));

      await saveExamSubjects(organization.id, exam.id, payload, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });

      setSaveSuccessMsg("Subject marks configuration saved successfully!");
      // Reload subjects list
      const updated = await getExamSubjects(organization.id, exam.id);
      setExamSubjects(updated);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save subject configuration.");
    } finally {
      setIsSavingSubjects(false);
    }
  };

  const handleStatusChange = async (newStatus: ExamStatus) => {
    if (!organization || !userProfile || !exam) return;
    setIsUpdatingStatus(true);
    try {
      await updateExam(organization.id, exam.id, { status: newStatus }, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      setExam((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err: any) {
      alert(err.message || "Failed to update exam status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePublishAllResults = async () => {
    if (!organization || !userProfile || !exam) return;
    if (!confirm(`Are you sure you want to publish results for "${exam.name}"? Published results become official.`)) return;

    try {
      const res = await publishResults(organization.id, exam.id, undefined, undefined, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      alert(`Successfully published results for ${res.publishedCount} students!`);
      setExam((prev) => (prev ? { ...prev, status: "Published" } : null));
    } catch (err: any) {
      alert(err.message || "Failed to publish results. Ensure results are processed first.");
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

  if (errorMsg || !exam) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive my-8">
        <AlertCircle className="size-8 mb-2" />
        <h3 className="text-base font-bold">{errorMsg || "Examination not found"}</h3>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/exams/list">Back to Examinations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/exams/list">
            <ArrowLeft className="size-3.5 mr-1.5" /> Back to Examinations
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <select
            value={exam.status}
            disabled={isUpdatingStatus}
            onChange={(e) => handleStatusChange(e.target.value as ExamStatus)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Result Processing">Result Processing</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Main Overview Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground sm:text-2xl">{exam.name}</h1>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    exam.status === "Published"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : exam.status === "Ongoing"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {exam.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Type: <strong className="text-foreground">{exam.type}</strong> • Duration:{" "}
                <strong className="text-foreground">{exam.startDate}</strong> to{" "}
                <strong className="text-foreground">{exam.endDate}</strong>
              </p>
            </div>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
              <Link to="/exams/schedule">
                <Calendar className="size-3.5 mr-1.5" /> Schedule
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
              <Link to="/exams/marks/$examId" params={{ examId: exam.id }}>
                <Edit3 className="size-3.5 mr-1.5" /> Enter Marks
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
              <Link to="/exams/results">
                <Layers className="size-3.5 mr-1.5" /> Process Results
              </Link>
            </Button>
            {exam.status !== "Published" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePublishAllResults}
                className="rounded-xl text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                <Send className="size-3.5 mr-1.5" /> Publish
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 pb-2.5 px-3 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview & Classes
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`border-b-2 pb-2.5 px-3 transition-colors ${
              activeTab === "subjects"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Subjects & Marks Setup ({examSubjects.length})
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`border-b-2 pb-2.5 px-3 transition-colors ${
              activeTab === "schedule"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Schedule Slots ({schedules.length})
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`border-b-2 pb-2.5 px-3 transition-colors ${
              activeTab === "progress"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Marks Progress ({marksProgress.percentage}%)
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {exam.description && (
              <div className="rounded-2xl border border-border bg-surface/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Guidelines</p>
                <p className="mt-1 text-xs text-foreground">{exam.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Participating Classes ({classes.length})
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((c) => {
                  const subjectCount = examSubjects.filter((s) => s.classId === c.id).length;
                  return (
                    <div key={c.id} className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-sm">{c.name}</span>
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {subjectCount} Subjects
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClassId(c.id);
                            setActiveTab("subjects");
                          }}
                          className="h-7 px-2 text-[11px] font-semibold text-primary"
                        >
                          Configure Marks →
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Subjects & Marks Setup */}
        {activeTab === "subjects" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Subject Maximum & Passing Marks</h3>
                <p className="text-xs text-muted-foreground">
                  Configure maximum marks, passing threshold, and theory/practical distribution per class.
                </p>
              </div>

              {classes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="classSelect" className="text-xs font-semibold">
                    Class:
                  </Label>
                  <select
                    id="classSelect"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {saveSuccessMsg && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {availableSubjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No subjects mapped for this class in Academic Setup.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3 w-32">Max Marks</th>
                      <th className="px-4 py-3 w-32">Pass Marks</th>
                      <th className="px-4 py-3 w-32">Theory</th>
                      <th className="px-4 py-3 w-32">Practical</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {subjectConfigs.map((sc, idx) => (
                      <tr key={sc.subjectId} className="hover:bg-surface/30">
                        <td className="px-4 py-3 font-bold text-foreground">{sc.subjectName}</td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={sc.maximumMarks}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSubjectConfigs((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, maximumMarks: val } : item))
                              );
                            }}
                            className="h-8 rounded-lg text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={sc.passingMarks}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setSubjectConfigs((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, passingMarks: val } : item))
                              );
                            }}
                            className="h-8 rounded-lg text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            placeholder="e.g. 70"
                            value={sc.theoryMarks ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : undefined;
                              setSubjectConfigs((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, theoryMarks: val } : item))
                              );
                            }}
                            className="h-8 rounded-lg text-xs"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            placeholder="e.g. 30"
                            value={sc.practicalMarks ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : undefined;
                              setSubjectConfigs((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, practicalMarks: val } : item))
                              );
                            }}
                            className="h-8 rounded-lg text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end p-4 border-t border-border bg-surface/30">
                  <Button
                    onClick={handleSaveSubjects}
                    disabled={isSavingSubjects}
                    variant="hero"
                    size="sm"
                    className="rounded-xl text-xs font-bold"
                  >
                    {isSavingSubjects ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-3.5 mr-1.5" /> Save Subject Configuration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Schedule Slots */}
        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Examination Timetable</h3>
                <p className="text-xs text-muted-foreground">Scheduled time slots and test rooms.</p>
              </div>
              <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
                <Link to="/exams/schedule">
                  <Plus className="size-3.5 mr-1.5" /> Add Schedule Slot
                </Link>
              </Button>
            </div>

            {schedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
                <Calendar className="size-6 mx-auto text-muted-foreground/60" />
                <p>No examination slots scheduled yet for this exam.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {schedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-surface/30">
                        <td className="px-4 py-3 font-bold text-foreground">{sch.date}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sch.startTime} → {sch.endTime}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {sch.className} ({sch.sectionName})
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">{sch.subjectName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{sch.roomName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                            {sch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Marks Progress */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Overall Marks Entry Completion</h3>
                  <p className="text-xs text-muted-foreground">
                    {marksProgress.enteredCount} of {marksProgress.totalRequired} marks records submitted across all classes.
                  </p>
                </div>
                <span className="text-2xl font-black text-primary">{marksProgress.percentage}%</span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${marksProgress.percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
                <Link to="/exams/marks/$examId" params={{ examId: exam.id }}>
                  <Edit3 className="size-3.5 mr-1.5" /> Continue Marks Entry
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
