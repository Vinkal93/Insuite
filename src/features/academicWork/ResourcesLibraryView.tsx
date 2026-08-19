import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  ExternalLink,
  Paperclip,
  UploadCloud,
  FileText,
  Video,
  Presentation,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { academicResourceSchema, type AcademicResourceInput } from "@/schemas";
import {
  getAcademicResources,
  createAcademicResource,
  deleteAcademicResource,
  getSchoolClasses,
  getSubjects,
} from "@/services";
import type { AcademicResource, ResourceCategory, SchoolClass, Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const ResourcesLibraryView: React.FC = () => {
  const { organization, selectedSession, firebaseUser, userProfile } = useAuth();
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const form = useForm<AcademicResourceInput>({
    resolver: zodResolver(academicResourceSchema),
    defaultValues: {
      title: "",
      description: "",
      classId: "",
      subjectId: "",
      category: "Notes",
      externalUrl: "",
    },
  });

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [resList, cls, subjs] = await Promise.all([
        getAcademicResources(organization.id, {
          category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        }),
        getSchoolClasses(organization.id, selectedSession?.id),
        getSubjects(organization.id),
      ]);
      setResources(resList);
      setClasses(cls);
      setSubjects(subjs);
    } catch (err: any) {
      setError(err.message || "Unable to load resources.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedCategory]);

  const onSaveSubmit = async (data: AcademicResourceInput) => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createAcademicResource(
        organization.id,
        data,
        selectedFile || undefined,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Academic resource uploaded successfully.");
      setIsModalOpen(false);
      setSelectedFile(null);
      form.reset();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to upload resource.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (res: AcademicResource) => {
    if (!organization || !firebaseUser) return;
    if (!confirm(`Delete resource "${res.title}"?`)) return;
    setDeletingId(res.id);
    try {
      await deleteAcademicResource(
        organization.id,
        res.id,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg(`Resource "${res.title}" deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to delete resource.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredResources = resources.filter((r) => {
    const match =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.className?.toLowerCase().includes(searchTerm.toLowerCase());
    return match;
  });

  const categories: Array<ResourceCategory | "ALL"> = [
    "ALL",
    "Notes",
    "Worksheets",
    "PDF",
    "Presentation",
    "Video Link",
    "Reference",
    "Other",
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Academic Resource Library
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Central repository of teaching materials, presentations, worksheets, and lecture notes.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1" /> Add Resource
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="flex rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources by title, subject..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>
      </div>

      {/* Resources Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="mx-auto size-7 animate-spin text-primary" />
          <p className="mt-2 text-xs font-semibold">Loading resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground shadow-soft">
          <FolderKanban className="mx-auto size-9 opacity-40" />
          <p className="mt-2 text-xs font-semibold">No academic resources found.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 rounded-xl text-xs"
          >
            + Upload First Resource
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft flex flex-col justify-between hover:border-primary/50 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold text-primary uppercase">
                    {res.category}
                  </span>
                  {res.className && (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {res.className}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-foreground line-clamp-1">{res.title}</h3>
                {res.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{res.description}</p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                <div className="text-[10px] text-muted-foreground">
                  <p className="font-semibold text-foreground">{res.subjectName || "General"}</p>
                  <p>By {res.uploadedByName || "Teacher"}</p>
                </div>

                <div className="flex items-center gap-1">
                  {res.downloadUrl && (
                    <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
                      <a href={res.downloadUrl} target="_blank" rel="noreferrer">
                        <Download className="size-3.5 text-primary" />
                      </a>
                    </Button>
                  )}
                  {res.externalUrl && (
                    <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
                      <a href={res.externalUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5 text-blue-500" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === res.id}
                    onClick={() => handleDelete(res)}
                    className="size-8 rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Add Academic Resource
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload worksheets, slides, or share study reference links with students.
            </p>

            <form onSubmit={form.handleSubmit(onSaveSubmit)} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Resource Title *</Label>
                <Input
                  placeholder="e.g. Unit 3 Trigonometry Reference Notes"
                  {...form.register("title")}
                  className="rounded-xl border-border bg-surface text-xs font-bold"
                />
                {form.formState.errors.title && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <select
                    {...form.register("category")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Notes">Notes</option>
                    <option value="Worksheets">Worksheets</option>
                    <option value="PDF">PDF Guide</option>
                    <option value="Presentation">Presentation (PPT)</option>
                    <option value="Video Link">Video Link</option>
                    <option value="Reference">Reference Material</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Subject (Optional)</Label>
                  <select
                    {...form.register("subjectId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- All Subjects --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Upload Document / File</Label>
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">External Video / Web URL (Optional)</Label>
                <Input
                  placeholder="https://..."
                  {...form.register("externalUrl")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Brief description or chapter syllabus..."
                  {...form.register("description")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSaving}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                  Save Resource
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
