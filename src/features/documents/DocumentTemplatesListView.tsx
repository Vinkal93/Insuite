import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Layers, Plus, Edit2, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listDocumentTemplates } from "@/services/documentService";
import type { DocumentTemplate } from "@/types/document";
import { Button } from "@/components/ui/button";

export const DocumentTemplatesListView: React.FC = () => {
  const { organization } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listDocumentTemplates(organization.id);
      setTemplates(list);
    } catch (err: any) {
      console.error("loadDocumentTemplates error:", err);
      setError(err.message || "Failed to load templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Document & Certificate Templates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure certificate layouts, dynamic variable placeholders, and card formats.
          </p>
        </div>

        <Link
          to="/documents/templates/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Create New Template
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadTemplates} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Layers className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No templates configured</h3>
          <p className="mt-1 text-xs text-muted-foreground">Create a template to issue certificates.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {t.personType} • {t.pageSize}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      t.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{t.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    Type: {t.documentType} ({t.orientation})
                  </p>
                </div>

                <div className="bg-surface/50 p-3 rounded-2xl border border-border text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                  {t.bodyContent}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end">
                <Link
                  to={`/documents/templates/${t.id}/edit`}
                  className="font-bold text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Edit2 className="size-3" /> Edit Template
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
