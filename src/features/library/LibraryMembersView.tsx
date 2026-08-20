import React, { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  BookOpen,
  Receipt,
  User,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  searchLibraryMembers,
  listTransactions,
  listFines,
} from "@/services/libraryService";
import type {
  LibraryMember,
  LibraryTransaction,
  LibraryFine,
} from "@/types/library";
import { Button } from "@/components/ui/button";

export const LibraryMembersView: React.FC = () => {
  const { organization } = useAuth();
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState<"ALL" | "Student" | "Staff">("ALL");

  // Member Detail Modal
  const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null);
  const [memberLoans, setMemberLoans] = useState<LibraryTransaction[]>([]);
  const [memberFines, setMemberFines] = useState<LibraryFine[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const loadMembers = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchLibraryMembers(organization.id);
      setMembers(data);
    } catch (err: any) {
      console.error("loadMembers error:", err);
      setError(err.message || "Failed to load library members.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [organization]);

  const openMemberDetail = async (m: LibraryMember) => {
    if (!organization) return;
    setSelectedMember(m);
    setIsLoadingDetails(true);
    try {
      const [tList, fList] = await Promise.all([
        listTransactions(organization.id, { memberId: m.id }),
        listFines(organization.id),
      ]);
      setMemberLoans(tList);
      setMemberFines(fList.filter((f) => f.memberId === m.id));
    } catch (err) {
      console.error("Member detail load error:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.departmentOrClass.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = memberTypeFilter === "ALL" || m.memberType === memberTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [members, searchQuery, memberTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Library Members & Borrowers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Single-source-of-truth borrower registry linking students and faculty.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3 max-w-xl">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search member name, ID, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={memberTypeFilter}
            onChange={(e) => setMemberTypeFilter(e.target.value as any)}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Borrowers</option>
            <option value="Student">Students Only</option>
            <option value="Staff">Faculty / Staff Only</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadMembers} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <UserCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No library members found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Members are automatically synced when students or faculty are registered in the system.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Borrower Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">ID Number</th>
                <th className="py-3 px-4">Class / Department</th>
                <th className="py-3 px-4">Active Loans</th>
                <th className="py-3 px-4">Unpaid Fines</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.map((m) => (
                <tr key={`${m.memberType}_${m.id}`} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{m.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.memberType === "Student"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                      }`}
                    >
                      {m.memberType === "Student" ? (
                        <GraduationCap className="size-3" />
                      ) : (
                        <Briefcase className="size-3" />
                      )}
                      {m.memberType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-primary">{m.identifier}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.departmentOrClass}</td>
                  <td className="py-3 px-4 font-bold text-foreground">
                    {m.booksIssuedCount} Book(s)
                  </td>
                  <td className="py-3 px-4">
                    {m.activeFinesAmount > 0 ? (
                      <span className="font-bold text-destructive">₹{m.activeFinesAmount}</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">₹0</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMemberDetail(m)}
                      className="h-7 px-2 text-xs"
                    >
                      <Eye className="size-3.5 mr-1" /> Dossier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Dossier Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  {selectedMember.name} ({selectedMember.memberType})
                </h3>
                <p className="text-xs text-muted-foreground">
                  ID: {selectedMember.identifier} • {selectedMember.departmentOrClass}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMember(null)}
                className="rounded-xl text-xs"
              >
                ✕ Close
              </Button>
            </div>

            {isLoadingDetails ? (
              <div className="h-48 rounded-2xl bg-surface animate-pulse" />
            ) : (
              <div className="space-y-6">
                {/* Active Loans */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Currently Borrowed Books
                  </h4>
                  {memberLoans.filter((l) => l.status === "Issued").length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No books currently borrowed.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {memberLoans
                        .filter((l) => l.status === "Issued")
                        .map((loan) => (
                          <div
                            key={loan.id}
                            className="rounded-2xl border border-border bg-surface/50 p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-foreground">{loan.bookTitle}</p>
                              <p className="text-[10px] text-muted-foreground">
                                Acc: {loan.accessionNumber} • Issued: {loan.issuedAt.split("T")[0]}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-primary">Due: {loan.dueAt}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Outstanding Fines */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                    Fines & Penalties
                  </h4>
                  {memberFines.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">No fine records.</p>
                  ) : (
                    <div className="space-y-2">
                      {memberFines.map((f) => (
                        <div
                          key={f.id}
                          className="rounded-2xl border border-border bg-surface/50 p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-foreground">{f.reason}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {f.daysOverdue} days overdue on {f.bookTitle}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-foreground">₹{f.amount}</p>
                            <span
                              className={`text-[9px] font-bold ${
                                f.status === "Paid" ? "text-emerald-600" : "text-destructive"
                              }`}
                            >
                              {f.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
