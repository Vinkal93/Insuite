import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Megaphone,
  FileText,
  MessageSquare,
  Bell,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  Plus,
  RefreshCw,
  TrendingUp,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getCommunicationStats,
  listAnnouncements,
  listMessages,
} from "@/services/communicationService";
import type {
  CommunicationStats,
  Announcement,
  CommunicationMessage,
} from "@/types/communication";
import { Button } from "@/components/ui/button";

export const CommunicationDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [recentMessages, setRecentMessages] = useState<CommunicationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [st, ann, msg] = await Promise.all([
        getCommunicationStats(organization.id),
        listAnnouncements(organization.id),
        listMessages(organization.id),
      ]);
      setStats(st);
      setRecentAnnouncements(ann.slice(0, 4));
      setRecentMessages(msg.slice(0, 5));
    } catch (err: any) {
      console.error("CommunicationDashboard error:", err);
      setError(err.message || "Failed to load communication metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse p-4" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Error Loading Communication Dashboard</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <Button onClick={loadData} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
          <RefreshCw className="size-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Communication & Broadcast Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time notifications, institutional broadcasts, formal notices & channel dispatches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/communication/notices/new">
              <FileText className="size-3.5 mr-1 text-primary" /> New Notice
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/communication/announcements/new">
              <Megaphone className="size-3.5 mr-1.5" /> Broadcast Announcement
            </Link>
          </Button>
        </div>
      </div>

      {/* Real Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published</span>
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Megaphone className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.publishedAnnouncements ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Active Broadcasts</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Drafts</span>
            <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.draftAnnouncements ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Unpublished</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scheduled</span>
            <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Clock className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.scheduledMessages ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Upcoming Deliveries</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dispatched</span>
            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{stats?.notificationsSent ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Confirmed Outbox</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Failed</span>
            <div className="size-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <XCircle className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">{stats?.failedDeliveries ?? 0}</p>
          <p className="text-[10px] text-rose-600/80 mt-0.5">Unconfigured / Error</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending</span>
            <div className="size-7 rounded-lg bg-secondary text-foreground flex items-center justify-center">
              <Layers className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.pendingCommunication ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">In Queue</p>
        </div>
      </div>

      {/* Main Grid: Recent Announcements & Recent Messages */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Announcements */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Recent Announcements</h2>
              <p className="text-xs text-muted-foreground">School-wide and targeted circulars</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/communication/announcements">View All →</Link>
            </Button>
          </div>

          {recentAnnouncements.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No communication activity yet. Create your first announcement to broadcast to students and staff.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-2xl border border-border bg-surface/50 p-4 transition-all hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        ann.priority === "Urgent"
                          ? "bg-rose-500/10 text-rose-600"
                          : ann.priority === "Important"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-xs font-bold text-foreground line-clamp-1">{ann.title}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{ann.content}</p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                    <span className="font-semibold text-muted-foreground">
                      Audience: <strong className="text-foreground">{ann.audienceType}</strong>
                    </span>
                    <Link
                      to="/communication/announcements/$id"
                      params={{ id: ann.id }}
                      className="font-bold text-primary hover:underline"
                    >
                      Read Full →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Dispatch Queue */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Message Dispatches</h2>
              <p className="text-xs text-muted-foreground">Direct SMS, WhatsApp, Email and In-App feeds</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/communication/messages">Outbox →</Link>
            </Button>
          </div>

          {recentMessages.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No message dispatches recorded. Use the Send Message tool to reach parents and teachers directly.
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-2xl border border-border bg-surface/50 p-4 transition-all hover:bg-surface flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                        {msg.channel}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground truncate">{msg.subject}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{msg.content}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold ${
                        msg.status === "DELIVERED" || msg.status === "SENT"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : msg.status === "FAILED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
