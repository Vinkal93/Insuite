import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  renderTemplate,
  DEFAULT_TEMPLATES,
} from "@/services/communicationService";
import type { CommunicationTemplate, TemplateCategory, CommunicationChannel } from "@/types/communication";
import { templateSchema, type TemplateInput } from "@/schemas/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const APPROVED_VARIABLES = [
  "studentName",
  "parentName",
  "className",
  "sectionName",
  "amount",
  "dueDate",
  "examName",
  "attendanceDate",
  "schoolName",
];

export const TemplatesListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CommunicationTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      category: "General",
      channel: "IN_APP",
      subject: "",
      body: "",
      variables: [],
      status: "Active",
    },
  });

  const loadTemplates = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTemplates(organization.id);
      setTemplates(data);
    } catch (err: any) {
      console.error("Error loading templates:", err);
      setError(err.message || "Failed to load communication templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [organization]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    form.reset({
      name: "",
      category: "General",
      channel: "IN_APP",
      subject: "",
      body: "",
      variables: [],
      status: "Active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: CommunicationTemplate) => {
    setEditingTemplate(t);
    form.reset({
      name: t.name,
      category: t.category,
      channel: t.channel,
      subject: t.subject,
      body: t.body,
      variables: t.variables,
      status: t.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (data: TemplateInput) => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    try {
      if (editingTemplate) {
        await updateTemplate(organization.id, editingTemplate.id, data, {
          uid: firebaseUser.uid,
          name: userProfile?.name || "Admin",
        });
      } else {
        await createTemplate(organization.id, data, {
          uid: firebaseUser.uid,
          name: userProfile?.name || "Admin",
        });
      }
      setIsModalOpen(false);
      await loadTemplates();
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(organization.id, id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadTemplates();
    } catch (err: any) {
      alert("Failed to delete template: " + err.message);
    }
  };

  const insertVariable = (variable: string) => {
    const currentBody = form.getValues("body") || "";
    form.setValue("body", currentBody + ` {{${variable}}}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Communication Templates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create standard reusable message formats with approved variable placeholders.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={openCreateModal}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-10 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadTemplates} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Layers className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No Templates Created</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create standard message templates for fee reminders, exam results, and attendance alerts.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="mt-4 rounded-xl text-xs"
          >
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary uppercase">
                    {t.channel}
                  </span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                    {t.category}
                  </span>
                </div>
                <h3 className="text-sm font-black text-foreground">{t.name}</h3>
                <p className="text-xs font-bold text-foreground/80 line-clamp-1">{t.subject}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-3 bg-surface p-2.5 rounded-xl border border-border">
                  {t.body}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(t)}
                  className="h-7 px-2 text-xs"
                >
                  <Eye className="size-3.5 mr-1 text-muted-foreground" /> Preview
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(t)}
                    className="h-7 px-2 text-xs"
                  >
                    <Edit className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(t.id)}
                    className="h-7 px-2 text-xs text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Template Name *</Label>
              <Input {...form.register("name")} placeholder="e.g. Fee Due Notice" className="h-9 text-xs rounded-xl" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Category *</Label>
                <select
                  {...form.register("category")}
                  className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground"
                >
                  <option value="Fees">Fees</option>
                  <option value="Admissions">Admissions</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Exams">Exams</option>
                  <option value="General">General</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Channel *</Label>
                <select
                  {...form.register("channel")}
                  className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground"
                >
                  <option value="IN_APP">In-App</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Subject Line *</Label>
              <Input {...form.register("subject")} placeholder="Subject template..." className="h-9 text-xs rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Message Content *</Label>
                <span className="text-[10px] text-muted-foreground">Click variable tag to insert</span>
              </div>
              <div className="flex flex-wrap gap-1 pb-1.5">
                {APPROVED_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    +{v}
                  </button>
                ))}
              </div>
              <textarea
                {...form.register("body")}
                rows={4}
                placeholder="Template text with {{variables}}..."
                className="w-full rounded-xl border border-input bg-surface p-3 text-xs font-medium text-foreground"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="hero" size="sm" disabled={isSaving} className="rounded-xl text-xs font-bold shadow-soft">
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : "Save Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Template Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3 pt-2">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[10px] text-amber-800 font-semibold">
                Note: Preview demonstrates variable substitution with sample values.
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 text-xs">
                <p className="font-bold text-foreground">
                  Subject:{" "}
                  {renderTemplate(previewTemplate.subject, {
                    studentName: "Aarav Sharma",
                    parentName: "Mr. Rajesh Sharma",
                    className: "Class 10",
                    amount: "4,500",
                    dueDate: "2026-09-01",
                    examName: "Term 1 Examination",
                  })}
                </p>
                <div className="border-t border-border pt-2 text-muted-foreground whitespace-pre-wrap">
                  {renderTemplate(previewTemplate.body, {
                    studentName: "Aarav Sharma",
                    parentName: "Mr. Rajesh Sharma",
                    className: "Class 10",
                    sectionName: "A",
                    amount: "4,500",
                    dueDate: "2026-09-01",
                    examName: "Term 1 Examination",
                    schoolName: organization?.name || "InSuite Academy",
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button size="sm" onClick={() => setPreviewTemplate(null)} className="rounded-xl text-xs">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
