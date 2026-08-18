import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  Eye,
  UserCheck,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listParents } from "@/services/parentService";
import type { Parent } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ParentListView: React.FC = () => {
  const { organization } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchParents = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listParents(organization.id, searchQuery);
      setParents(data);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error loading parents:", err);
      setError("Unable to load parent directory. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [organization, searchQuery]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const totalPages = Math.ceil(parents.length / PAGE_SIZE) || 1;
  const paginatedParents = parents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Parent & Guardian Directory</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {parents.length} Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage guardian contacts, occupation profiles, and family links across students.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by Parent Name, Mobile, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border-border bg-surface pl-9 text-xs"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : parents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Users className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-foreground">No parents registered</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Parent profiles are automatically linked and created during student enrollment.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Guardian Name</th>
                    <th className="px-4 py-3">Relation</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Occupation</th>
                    <th className="px-4 py-3">Children</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedParents.map((parent) => (
                    <tr key={parent.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {parent.fullName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {parent.relation}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">{parent.mobile}</td>
                      <td className="px-4 py-3 text-muted-foreground">{parent.email || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{parent.occupation || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                          {parent.childrenIds?.length || 0} Linked
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" asChild className="size-7 rounded-lg">
                          <Link to="/parents/$parentId" params={{ parentId: parent.id }}>
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="grid gap-3 p-4 lg:hidden">
              {paginatedParents.map((parent) => (
                <div key={parent.id} className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-foreground">{parent.fullName}</p>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                        {parent.relation}
                      </span>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {parent.childrenIds?.length || 0} Children
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                    <Phone className="size-3.5 text-primary" /> {parent.mobile}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border">
                    <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
                      <Link to="/parents/$parentId" params={{ parentId: parent.id }}>
                        <Eye className="size-3.5 mr-1" /> View Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(currentPage * PAGE_SIZE, parents.length)} of {parents.length} guardians
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="size-7 rounded-lg"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-2 font-semibold text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="size-7 rounded-lg"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
