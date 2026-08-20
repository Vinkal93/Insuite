import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Award,
  Plus,
  Search,
  Filter,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Eye,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listIssuedDocuments, revokeDocument } from "@/services/documentService";
import type { IssuedDocument } from "@/types/document";
import { Button } from "@/components/ui/button";

export const CertificatesListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [documents, setDocuments] = useState<IssuedDocument[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCertificates = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listIssuedDocuments(organization.id, {
        status: statusFilter || undefined,
        search: search || undefined,
      });
      // Filter certificates only (exclude ID cards from this view)
      const certsOnly = list.filter(
        (d) => d.documentTypeName !== "Student ID Card" && d.documentTypeName !== "Staff ID Card"
      );
      setDocuments(certsOnly);
    } catch (err: any) {
      console.error("loadCertificates error:", err);
      setError(err.message || "Failed to load certificates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, [organization, statusFilter, search]);

  const handleRevoke = async (docId: string, docNumber: string) => {
    const reason = prompt(`Enter reason to revoke certificate ${docNumber}:`);
    if (!reason || !organization || !firebaseUser) return;

    try {
      await revokeDocument(organization.id, docId, reason, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      alert(`Certificate ${docNumber} has been revoked.`);
      await loadCertificates();
    } catch (err: any) {
      alert("Failed to revoke: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Issued Certificates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official bonafide, transfer, character, and achievement certificates.
          </p>
        </div>

        <Link
          to="/documents/generate"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Issue New Certificate
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by certificate number, student name, or admission number..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ISSUED">Issued (Valid)</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

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
          <Button onClick={loadCertificates} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Award className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No certificates found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate and issue certificates for students or staff.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Certificate Number</th>
                  <th className="py-3 px-4">Student / Recipient</th>
                  <th className="py-3 px-4">Certificate Type</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/documents/certificates/${d.id}`}
                          className="font-bold text-primary hover:underline text-[11px] flex items-center gap-1"
                        >
                          <Eye className="size-3" /> View / Print
                        </Link>
                        {d.status === "ISSUED" && (
                          <button
                            onClick={() => handleRevoke(d.id, d.documentNumber)}
                            className="font-bold text-rose-600 hover:underline text-[11px] flex items-center gap-0.5 ml-2"
                          >
                            <XCircle className="size-3" /> Revoke
                          </button>
                        )}
                      </div>
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
