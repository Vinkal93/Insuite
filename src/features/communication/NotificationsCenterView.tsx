import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  CreditCard,
  Calendar,
  GraduationCap,
  Megaphone,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/communicationService";
import type { InAppNotification, NotificationType } from "@/types/communication";
import { Button } from "@/components/ui/button";

export const NotificationsCenterView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = async () => {
    if (!organization || !firebaseUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listUserNotifications(organization.id, firebaseUser.uid, {
        unreadOnly: activeTab === "unread",
      });
      setNotifications(data);
    } catch (err: any) {
      console.error("Error loading notifications:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [organization, firebaseUser, activeTab]);

  const handleMarkRead = async (id: string) => {
    if (!organization) return;
    try {
      await markNotificationAsRead(organization.id, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!organization || !firebaseUser) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead(organization.id, firebaseUser.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "FEE":
        return <CreditCard className="size-4 text-emerald-600" />;
      case "ATTENDANCE":
        return <Calendar className="size-4 text-amber-600" />;
      case "EXAM":
        return <GraduationCap className="size-4 text-primary" />;
      case "NOTICE":
      case "ASSIGNMENT":
        return <FileText className="size-4 text-blue-600" />;
      case "ADMISSION":
        return <Megaphone className="size-4 text-purple-600" />;
      default:
        return <Bell className="size-4 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            In-App Notification Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time automated alerts for fee collections, exams, attendance roll-calls, and notices.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="rounded-xl text-xs font-semibold"
          >
            <Check className="size-3.5 mr-1" /> Mark All as Read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          All Notifications
        </button>
        <button
          onClick={() => setActiveTab("unread")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "unread"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Unread Only</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[9px] font-black">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-10 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadNotifications} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Bell className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No Notifications</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeTab === "unread"
              ? "You're all caught up! No unread notifications found."
              : "No institutional notifications generated yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 transition-all shadow-soft flex items-start justify-between gap-4 ${
                n.read
                  ? "border-border bg-card opacity-80"
                  : "border-primary/30 bg-primary/5 font-semibold"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="size-8 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
                  {getTypeIcon(n.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-foreground truncate">{n.title}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                </div>
              </div>

              {!n.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkRead(n.id)}
                  className="h-7 px-2 text-[10px] font-bold text-primary shrink-0 hover:bg-primary/10"
                >
                  Mark Read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
