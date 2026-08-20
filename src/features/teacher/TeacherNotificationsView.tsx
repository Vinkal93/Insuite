import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/communicationService";
import type { Notification } from "@/types/communication";
import { Button } from "@/components/ui/button";

export const TeacherNotificationsView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    if (!organization || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await listUserNotifications(organization.id, firebaseUser.uid);
      setNotifications(list);
    } catch (err: any) {
      console.error("loadTeacherNotifications error:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [organization, firebaseUser]);

  const handleMarkAll = async () => {
    if (!organization || !firebaseUser) return;
    try {
      await markAllNotificationsAsRead(organization.id, firebaseUser.uid);
      await loadNotifications();
    } catch (err: any) {
      alert("Failed to mark all as read: " + err.message);
    }
  };

  const handleMarkOne = async (id: string) => {
    if (!organization) return;
    try {
      await markNotificationAsRead(organization.id, id);
      await loadNotifications();
    } catch (err: any) {
      console.error("markNotificationRead error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Notifications
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assignment submissions, timetable changes, and examination reminders.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            className="rounded-xl text-xs font-bold"
          >
            <CheckCheck className="size-3.5 mr-1.5" /> Mark All as Read
          </Button>
        )}
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
          <Button onClick={loadNotifications} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Bell className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No notifications</h3>
          <p className="mt-1 text-xs text-muted-foreground">You are all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkOne(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                n.isRead
                  ? "bg-card border-border text-muted-foreground"
                  : "bg-primary/5 border-primary/30 text-foreground font-semibold"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold">{n.title}</h4>
                  <p className="text-xs">{n.body}</p>
                  <span className="text-[10px] text-muted-foreground font-mono block">
                    {n.createdAt?.split("T")[0]}
                  </span>
                </div>
                {!n.isRead && (
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
