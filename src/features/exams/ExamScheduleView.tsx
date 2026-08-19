import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Clock,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  Building,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Exam, ExamSchedule } from "@/types/exams";
import type { SchoolClass, Section, Subject, Room } from "@/types";
import {
  listExams,
  listExamSchedules,
  createExamSchedule,
  deleteExamSchedule,
} from "@/services/examService";
import {
  getSchoolClasses,
  getSectionsByClass,
  getSubjectsByClass,
} from "@/services/academicService";
import { listRooms } from "@/services/timetableService";
import { examScheduleSchema, type ExamScheduleInput } from "@/schemas/exams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ExamScheduleView: React.FC = () => {
  const { organization, selectedSession, userProfile } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);

  const [selectedExamId, setSelectedExamId] = useState<string>("ALL");
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConflictError, setModalConflictError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExamScheduleInput>({
    resolver: zodResolver(examScheduleSchema),
    defaultValues: {
      examId: "",
      academicSessionId: selectedSession?.id || "",
      classId: "",
      sectionId: "",
      subjectId: "",
      roomId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "12:00",
      instructions: "",
    },
  });

  const formClassId = watch("classId");

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [exList, clsList, schList, rmList] = await Promise.all([
        listExams(organization.id, { sessionId: selectedSession?.id }),
        getSchoolClasses(organization.id),
        listExamSchedules(organization.id, { sessionId: selectedSession?.id }),
        listRooms(organization.id),
      ]);
      setExams(exList);
      setClasses(clsList);
      setSchedules(schList);
      setRooms(rmList);
    } catch (err: any) {
      console.error("Exam schedule load error:", err);
      setErrorMsg("Unable to load examination schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession]);

  // Load sections and subjects when class is selected in form
  useEffect(() => {
    if (!organization || !formClassId) {
      setSections([]);
      setSubjects([]);
      return;
    }
    Promise.all([
      getSectionsByClass(organization.id, formClassId),
      getSubjectsByClass(organization.id, formClassId),
    ]).then(([secList, subList]) => {
      setSections(secList);
      setSubjects(subList);
      if (secList.length > 0) setValue("sectionId", secList[0].id);
      if (subList.length > 0) setValue("subjectId", subList[0].id);
    });
  }, [organization, formClassId, setValue]);

  const handleOpenModal = () => {
    reset({
      examId: exams[0]?.id || "",
      academicSessionId: selectedSession?.id || "",
      classId: classes[0]?.id || "",
      sectionId: "",
      subjectId: "",
      roomId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "12:00",
      instructions: "",
    });
    setModalConflictError(null);
    setIsModalOpen(true);
  };

  const onSubmitSchedule = async (data: ExamScheduleInput) => {
    if (!organization || !userProfile) return;
    setIsSubmitting(true);
    setModalConflictError(null);
    try {
      const created = await createExamSchedule(organization.id, data, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      setSchedules((prev) => [...prev, created]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Create schedule error:", err);
      setModalConflictError(err.message || "Failed to schedule exam slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!organization || !userProfile) return;
    if (!confirm("Are you sure you want to remove this examination slot?")) return;

    setActionLoadingId(scheduleId);
    try {
      await deleteExamSchedule(organization.id, scheduleId, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (err: any) {
      alert(err.message || "Failed to delete examination slot.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = schedules.filter((s) => {
    const matchExam = selectedExamId === "ALL" || s.examId === selectedExamId;
    const matchClass = selectedClassId === "ALL" || s.classId === selectedClassId;
    return matchExam && matchClass;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Examination Schedule & Timetable
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage test dates, time slots, exam halls/rooms, and prevent scheduling overlaps.
          </p>
        </div>

        <Button onClick={handleOpenModal} variant="hero" size="sm" className="rounded-xl text-xs font-bold shadow-soft">
          <Plus className="size-3.5 mr-1.5" /> Schedule Slot
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Label htmlFor="examFilter" className="text-xs font-semibold">
            Exam:
          </Label>
          <select
            id="examFilter"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="classFilter" className="text-xs font-semibold">
            Class:
          </Label>
          <select
            id="classFilter"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule Table */}
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-4 rounded-xl text-xs font-semibold">
            <RefreshCw className="size-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Calendar className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">No examination schedule found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No examination slots have been scheduled yet for the selected filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Exam</th>
                  <th className="px-4 py-3.5">Class / Section</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Room</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filtered.map((sch) => (
                  <tr key={sch.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">{sch.date}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {sch.startTime} → {sch.endTime}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{sch.examName || "Exam"}</td>
                    <td className="px-4 py-3.5 text-foreground">
                      {sch.className} ({sch.sectionName})
                    </td>
                    <td className="px-4 py-3.5 font-bold text-primary">{sch.subjectName}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{sch.roomName || "—"}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoadingId === sch.id}
                        onClick={() => handleDeleteSchedule(sch.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Slot Modal / Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                <h3 className="text-base font-black text-foreground">Schedule Examination Slot</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-surface">
                <X className="size-4" />
              </button>
            </div>

            {modalConflictError && (
              <div className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{modalConflictError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitSchedule)} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Exam */}
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="modalExam" className="text-xs font-bold">
                    Examination *
                  </Label>
                  <select
                    id="modalExam"
                    {...register("examId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.type})
                      </option>
                    ))}
                  </select>
                  {errors.examId && <p className="text-[11px] text-destructive">{errors.examId.message}</p>}
                </div>

                {/* Class */}
                <div className="space-y-1">
                  <Label htmlFor="modalClass" className="text-xs font-bold">
                    Class *
                  </Label>
                  <select
                    id="modalClass"
                    {...register("classId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.classId && <p className="text-[11px] text-destructive">{errors.classId.message}</p>}
                </div>

                {/* Section */}
                <div className="space-y-1">
                  <Label htmlFor="modalSection" className="text-xs font-bold">
                    Section *
                  </Label>
                  <select
                    id="modalSection"
                    {...register("sectionId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.sectionId && <p className="text-[11px] text-destructive">{errors.sectionId.message}</p>}
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <Label htmlFor="modalSubject" className="text-xs font-bold">
                    Subject *
                  </Label>
                  <select
                    id="modalSubject"
                    {...register("subjectId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  {errors.subjectId && <p className="text-[11px] text-destructive">{errors.subjectId.message}</p>}
                </div>

                {/* Room */}
                <div className="space-y-1">
                  <Label htmlFor="modalRoom" className="text-xs font-bold">
                    Exam Room (Optional)
                  </Label>
                  <select
                    id="modalRoom"
                    {...register("roomId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">No Room Assigned</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <Label htmlFor="modalDate" className="text-xs font-bold">
                    Exam Date *
                  </Label>
                  <Input id="modalDate" type="date" {...register("date")} className="rounded-xl text-xs" />
                  {errors.date && <p className="text-[11px] text-destructive">{errors.date.message}</p>}
                </div>

                {/* Time Range */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Time Window *</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="time" {...register("startTime")} className="rounded-xl text-xs" />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input type="time" {...register("endTime")} className="rounded-xl text-xs" />
                  </div>
                  {errors.endTime && <p className="text-[11px] text-destructive">{errors.endTime.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="hero" size="sm" disabled={isSubmitting} className="rounded-xl text-xs font-bold">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin mr-1.5" /> Checking & Saving...
                    </>
                  ) : (
                    "Confirm Schedule"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
