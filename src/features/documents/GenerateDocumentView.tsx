import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listDocumentTypes,
  listDocumentTemplates,
  issueDocument,
} from "@/services/documentService";
import { listStudents } from "@/services/studentService";
import { listStaff } from "@/services/hrService";
import type { DocumentType, DocumentTemplate } from "@/types/document";
import type { Student } from "@/types/student";
import type { Staff } from "@/types/staff";
import { Button } from "@/components/ui/button";

export const GenerateDocumentView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [personType, setPersonType] = useState<"STUDENT" | "STAFF">("STUDENT");
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Student | Staff | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTypesAndTemplates = async () => {
      if (!organization) return;
      setIsLoading(true);
      try {
        const [dtList, tmplList] = await Promise.all([
          listDocumentTypes(organization.id),
          listDocumentTemplates(organization.id),
        ]);
        setDocTypes(dtList);
        setTemplates(tmplList);

        const defaultDt = dtList.find((d) => d.personType === personType);
        if (defaultDt) setSelectedTypeId(defaultDt.id);
      } catch (err) {
        console.error("loadTypes error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTypesAndTemplates();
  }, [organization, personType]);

  // Search persons
  useEffect(() => {
    const fetchPersons = async () => {
      if (!organization || !searchQuery.trim()) {
        setStudents([]);
        setStaffList([]);
        return;
      }
      try {
        if (personType === "STUDENT") {
          const res = await listStudents(organization.id, { search: searchQuery });
          setStudents(res.students.slice(0, 8));
        } else {
          const res = await listStaff(organization.id);
          const q = searchQuery.toLowerCase();
          setStaffList(
            res
              .filter(
                (s) =>
                  s.fullName.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q)
              )
              .slice(0, 8)
          );
        }
      } catch (err) {
        console.error("searchPersons error:", err);
      }
    };
    fetchPersons();
  }, [organization, searchQuery, personType]);

  // Filter templates matching selected person type
  const matchingTemplates = templates.filter((t) => t.personType === personType);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !selectedPerson || !selectedTemplateId) return;

    const docType = docTypes.find((d) => d.id === selectedTypeId);
    const tmpl = templates.find((t) => t.id === selectedTemplateId);

    setIsSubmitting(true);
    try {
      let variables: Record<string, string | number | undefined> = {};
      let personName = "";
      let personIdentifier = "";
      let className = "";
      let sectionName = "";
      let academicSessionName = "";

      if (personType === "STUDENT") {
        const s = selectedPerson as Student;
        personName = s.fullName;
        personIdentifier = s.admissionNumber;
        className = s.academic?.className || "";
        sectionName = s.academic?.sectionName || "";
        academicSessionName = s.academic?.sessionName || "2025-2026";

        variables = {
          studentName: s.fullName,
          admissionNumber: s.admissionNumber,
          className: s.academic?.className || "",
          sectionName: s.academic?.sectionName || "",
          rollNumber: s.academic?.rollNumber || "",
          fatherName: s.family?.fatherName || "—",
          motherName: s.family?.motherName || "—",
          dateOfBirth: s.personal?.dob || "—",
          academicSession: academicSessionName,
        };
      } else {
        const st = selectedPerson as Staff;
        personName = st.fullName;
        personIdentifier = st.employeeId;

        variables = {
          staffName: st.fullName,
          employeeId: st.employeeId,
          designation: st.designation || "Faculty",
          department: st.department || "Academics",
        };
      }

      const issued = await issueDocument(
        organization.id,
        {
          documentTypeId: selectedTypeId,
          documentTypeName: docType?.name || "Official Certificate",
          templateId: selectedTemplateId,
          templateName: tmpl?.name,
          personType,
          personId: selectedPerson.id,
          personName,
          personIdentifier,
          className,
          sectionName,
          academicSessionName,
          variables,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      alert(`Certificate ${issued.documentNumber} issued successfully!`);
      navigate({ to: `/documents/certificates/${issued.id}` });
    } catch (err: any) {
      alert("Failed to issue document: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/documents/certificates"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Issue Certificate</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a verified student or staff member and generate a formal institutional certificate.
          </p>
        </div>
      </div>

      <form onSubmit={handleIssue} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5 text-xs">
        {/* Recipient Type */}
        <div>
          <label className="block font-semibold text-foreground mb-1">Recipient Category *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setPersonType("STUDENT");
                setSelectedPerson(null);
              }}
              className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all text-center ${
                personType === "STUDENT"
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              Enrolled Student
            </button>

            <button
              type="button"
              onClick={() => {
                setPersonType("STAFF");
                setSelectedPerson(null);
              }}
              className={`p-3.5 rounded-2xl border text-xs font-extrabold transition-all text-center ${
                personType === "STAFF"
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              Faculty / Staff Member
            </button>
          </div>
        </div>

        {/* Person Selector */}
        <div className="space-y-2">
          <label className="block font-semibold text-foreground">
            Search & Select {personType === "STUDENT" ? "Student" : "Staff Member"} *
          </label>
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search by name, ${personType === "STUDENT" ? "admission number, class" : "employee ID"}...`}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-border bg-surface text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Search Results Dropdown */}
          {personType === "STUDENT" && students.length > 0 && (
            <div className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border shadow-sm max-h-48 overflow-y-auto">
              {students.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedPerson(s);
                    setSearchQuery(s.fullName);
                    setStudents([]);
                  }}
                  className="p-3 hover:bg-surface/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-foreground block">{s.fullName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Adm: {s.admissionNumber} • Class: {s.academic?.className} (
                      {s.academic?.sectionName})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-primary">Select →</span>
                </div>
              ))}
            </div>
          )}

          {personType === "STAFF" && staffList.length > 0 && (
            <div className="border border-border rounded-2xl bg-card overflow-hidden divide-y divide-border shadow-sm max-h-48 overflow-y-auto">
              {staffList.map((st) => (
                <div
                  key={st.id}
                  onClick={() => {
                    setSelectedPerson(st);
                    setSearchQuery(st.fullName);
                    setStaffList([]);
                  }}
                  className="p-3 hover:bg-surface/50 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-foreground block">{st.fullName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Emp ID: {st.employeeId} • {st.designation}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-primary">Select →</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected Badge */}
          {selectedPerson && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>
                  Selected: <strong>{selectedPerson.fullName}</strong> (
                  {personType === "STUDENT"
                    ? (selectedPerson as Student).admissionNumber
                    : (selectedPerson as Staff).employeeId}
                  )
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPerson(null)}
                className="text-[10px] font-bold text-rose-600 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Certificate Type & Template Selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Certificate Type *</label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {docTypes
                .filter((d) => d.personType === personType)
                .map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">
              Document Template *
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              required
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
            >
              <option value="">Select Template...</option>
              {matchingTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.documentType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !selectedPerson || !selectedTemplateId}
            className="rounded-xl text-xs font-bold"
          >
            <Sparkles className="size-3.5 mr-1.5" />
            {isSubmitting ? "Generating Certificate..." : "Generate & Issue Certificate"}
          </Button>
        </div>
      </form>
    </div>
  );
};
