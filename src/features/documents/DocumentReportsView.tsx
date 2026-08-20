import React, { useState, useEffect } from "react";
import { FileText, Download, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listIssuedDocuments } from "@/services/documentService";
import type { IssuedDocument } from "@/types/document";
import { Button } from "@/components/ui/button";

export const DocumentReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [documents, setDocuments] = useState<IssuedDocument[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listIssuedDocuments(organization.id, {
        status: selectedStatus || undefined,
      });
      const filtered = selectedType
        ? list.filter((d) => d.documentTypeName === selectedType)
        : list;
      setDocuments(filtered);
    } catch (err: any) {
      console.error("loadDocumentReports error:", err);
      setError(err.message || "Failed to load document reports.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [organization, selectedType, selectedStatus]);

  const handleExportCSV = () => {
    if (documents.length === 0) return;
    const headers = "DocumentNumber,RecipientName,PersonType,Identifier,DocumentType,IssueDate,Status,IssuedBy\n";
    const rows = documents
      .map(
        (d) =>
          `"${d.documentNumber}","${d.personName}","${d.personType}","${d.personIdentifier}","${d.documentTypeName}","${d.issueDate}","${d.status}","${d.issuedBy}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Issued_Documents_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Document Issuance Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail of issued student certificates, staff credentials, and verification logs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={documents.length === 0}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Download className="size-3.5 mr-1.5" /> Export CSV Report
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "ISSUED", "REVOKED"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedStatus === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? st : "All Statuses"} ({st ? documents.filter((d) => d.status === st).length : documents.length})
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadReports} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No records found</h3>
          <p className="mt-1 text-xs text-muted-foreground">No documents matching selected filters.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Document Number</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Issued By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {d.documentNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{d.personName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {d.personType}: {d.personIdentifier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold">{d.documentTypeName}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{d.issueDate}</td>
                    <td className="py-3 px-4 text-muted-foreground">{d.issuedBy}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          d.status === "ISSUED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
