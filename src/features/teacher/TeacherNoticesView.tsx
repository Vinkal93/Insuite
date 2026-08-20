import React, { useState, useEffect } from "react";
import { Megaphone, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listAnnouncements } from "@/services/communicationService";
import type { Announcement } from "@/types/communication";
import { Button } from "@/components/ui/button";

export const TeacherNoticesView: React.FC = () => {
  const { organization } = useAuth();
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotices = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listAnnouncements(organization.id, { targetAudience: "STAFF" });
      setNotices(list);
    } catch (err: any) {
      console.error("loadTeacherNotices error:", err);
      setError(err.message || "Failed to load notices.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Faculty Notices & Staff Bulletins
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Official staff circulars, administrative memos, and faculty meetings.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadNotices} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : notices.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Megaphone className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No faculty notices</h3>
          <p className="mt-1 text-xs text-muted-foreground">All recent staff circulars have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <div
              key={n.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-extrabold text-sm text-foreground">{n.title}</h3>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {n.createdAt?.split("T")[0]}
                </span>
              </div>

              <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {n.content}
              </div>

              {n.tags && n.tags.length > 0 && (
                <div className="flex gap-1.5 pt-2">
                  {n.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
