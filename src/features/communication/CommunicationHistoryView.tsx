import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Megaphone,
  FileText,
  MessageSquare,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listCommunicationHistory } from "@/services/communicationService";
import type { CommunicationHistoryItem } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const CommunicationHistoryView: React.FC = () => {
  const { organization } = useAuth();
  const [history, setHistory] = useState<CommunicationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadHistory = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCommunicationHistory(organization.id, {
        type: typeFilter,
        status: statusFilter,
      });
      setHistory(data);
    } catch (err: any) {
      console.error("Error loading communication history:", err);
      setError(err.message || "Failed to load audit history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [organization, typeFilter, statusFilter]);

  const filteredHistory = history.filter(
    (h) =>
      h.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.recipientSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.actorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600">Announcement</span>;
      case "NOTICE":
        return <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-600">Notice</span>;
      case "MESSAGE":
        return <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600">Message</span>;
      default:
        return <span className="rounded bg-secondary px-2 py-0.5 text-[9px] font-bold text-muted-foreground">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Communication Audit History
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable system audit logs tracking announcements, notices, and multi-channel dispatches.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by subject or actor..."
              className="h-9 pl-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Communication Types</option>
              <option value="ANNOUNCEMENT">Announcements</option>
              <option value="NOTICE">Notices</option>
              <option value="MESSAGE">Direct Messages</option>
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
              <option value="DELIVERED">Delivered</option>
              <option value="SENT">Sent</option>
              <option value="Draft">Draft</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
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
          <Button onClick={loadHistory} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <History className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No History Found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            No broadcast logs match your search filters.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Channel</th>
                  <th className="px-4 py-3.5">Recipient / Audience</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-muted-foreground">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">{getTypeBadge(h.type)}</td>
                    <td className="px-4 py-3.5 font-mono uppercase text-[10px] text-muted-foreground">
                      {h.channel}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{h.recipientSummary}</td>
                    <td className="px-4 py-3.5 text-foreground max-w-[240px] truncate">{h.subject}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${
                          h.status === "Published" || h.status === "DELIVERED" || h.status === "SENT"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : h.status === "FAILED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-muted-foreground">
                      {h.actorName}
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
