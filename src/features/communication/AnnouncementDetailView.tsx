import React, { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  Megaphone,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  ShieldCheck,
  CheckCircle2,
  Archive,
  AlertCircle,
  RefreshCw,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
} from "@/services/communicationService";
import type { Announcement } from "@/types/communication";
import { Button } from "@/components/ui/button";

export const AnnouncementDetailView: React.FC = () => {
  const { id } = useParams({ strict: false }) as { id?: string };
  const { organization, firebaseUser, userProfile } = useAuth();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    if (!organization || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnnouncement(organization.id, id);
      setAnnouncement(data);
    } catch (err: any) {
      console.error("Error loading announcement detail:", err);
      setError(err.message || "Failed to load announcement details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, id]);

  const handlePublish = async () => {
    if (!organization || !firebaseUser || !announcement) return;
    setIsProcessing(true);
    try {
      await publishAnnouncement(organization.id, announcement.id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to publish: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (!organization || !firebaseUser || !announcement) return;
    if (!confirm("Are you sure you want to archive this announcement?")) return;
    setIsProcessing(true);
    try {
      await archiveAnnouncement(organization.id, announcement.id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to archive: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Announcement Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "This record does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/communication/announcements">Back to Announcements</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link & actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/communication/announcements">
            <ArrowLeft className="size-3.5 mr-1" /> Back to Announcements
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {announcement.status === "Draft" && (
            <Button
              variant="hero"
              size="sm"
              onClick={handlePublish}
              disabled={isProcessing}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" /> Publish Now
            </Button>
          )}
          {announcement.status !== "Archived" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isProcessing}
              className="rounded-xl text-xs text-rose-500 hover:bg-rose-500/10"
            >
              <Archive className="size-3.5 mr-1.5" /> Archive
            </Button>
          )}
        </div>
      </div>

      {/* Main Detail Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                announcement.priority === "Urgent"
                  ? "bg-rose-500/10 text-rose-600"
                  : announcement.priority === "Important"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-blue-500/10 text-blue-600"
              }`}
            >
              {announcement.priority} Priority
            </span>
            <span
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold ${
                announcement.status === "Published"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : announcement.status === "Draft"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {announcement.status}
            </span>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono">
            Created: {new Date(announcement.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-black text-foreground sm:text-2xl">{announcement.title}</h1>
        </div>

        {/* Metadata Grid */}
        <div className="grid gap-3 sm:grid-cols-3 rounded-2xl border border-border bg-surface/50 p-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Audience</span>
            <p className="mt-0.5 font-bold text-foreground">{announcement.audienceType}</p>
            {announcement.targetClassName && (
              <p className="text-[10px] text-muted-foreground">Class: {announcement.targetClassName}</p>
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Author</span>
            <p className="mt-0.5 font-bold text-foreground">{announcement.createdByName || "Administrator"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published Date</span>
            <p className="mt-0.5 font-bold text-foreground">
              {announcement.publishAt ? new Date(announcement.publishAt).toLocaleDateString() : "Unpublished"}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose prose-sm max-w-none text-foreground text-xs leading-relaxed whitespace-pre-wrap rounded-2xl border border-border bg-surface p-5 font-sans">
          {announcement.content}
        </div>

        {/* Attachments if any */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Paperclip className="size-3.5" /> Attachments ({announcement.attachments.length})
            </h3>
            <div className="space-y-1.5">
              {announcement.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface/50 px-3 py-2 text-xs font-semibold text-primary hover:bg-surface"
                >
                  <span>{att.name}</span>
                  <span className="text-[10px] text-muted-foreground">Open Document →</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
