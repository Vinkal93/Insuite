import React, { useState, useEffect } from "react";
import {
  Bookmark,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BookOpen,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listReservations,
  reserveBook,
  cancelReservation,
  listBooks,
  searchLibraryMembers,
} from "@/services/libraryService";
import type {
  LibraryReservation,
  LibraryBook,
  LibraryMember,
} from "@/types/library";
import { Button } from "@/components/ui/button";

export const ReservationsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [reservations, setReservations] = useState<LibraryReservation[]>([]);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberType, setMemberType] = useState<"Student" | "Staff">("Student");
  const [isReserving, setIsReserving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [resList, bList, mList] = await Promise.all([
        listReservations(organization.id),
        listBooks(organization.id),
        searchLibraryMembers(organization.id),
      ]);
      setReservations(resList);
      setBooks(bList);
      setMembers(mList);
    } catch (err: any) {
      console.error("loadReservations error:", err);
      setError(err.message || "Failed to load reservations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!selectedBookId || !selectedMemberId) {
      setModalError("Please select both a book title and a member.");
      return;
    }

    setIsReserving(true);
    try {
      await reserveBook(
        organization.id,
        {
          bookId: selectedBookId,
          memberType,
          memberId: selectedMemberId,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to reserve book.");
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      await cancelReservation(organization.id, id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to cancel reservation: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Book Hold & Reservation Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage advance reservation queues for high-demand titles.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => {
            setSelectedBookId(books[0]?.id || "");
            setSelectedMemberId(members[0]?.id || "");
            setModalError(null);
            setShowModal(true);
          }}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Reserve Book
        </Button>
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Bookmark className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No active reservations</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Members can reserve unavailable books to enter the automated queue.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Queue Position</th>
                <th className="py-3 px-4">Reserved Date</th>
                <th className="py-3 px-4">Expires On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{r.bookTitle}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{r.memberName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.memberType}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-primary">#{r.queuePosition}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.reservedAt.split("T")[0]}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.expiresAt.split("T")[0]}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        r.status === "Pending"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : r.status === "Ready"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {r.status === "Pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelReservation(r.id)}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="size-3.5 mr-1" /> Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Place Book Hold / Reservation</h3>

            {modalError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Book Title *
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} (by {b.authorName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Member Type *
                </label>
                <select
                  value={memberType}
                  onChange={(e) => setMemberType(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Student">Student</option>
                  <option value="Staff">Faculty / Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Member *
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {members
                    .filter((m) => m.memberType === memberType)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.identifier})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isReserving}
                  className="rounded-xl text-xs font-bold"
                >
                  {isReserving ? "Placing Hold..." : "Confirm Hold"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
