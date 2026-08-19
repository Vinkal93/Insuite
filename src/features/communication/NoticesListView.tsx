import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Archive,
  RefreshCw,
  AlertCircle,
  Printer,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listNotices,
  publishNotice,
  archiveNotice,
} from "@/services/communicationService";
import type { Notice } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const NoticesListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadNotices = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listNotices(organization.id, {
        category: categoryFilter,
        status: statusFilter,
      });
      setNotices(data);
    } catch (err: any) {
      console.error("Error loading notices:", err);
      setError(err.message || "Failed to load formal notices.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [organization, categoryFilter, statusFilter]);

  const handlePublish = async (id: string) => {
    if (!organization || !firebaseUser) return;
    setProcessingId(id);
    try {
      await publishNotice(organization.id, id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadNotices();
    } catch (err: any) {
      alert("Failed to publish notice: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to archive this notice?")) return;
    setProcessingId(id);
    try {
      await archiveNotice(organization.id, id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadNotices();
    } catch (err: any) {
      alert("Failed to archive notice: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.noticeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Formal Institutional Notices
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official administrative circulars, holiday memos, fee notifications, and signed orders.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/communication/notices/new">
            <Plus className="size-3.5 mr-1.5" /> Issue Notice
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by notice number or title..."
              className="h-9 pl-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Holiday">Holiday</option>
              <option value="Exam">Exam</option>
              <option value="Fee">Fee</option>
              <option value="Attendance">Attendance</option>
              <option value="Event">Event</option>
              <option value="General">General</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notices Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-10 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadNotices} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <FileText className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No Notices Found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            No institutional notices match the selected category or filters.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/communication/notices/new">Issue First Notice</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Notice Number</th>
                  <th className="px-4 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Audience</th>
                  <th className="px-4 py-3.5">Publish Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredNotices.map((n) => (
                  <tr key={n.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-primary">
                      {n.noticeNumber}
                    </td>
                    <td className="px-4 py-3.5 max-w-[260px]">
                      <p className="font-bold text-foreground truncate">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground">Issued by: {n.issuedBy}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {n.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{n.audienceType}</td>
                    <td className="px-4 py-3.5 font-mono text-muted-foreground">{n.publishDate}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          n.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : n.status === "Draft"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link to="/communication/notices/$id" params={{ id: n.id }}>
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>
                        {n.status === "Draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(n.id)}
                            disabled={processingId === n.id}
                            className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <CheckCircle className="size-3.5" />
                          </Button>
                        )}
                        {n.status !== "Archived" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(n.id)}
                            disabled={processingId === n.id}
                            className="h-7 px-2 text-xs text-rose-500 hover:bg-rose-500/10"
                          >
                            <Archive className="size-3.5" />
                          </Button>
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
