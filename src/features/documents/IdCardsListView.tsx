import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  QrCode,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listIssuedDocuments } from "@/services/documentService";
import type { IssuedDocument } from "@/types/document";
import { Button } from "@/components/ui/button";

export const IdCardsListView: React.FC = () => {
  const { organization } = useAuth();
  const [idCards, setIdCards] = useState<IssuedDocument[]>([]);
  const [search, setSearch] = useState("");
  const [personTypeFilter, setPersonTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIdCards = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listIssuedDocuments(organization.id, {
        personType: personTypeFilter || undefined,
        search: search || undefined,
      });
      const cardsOnly = list.filter(
        (d) => d.documentTypeName === "Student ID Card" || d.documentTypeName === "Staff ID Card"
      );
      setIdCards(cardsOnly);
    } catch (err: any) {
      console.error("loadIdCards error:", err);
      setError(err.message || "Failed to load ID cards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIdCards();
  }, [organization, personTypeFilter, search]);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Identity Cards (ID Cards)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Student and faculty identification badges with QR verification codes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link
            to="/documents/id-cards/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus className="size-4" /> Bulk Generate ID Cards
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintAll}
            disabled={idCards.length === 0}
            className="rounded-2xl text-xs font-bold"
          >
            <Printer className="size-3.5 mr-1.5" /> Print Sheet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by card number, student/staff name, or admission number..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={personTypeFilter}
          onChange={(e) => setPersonTypeFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All ID Cards</option>
          <option value="STUDENT">Student ID Cards</option>
          <option value="STAFF">Staff ID Cards</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadIdCards} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : idCards.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <CreditCard className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No ID cards generated</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate student or faculty identity cards.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {idCards.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border-2 border-border bg-card p-5 shadow-soft space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                    {organization?.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <span className="font-extrabold text-[11px] text-foreground block truncate max-w-[140px]">
                      {organization?.name || "Academy"}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {c.documentTypeName}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-primary/10 text-primary font-mono">
                  {c.documentNumber}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex items-center gap-3 py-1">
                <div className="size-16 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center font-bold text-xl shrink-0 border border-border">
                  {c.personName.charAt(0)}
                </div>

                <div className="space-y-0.5 text-xs truncate">
                  <span className="font-black text-foreground block truncate">{c.personName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    ID: {c.personIdentifier}
                  </span>
                  {c.className && (
                    <span className="text-[10px] text-foreground font-semibold block">
                      Class: {c.className} - {c.sectionName}
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground block font-mono">
                    Valid: {c.academicSessionName || "2025-2026"}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                  <QrCode className="size-3 text-foreground" /> Verified Badge
                </div>

                <Link
                  to={`/documents/certificates/${c.id}`}
                  className="font-bold text-primary hover:underline text-[10px] flex items-center gap-1"
                >
                  <Eye className="size-3" /> Full View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
