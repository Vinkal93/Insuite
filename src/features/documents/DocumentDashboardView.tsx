import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileCheck2,
  CreditCard,
  QrCode,
  ShieldCheck,
  Plus,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Award,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getDocumentDashboardStats,
  listIssuedDocuments,
} from "@/services/documentService";
import type { IssuedDocument, DocumentDashboardStats } from "@/types/document";
import { Button } from "@/components/ui/button";

export const DocumentDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const [stats, setStats] = useState<DocumentDashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<IssuedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [s, docs] = await Promise.all([
        getDocumentDashboardStats(organization.id),
        listIssuedDocuments(organization.id),
      ]);
      setStats(s);
      setRecentDocs(docs.slice(0, 6));
    } catch (err: any) {
      console.error("loadDocumentDashboard error:", err);
      setError(err.message || "Failed to load document dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Certificates & ID Cards
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue verified school certificates, student ID cards, templates, and QR verification.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link
            to="/documents/generate"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus className="size-4" /> Issue Certificate
          </Link>
          <Link
            to="/documents/id-cards/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-card border border-border text-foreground text-xs font-bold hover:border-primary transition-colors"
          >
            <CreditCard className="size-4" /> Generate ID Cards
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadDashboard} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {/* 4 Telemetry Widgets */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Certificates Issued</span>
                <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Award className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.certificatesIssuedCount || 0}
              </p>
              <Link to="/documents/certificates" className="text-[11px] font-bold text-primary hover:underline">
                View All Certificates →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">This Month</span>
                <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <FileCheck2 className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">
                {stats?.certificatesThisMonthCount || 0}
              </p>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Issued in {new Date().toLocaleString("default", { month: "long" })}
              </span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">ID Cards Generated</span>
                <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <CreditCard className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600">
                {stats?.idCardsGeneratedCount || 0}
              </p>
              <Link to="/documents/id-cards" className="text-[11px] font-bold text-primary hover:underline">
                Manage ID Cards →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">QR Verified</span>
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.documentsVerifiedCount || 0}
              </p>
              <span className="text-[11px] text-rose-600 font-semibold">
                Revoked: {stats?.revokedDocumentsCount || 0}
              </span>
            </div>
          </div>

          {/* Recent Issued Documents */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground">Recent Issued Documents</h3>
              <Link to="/documents/issued" className="text-xs font-bold text-primary hover:underline">
                View All Issued Documents →
              </Link>
            </div>

            {recentDocs.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No documents generated yet. Click "Issue Certificate" to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                      <th className="py-3 px-4">Doc Number</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Document Type</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {recentDocs.map((d) => (
                      <tr key={d.id} className="hover:bg-surface/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {d.documentNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground block">{d.personName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {d.personIdentifier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground">{d.documentTypeName}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{d.issueDate}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                              d.status === "ISSUED"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : d.status === "REVOKED"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/documents/certificates/${d.id}`}
                            className="font-bold text-primary hover:underline text-[11px]"
                          >
                            View & Print →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
