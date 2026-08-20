import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listDocumentTemplates,
  issueDocument,
} from "@/services/documentService";
import { getSchoolClasses, getSections, getClassStudents } from "@/services/academicService";
import type { DocumentTemplate } from "@/types/document";
import type { AcademicClass, AcademicSection, StudentEnrollment } from "@/types/academic";
import { Button } from "@/components/ui/button";

export const GenerateIdCardsView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    const loadClassesAndTemplates = async () => {
      if (!organization) return;
      try {
        const [cls, tmpls] = await Promise.all([
          getSchoolClasses(organization.id),
          listDocumentTemplates(organization.id, { documentType: "STUDENT_ID" }),
        ]);
        setClasses(cls);
        setTemplates(tmpls);
        if (tmpls.length > 0) setSelectedTemplateId(tmpls[0].id);
        if (cls.length > 0) setSelectedClassId(cls[0].id);
      } catch (err) {
        console.error("loadClasses error:", err);
      }
    };
    loadClassesAndTemplates();
  }, [organization]);

  useEffect(() => {
    const loadSecs = async () => {
      if (!organization || !selectedClassId) return;
      try {
        const secs = await getSections(organization.id, selectedClassId);
        setSections(secs);
        if (secs.length > 0) setSelectedSectionId(secs[0].id);
      } catch (err) {
        console.error("loadSections error:", err);
      }
    };
    loadSecs();
  }, [organization, selectedClassId]);

  // Load students for selected class
  useEffect(() => {
    const loadStudents = async () => {
      if (!organization || !selectedClassId) return;
      setIsLoadingStudents(true);
      try {
        const list = await getClassStudents(organization.id, selectedClassId);
        const filtered = selectedSectionId
          ? list.filter((s) => s.sectionId === selectedSectionId)
          : list;
        setStudents(filtered);
        setSelectedStudentIds(filtered.map((s) => s.id));
      } catch (err) {
        console.error("loadClassStudents error:", err);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    loadStudents();
  }, [organization, selectedClassId, selectedSectionId]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkGenerate = async () => {
    if (!organization || !firebaseUser || !selectedTemplateId || selectedStudentIds.length === 0) {
      return;
    }

    const cls = classes.find((c) => c.id === selectedClassId);
    const sec = sections.find((s) => s.id === selectedSectionId);
    const tmpl = templates.find((t) => t.id === selectedTemplateId);

    if (
      !confirm(
        `Generate identity cards for ${selectedStudentIds.length} students in Class ${cls?.name || ""}?`
      )
    ) {
      return;
    }

    setIsGenerating(true);
    let successCount = 0;
    try {
      for (const studentId of selectedStudentIds) {
        const s = students.find((x) => x.id === studentId);
        if (!s) continue;

        await issueDocument(
          organization.id,
          {
            documentTypeId: "student-id-type",
            documentTypeName: "Student ID Card",
            templateId: selectedTemplateId,
            templateName: tmpl?.name,
            personType: "STUDENT",
            personId: s.studentId || s.id,
            personName: s.studentName,
            personIdentifier: s.admissionNumber,
            className: cls?.name || "",
            sectionName: sec?.name || "",
            variables: {
              studentName: s.studentName,
              admissionNumber: s.admissionNumber,
              className: cls?.name || "",
              sectionName: sec?.name || "",
              rollNumber: s.rollNumber || "",
              academicSession: "2025-2026",
            },
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
        successCount++;
      }

      alert(`Successfully generated ${successCount} student ID cards!`);
      navigate({ to: "/documents/id-cards" });
    } catch (err: any) {
      alert("Bulk generation error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/documents/id-cards"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Bulk Generate Student ID Cards
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue official identity badges by class and section.
          </p>
        </div>
      </div>

      {/* Class & Section Selection */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <h3 className="font-extrabold text-sm text-foreground">Select Target Class Roster</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block font-semibold text-foreground mb-1">Class *</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Card Template *</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student Selection Roster */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="selectAll"
              checked={
                students.length > 0 && selectedStudentIds.length === students.length
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary size-4"
            />
            <label htmlFor="selectAll" className="font-extrabold text-foreground cursor-pointer">
              Select All Enrolled Students ({students.length})
            </label>
          </div>

          <span className="font-mono font-bold text-primary">
            {selectedStudentIds.length} Selected
          </span>
        </div>

        {isLoadingStudents ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
            No enrolled students found in this class.
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
            {students.map((s) => (
              <div
                key={s.id}
                onClick={() => handleToggleOne(s.id)}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                  selectedStudentIds.includes(s.id)
                    ? "bg-primary/5 font-semibold"
                    : "hover:bg-surface/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() => {}}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <div>
                    <span className="text-foreground block">{s.studentName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Adm: {s.admissionNumber} • Roll: {s.rollNumber || "—"}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground font-mono">
                  {s.status || "Active"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            variant="hero"
            size="sm"
            onClick={handleBulkGenerate}
            disabled={isGenerating || selectedStudentIds.length === 0 || !selectedTemplateId}
            className="rounded-xl text-xs font-bold"
          >
            <Sparkles className="size-3.5 mr-1.5" />
            {isGenerating
              ? "Generating ID Cards..."
              : `Generate ${selectedStudentIds.length} ID Cards`}
          </Button>
        </div>
      </div>
    </div>
  );
};
