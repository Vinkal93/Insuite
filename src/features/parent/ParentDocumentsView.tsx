import React, { useState, useEffect } from "react";
import { Award, Printer, Eye, AlertCircle, RefreshCw, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import { listIssuedDocuments } from "@/services/documentService";
import type { IssuedDocument } from "@/types/document";
import { Button } from "@/components/ui/button";

export const ParentDocumentsView: React.FC = () => {
  const { organization } = useAuth();
  const { selectedChild } = useParent();

  const [documents, setDocuments] = useState<IssuedDocument[]>([]);
  const [selectedDocForView, setSelectedDocForView] = useState<IssuedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!organization || !selectedChild) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await listIssuedDocuments(organization.id, {
        personId: selectedChild.id,
        status: "ISSUED",
      });
      setDocuments(list);
    } catch (err: any) {
      console.error("loadParentDocuments error:", err);
      setError(err.message || "Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [organization, selectedChild]);

  const handlePrintModal = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Certificates & Official Documents
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Official school certificates and credentials issued for{" "}
          <span className="font-bold text-foreground">{selectedChild?.fullName}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadDocuments} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Award className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No documents issued</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Certificates issued by the school for {selectedChild?.fullName} will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((d) => (
            <div
              key={d.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {d.documentTypeName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {d.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{d.documentTypeName}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    Cert No: {d.documentNumber}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Issue Date: {d.issueDate}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end">
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => setSelectedDocForView(d)}
                  className="rounded-xl text-[11px] font-bold h-7 px-3"
                >
                  <Eye className="size-3 mr-1" /> View & Print
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Modal */}
      {selectedDocForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-soft w-full max-w-2xl space-y-6 my-8">
            <div className="flex items-center justify-between print:hidden">
              <span className="font-mono text-xs text-muted-foreground">
                Official Document Viewer
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="hero"
                  size="sm"
                  onClick={handlePrintModal}
                  className="rounded-xl text-xs font-bold"
                >
                  <Printer className="size-3.5 mr-1" /> Print / Save PDF
                </Button>
                <button
                  onClick={() => setSelectedDocForView(null)}
                  className="text-xs text-muted-foreground hover:text-foreground font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="border-2 border-border rounded-2xl p-6 space-y-6 text-xs font-serif bg-surface/30">
              <div className="text-center space-y-1 border-b border-border pb-4 font-sans">
                <h3 className="font-black text-base text-foreground uppercase">
                  {organization?.name || "School of Excellence"}
                </h3>
                <p className="text-[11px] font-bold text-primary uppercase">
                  {selectedDocForView.documentTypeName}
                </p>
                <p className="text-[9px] font-mono text-muted-foreground">
                  Doc No: {selectedDocForView.documentNumber} • Date: {selectedDocForView.issueDate}
                </p>
              </div>

              <div className="leading-relaxed whitespace-pre-line text-foreground/90 py-2">
                {selectedDocForView.compiledContent}
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-between font-sans text-[10px]">
                <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
                  <QrCode className="size-5 text-foreground" />
                  <span>Verified Electronic Record</span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-foreground block">
                    {selectedDocForView.issuedBy || "Principal"}
                  </span>
                  <span className="text-muted-foreground">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
