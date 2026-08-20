import React, { useState, useEffect } from "react";
import { BookMarked, Clock, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { listTransactions, renewBook } from "@/services/libraryService";
import type { LibraryTransaction } from "@/types/library";
import { Button } from "@/components/ui/button";

export const StudentLibraryView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const { student } = useStudent();

  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = async () => {
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await listTransactions(organization.id, { memberId: student.id });
      setTransactions(list);
    } catch (err: any) {
      console.error("loadStudentLibrary error:", err);
      setError(err.message || "Failed to load library records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [organization, student]);

  const handleRenew = async (txnId: string) => {
    if (!organization || !firebaseUser) return;
    try {
      await renewBook(organization.id, txnId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || student?.fullName || "Student",
      });
      alert("Book renewed successfully!");
      await loadLibrary();
    } catch (err: any) {
      alert("Renewal failed: " + err.message);
    }
  };

  const activeBooks = transactions.filter((t) => t.status === "ISSUED" || t.status === "OVERDUE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Library Books & Borrowings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Currently borrowed volumes, return deadlines, and library borrowing history.
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
          <Button onClick={loadLibrary} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Borrowed Books */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">
              Currently Borrowed Books ({activeBooks.length})
            </h3>

            {activeBooks.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                You do not have any library books currently issued.
              </div>
            ) : (
              <div className="space-y-3">
                {activeBooks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-foreground">{t.bookTitle}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            t.status === "OVERDUE"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        Acc #: {t.accessionNumber} • Due Date: {t.dueDate}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRenew(t.id)}
                      className="rounded-xl text-xs font-bold self-start sm:self-center"
                    >
                      <RefreshCw className="size-3 mr-1" /> Renew Book
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Borrowing History */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Borrowing History</h3>

            {transactions.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No borrowing history on record.
              </div>
            ) : (
              <div className="divide-y divide-border text-xs">
                {transactions.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{t.bookTitle}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Issued: {t.issueDate} • Returned: {t.returnDate || "In Possession"}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
