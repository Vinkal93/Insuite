import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Save, Eye, Sparkles, Layers } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getDocumentTemplate,
  createDocumentTemplate,
  updateDocumentTemplate,
  compileTemplateVariables,
} from "@/services/documentService";
import type {
  DocumentTemplate,
  DocumentPageSize,
  DocumentOrientation,
  DocumentPersonType,
} from "@/types/document";
import { Button } from "@/components/ui/button";

const APPROVED_VARIABLES = [
  "studentName",
  "admissionNumber",
  "className",
  "sectionName",
  "rollNumber",
  "fatherName",
  "motherName",
  "dateOfBirth",
  "academicSession",
  "issueDate",
  "documentNumber",
  "schoolName",
  "employeeId",
  "designation",
  "department",
];

const SAMPLE_PREVIEW_DATA: Record<string, string> = {
  studentName: "Aarav Sharma",
  admissionNumber: "ADM-2026-0891",
  className: "10",
  sectionName: "A",
  rollNumber: "14",
  fatherName: "Rajesh Sharma",
  motherName: "Sunita Sharma",
  dateOfBirth: "12-05-2010",
  academicSession: "2025-2026",
  issueDate: new Date().toISOString().split("T")[0],
  documentNumber: "INS-CERT-2026-PREVIEW",
  schoolName: "InSuite Global Academy",
  employeeId: "EMP-104",
  designation: "Senior Faculty",
  department: "Science & Mathematics",
};

export const DocumentTemplateEditorView: React.FC = () => {
  const { id } = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const isEditing = Boolean(id && id !== "new");

  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState("BONAFIDE");
  const [personType, setPersonType] = useState<DocumentPersonType>("STUDENT");
  const [pageSize, setPageSize] = useState<DocumentPageSize>("A4");
  const [orientation, setOrientation] = useState<DocumentOrientation>("PORTRAIT");
  const [headerTitle, setHeaderTitle] = useState("BONAFIDE CERTIFICATE");
  const [bodyContent, setBodyContent] = useState(
    `This is to certify that **{{studentName}}**, child of **{{fatherName}}**, is a bonafide student of Class **{{className}} (Section {{sectionName}})** bearing Admission Number **{{admissionNumber}}**.\n\nHis/Her conduct during academic term **{{academicSession}}** has been **Exemplary**.`
  );
  const [footerContent, setFooterContent] = useState("Authorized Signatory • School Seal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);

  useEffect(() => {
    const loadTmpl = async () => {
      if (!organization || !id || id === "new") return;
      setIsLoading(true);
      try {
        const tmpl = await getDocumentTemplate(organization.id, id);
        if (tmpl) {
          setName(tmpl.name);
          setDocumentType(tmpl.documentType);
          setPersonType(tmpl.personType);
          setPageSize(tmpl.pageSize);
          setOrientation(tmpl.orientation);
          setHeaderTitle(tmpl.headerTitle || "");
          setBodyContent(tmpl.bodyContent);
          setFooterContent(tmpl.footerContent || "");
        }
      } catch (err) {
        console.error("loadTemplate error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTmpl();
  }, [organization, id]);

  const insertVariable = (varName: string) => {
    setBodyContent((prev) => `${prev} {{${varName}}}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !name.trim() || !bodyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Omit<DocumentTemplate, "id" | "organizationId" | "createdAt"> = {
        name: name.trim(),
        documentType,
        personType,
        pageSize,
        orientation,
        headerTitle: headerTitle.trim(),
        bodyContent: bodyContent.trim(),
        footerContent: footerContent.trim(),
        status: "ACTIVE",
      };

      if (isEditing && id) {
        await updateDocumentTemplate(organization.id, id, payload, {
          uid: firebaseUser.uid,
          name: userProfile?.name || "Admin",
        });
        alert("Template updated successfully!");
      } else {
        await createDocumentTemplate(organization.id, payload, {
          uid: firebaseUser.uid,
          name: userProfile?.name || "Admin",
        });
        alert("Template created successfully!");
      }

      navigate({ to: "/documents/templates" });
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewCompiled = compileTemplateVariables(bodyContent, SAMPLE_PREVIEW_DATA);

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/documents/templates"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            {isEditing ? "Edit Template" : "Design Document Template"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure layout rules and dynamic variables.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Form */}
        <form onSubmit={handleSave} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1">Template Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Official Bonafide Certificate Standard"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Recipient *</label>
              <select
                value={personType}
                onChange={(e) => setPersonType(e.target.value as DocumentPersonType)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="STUDENT">Student</option>
                <option value="STAFF">Staff / Faculty</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Page Size *</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as DocumentPageSize)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="A4">A4 Sheet</option>
                <option value="CUSTOM_ID">ID Card Size</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Orientation *</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as DocumentOrientation)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="PORTRAIT">Portrait</option>
                <option value="LANDSCAPE">Landscape</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Header Title</label>
            <input
              type="text"
              value={headerTitle}
              onChange={(e) => setHeaderTitle(e.target.value)}
              placeholder="e.g. BONAFIDE CERTIFICATE"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none uppercase font-bold"
            />
          </div>

          {/* Insertable Variables Chips */}
          <div className="space-y-1.5 bg-surface/50 p-3 rounded-2xl border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Sparkles className="size-3 text-primary" /> Click to Insert Dynamic Variable:
            </span>
            <div className="flex flex-wrap gap-1">
              {APPROVED_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-0.5 rounded-lg bg-card border border-border hover:border-primary text-[10px] font-mono text-foreground font-semibold transition-colors"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div>
            <label className="block font-semibold text-foreground mb-1">Body Text Content *</label>
            <textarea
              rows={8}
              required
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              placeholder="Certificate body text with {{variables}}..."
              className="w-full rounded-2xl border border-border bg-surface p-3 text-xs font-mono text-foreground focus:border-primary focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Footer / Signatory Note</label>
            <input
              type="text"
              value={footerContent}
              onChange={(e) => setFooterContent(e.target.value)}
              placeholder="e.g. Authorized Signatory • School Seal"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl text-xs font-bold"
            >
              <Save className="size-3.5 mr-1.5" />
              {isSubmitting ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </form>

        {/* Live Preview Panel */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <Eye className="size-4 text-primary" /> Live Template Preview
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold">
              Preview Mode (Sample Data)
            </span>
          </div>

          {/* Simulated Certificate Sheet */}
          <div className="rounded-2xl border-2 border-dashed border-border bg-surface/40 p-6 space-y-6 font-serif text-xs">
            <div className="text-center space-y-1 border-b border-border pb-4">
              <h4 className="font-sans font-black text-sm text-foreground uppercase tracking-wide">
                {organization?.name || "School of Excellence"}
              </h4>
              <p className="font-sans text-[10px] text-muted-foreground font-bold tracking-widest uppercase text-primary">
                {headerTitle || "CERTIFICATE"}
              </p>
            </div>

            <div className="leading-relaxed whitespace-pre-line text-foreground/90 py-2">
              {previewCompiled}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-[10px] font-sans text-muted-foreground">
              <span>QR Verification Enabled</span>
              <span className="font-bold text-foreground">{footerContent}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
