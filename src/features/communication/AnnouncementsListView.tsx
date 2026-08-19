import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Archive,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listAnnouncements,
  publishAnnouncement,
  archiveAnnouncement,
} from "@/services/communicationService";
import type { Announcement, AnnouncementStatus, AudienceType } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AnnouncementsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [audienceFilter, setAudienceFilter] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAnnouncements(organization.id, {
        status: statusFilter,
        audienceType: audienceFilter,
      });
      setAnnouncements(data);
    } catch (err: any) {
      console.error("Error loading announcements:", err);
      setError(err.message || "Failed to load announcements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [organization, statusFilter, audienceFilter]);

  const handlePublish = async (id: string) => {
    if (!organization || !firebaseUser) return;
    setProcessingId(id);
    try {
      await publishAnnouncement(organization.id, id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadAnnouncements();
    } catch (err: any) {
      alert("Failed to publish announcement: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to archive this announcement?")) return;
    setProcessingId(id);
    try {
      await archiveAnnouncement(organization.id, id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadAnnouncements();
    } catch (err: any) {
      alert("Failed to archive announcement: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAnnouncements = announcements.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Announcements & Circulars
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Broadcast emergency alerts, general news, and targeted circulars across classes.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/communication/announcements/new">
            <Plus className="size-3.5 mr-1.5" /> Create Announcement
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
              placeholder="Search announcements by title..."
              className="h-9 pl-9 text-xs rounded-xl"
            />
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
              <option value="Scheduled">Scheduled</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Audiences</option>
              <option value="Entire School">Entire School</option>
              <option value="Students">Students Only</option>
              <option value="Parents">Parents Only</option>
              <option value="Teachers">Teachers Only</option>
              <option value="Staff">Staff Only</option>
              <option value="Specific Class">Specific Class</option>
              <option value="Specific Section">Specific Section</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements Table */}
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
          <Button onClick={loadAnnouncements} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Megaphone className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No Announcements Found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            No broadcast circulars match the selected filter criteria.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/communication/announcements/new">Create First Announcement</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Announcement</th>
                  <th className="px-4 py-3.5">Audience</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Created By</th>
                  <th className="px-4 py-3.5">Published / Schedule</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredAnnouncements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-3.5 max-w-[280px]">
                      <p className="font-bold text-foreground truncate">{ann.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{ann.content}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-foreground">{ann.audienceType}</span>
                      {ann.targetClassName && (
                        <span className="block text-[10px] text-muted-foreground">
                          Class: {ann.targetClassName} {ann.targetSectionName ? `(${ann.targetSectionName})` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          ann.priority === "Urgent"
                            ? "bg-rose-500/10 text-rose-600"
                            : ann.priority === "Important"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {ann.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {ann.createdByName || "Administrator"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {ann.publishAt
                        ? new Date(ann.publishAt).toLocaleDateString()
                        : new Date(ann.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ann.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : ann.status === "Draft"
                            ? "bg-amber-500/10 text-amber-600"
                            : ann.status === "Scheduled"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {ann.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link to="/communication/announcements/$id" params={{ id: ann.id }}>
                            <Eye className="size-3.5" />
                          </Link>
                        </Button>
                        {ann.status === "Draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(ann.id)}
                            disabled={processingId === ann.id}
                            className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <CheckCircle className="size-3.5" />
                          </Button>
                        )}
                        {ann.status !== "Archived" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(ann.id)}
                            disabled={processingId === ann.id}
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
