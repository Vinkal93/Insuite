import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Printer,
  Search,
  Filter,
  GraduationCap,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Exam, ExamResult, ExamSettingsConfig } from "@/types/exams";
import type { SchoolClass, Section, Student } from "@/types";
import { listExams, listResults, getExamSettings } from "@/services/examService";
import { getSchoolClasses, getSectionsByClass } from "@/services/academicService";
import { listStudents } from "@/services/studentService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const ReportCardsView: React.FC = () => {
  const { organization, selectedSession } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [examSettings, setExamSettings] = useState<ExamSettingsConfig | null>(null);

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

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
      if (secList.length > 0) setSelectedSectionId(secList[0].id);
    });
  }, [organization, selectedClassId]);

  // Load results
  useEffect(() => {
    if (!organization || !selectedExamId || !selectedClassId || !selectedSectionId) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    listResults(organization.id, {
      examId: selectedExamId,
      classId: selectedClassId,
      sectionId: selectedSectionId,
    })
      .then((resList) => {
        setResults(resList);
        if (resList.length > 0 && !selectedStudentId) {
          setSelectedStudentId(resList[0].studentId);
        }
      })
      .catch((err) => {
        console.error("Load report cards error:", err);
        setErrorMsg("Failed to load student report card data.");
      })
      .finally(() => setIsLoading(false));
  }, [organization, selectedExamId, selectedClassId, selectedSectionId]);

  const activeResult = results.find((r) => r.studentId === selectedStudentId) || results[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Non-printable Screen Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Student Report Cards
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate and print official institutional grade sheets and academic transcripts.
          </p>
        </div>

        <Button
          onClick={handlePrint}
          disabled={!activeResult}
          variant="hero"
          size="sm"
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Printer className="size-3.5 mr-1.5" /> Print / Save PDF
        </Button>
      </div>

      {/* Non-printable Filter Ribbon */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-4 print:hidden">
        <div className="space-y-1">
          <Label htmlFor="rcExam" className="text-xs font-semibold">
            Exam:
          </Label>
          <select
            id="rcExam"
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
          <Label htmlFor="rcCls" className="text-xs font-semibold">
            Class:
          </Label>
          <select
            id="rcCls"
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
          <Label htmlFor="rcSec" className="text-xs font-semibold">
            Section:
          </Label>
          <select
            id="rcSec"
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

        <div className="space-y-1">
          <Label htmlFor="rcStud" className="text-xs font-semibold">
            Student:
          </Label>
          <select
            id="rcStud"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {results.map((r) => (
              <option key={r.studentId} value={r.studentId}>
                {r.rollNumber ? `#${r.rollNumber} - ` : ""}{r.studentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Report Card Preview (Print Optimized) */}
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-secondary/80 border border-border/50" />
      ) : !activeResult ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <FileText className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">No report cards available</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Process examination results first from the Result Processing workspace to preview and print report cards.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-white text-slate-900 p-8 shadow-xl print:m-0 print:max-w-none print:border-none print:p-6 print:shadow-none">
          {/* Institutional Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-300 p-1">
                {organization?.logoUrl ? (
                  <img src={organization.logoUrl} alt="Logo" className="size-full object-contain" />
                ) : (
                  <Building2 className="size-8 text-slate-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  {organization?.name || "InSuite Academy"}
                </h2>
                <p className="text-xs text-slate-600">
                  {organization?.address ? `${organization.address}, ` : ""}
                  {organization?.city || ""} {organization?.state || ""} {organization?.postalCode || ""}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Affiliation / Code: {organization?.code || "SCH-001"}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="rounded-md bg-slate-900 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
                Report Card
              </span>
              <p className="mt-1.5 text-xs font-bold text-slate-700">
                Session {selectedSession?.name || "2026-27"}
              </p>
            </div>
          </div>

          {/* Subheader Title */}
          <div className="my-4 text-center">
            <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
              {activeResult.examName}
            </h3>
            {examSettings?.reportCardHeaderNote && (
              <p className="text-[11px] text-slate-600 italic mt-0.5">
                {examSettings.reportCardHeaderNote}
              </p>
            )}
          </div>

          {/* Student Profile Box */}
          <div className="rounded-2xl border border-slate-300 bg-slate-50/80 p-4 text-xs">
            <div className="grid grid-cols-2 gap-y-2 sm:grid-cols-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Student Name</span>
                <p className="font-extrabold text-slate-900">{activeResult.studentName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Class & Section</span>
                <p className="font-bold text-slate-900">
                  {activeResult.className} ({activeResult.sectionName})
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Roll Number</span>
                <p className="font-mono font-bold text-slate-900">{activeResult.rollNumber || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">Admission No / ID</span>
                <p className="font-mono font-bold text-slate-900">
                  {activeResult.admissionNumber || activeResult.studentIdentifier || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-300 bg-slate-100 font-bold uppercase tracking-wider text-slate-700 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-center">Max Marks</th>
                  <th className="px-4 py-3 text-center">Marks Scored</th>
                  <th className="px-4 py-3 text-center">Percentage</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {activeResult.subjectResults.map((s) => (
                  <tr key={s.subjectId}>
                    <td className="px-4 py-3 font-bold text-slate-900">{s.subjectName}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{s.maximumMarks}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {s.absent ? "AB" : s.marksObtained !== null ? s.marksObtained : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-800">{s.percentage}%</td>
                    <td className="px-4 py-3 text-center font-black text-slate-900">{s.grade}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          s.passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
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

          {/* Summary KPI Strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-4 sm:grid-cols-5 text-center text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Total Max</span>
              <p className="font-black text-slate-900">{activeResult.totalMaximum}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Total Scored</span>
              <p className="font-black text-slate-900">{activeResult.totalObtained}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Overall %</span>
              <p className="font-black text-slate-900">{activeResult.percentage}%</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500">Overall Grade</span>
              <p className="font-black text-slate-900">{activeResult.grade}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Result Status</span>
              <p
                className={`font-black uppercase ${
                  activeResult.resultStatus === "Pass" ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {activeResult.resultStatus}
              </p>
            </div>
          </div>

          {/* Footer Remarks & Signatures */}
          <div className="mt-12 grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="h-10" />
              <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-700">
                Class Teacher Signature
              </div>
            </div>

            <div>
              <div className="h-10" />
              <div className="border-t border-dashed border-slate-400 pt-2 font-bold text-slate-700">
                Principal / Head of Institution
              </div>
            </div>
          </div>

          {examSettings?.reportCardFooterNote && (
            <p className="mt-6 text-center text-[10px] text-slate-500">
              {examSettings.reportCardFooterNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
