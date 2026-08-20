import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Sliders,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getLibrarySettings,
  updateLibrarySettings,
} from "@/services/libraryService";
import type { LibrarySettingsConfig } from "@/types/library";
import { Button } from "@/components/ui/button";

export const LibrarySettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [studentLimit, setStudentLimit] = useState(3);
  const [staffLimit, setStaffLimit] = useState(6);
  const [loanDuration, setLoanDuration] = useState(14);
  const [maxRenewals, setMaxRenewals] = useState(2);
  const [finePerDay, setFinePerDay] = useState(5);
  const [reservationDays, setReservationDays] = useState(3);
  const [accessionPrefix, setAccessionPrefix] = useState("LIB");
  const [autoGenAccession, setAutoGenAccession] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!organization) return;
      try {
        const conf = await getLibrarySettings(organization.id);
        setStudentLimit(conf.studentLoanLimit);
        setStaffLimit(conf.staffLoanLimit);
        setLoanDuration(conf.defaultLoanDurationDays);
        setMaxRenewals(conf.maxRenewals);
        setFinePerDay(conf.finePerDay);
        setReservationDays(conf.reservationExpiryDays);
        setAccessionPrefix(conf.accessionPrefix || "LIB");
        setAutoGenAccession(conf.autoGenerateAccessionNumber);
      } catch (err: any) {
        console.error("Load library settings error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);
    setSuccess(false);

    setIsSubmitting(true);
    try {
      await updateLibrarySettings(
        organization.id,
        {
          studentLoanLimit: Number(studentLimit),
          staffLoanLimit: Number(staffLimit),
          defaultLoanDurationDays: Number(loanDuration),
          maxRenewals: Number(maxRenewals),
          finePerDay: Number(finePerDay),
          reservationExpiryDays: Number(reservationDays),
          accessionPrefix: accessionPrefix.trim().toUpperCase(),
          autoGenerateAccessionNumber: autoGenAccession,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update library settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Library Circulation & Operational Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure borrowing quotas, loan duration defaults, overdue penalties, and accession numbering formats.
        </p>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Library Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Borrowing Quotas */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Borrowing Limits & Loan Durations
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Student Borrowing Limit (Books) *
              </label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={studentLimit}
                onChange={(e) => setStudentLimit(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Faculty / Staff Borrowing Limit (Books) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={staffLimit}
                onChange={(e) => setStaffLimit(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Default Loan Period (Days) *
              </label>
              <input
                type="number"
                min={1}
                max={90}
                required
                value={loanDuration}
                onChange={(e) => setLoanDuration(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Maximum Renewals Allowed *
              </label>
              <input
                type="number"
                min={0}
                max={10}
                required
                value={maxRenewals}
                onChange={(e) => setMaxRenewals(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Fines & Reservations */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Fines & Hold Rules
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Overdue Fine (₹ Per Day) *
              </label>
              <input
                type="number"
                min={0}
                max={1000}
                required
                value={finePerDay}
                onChange={(e) => setFinePerDay(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Reservation Hold Window (Days) *
              </label>
              <input
                type="number"
                min={1}
                max={30}
                required
                value={reservationDays}
                onChange={(e) => setReservationDays(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Accession Numbering */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Accession Barcoding & Identifiers
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Accession Number Prefix *
              </label>
              <input
                type="text"
                required
                value={accessionPrefix}
                onChange={(e) => setAccessionPrefix(e.target.value)}
                placeholder="e.g. LIB"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="autoGen"
                checked={autoGenAccession}
                onChange={(e) => setAutoGenAccession(e.target.checked)}
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <label htmlFor="autoGen" className="text-xs font-semibold text-foreground cursor-pointer">
                Auto-generate collision-safe accession numbers sequentially
              </label>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Saving..." : "Save Library Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
};
