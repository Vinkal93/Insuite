import React, { useState, useEffect } from "react";
import { MessageSquare, Send, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { listMessages, sendMessage } from "@/services/communicationService";
import type { CommunicationMessage } from "@/types/communication";
import { Button } from "@/components/ui/button";

export const TeacherMessagesView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const { teacher } = useTeacher();

  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!organization || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await listMessages(organization.id, {
        senderId: firebaseUser.uid,
      });
      setMessages(list);
    } catch (err: any) {
      console.error("loadTeacherMessages error:", err);
      setError(err.message || "Failed to load messages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [organization, firebaseUser]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !body.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(
        organization.id,
        {
          channel: "IN_APP",
          recipientType: "INDIVIDUAL",
          recipientIds: ["admin-desk"],
          subject: subject.trim() || `Staff Memo from ${teacher?.fullName || "Faculty"}`,
          body: body.trim(),
          priority: "NORMAL",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || teacher?.fullName || "Teacher" }
      );
      setSubject("");
      setBody("");
      await loadMessages();
    } catch (err: any) {
      alert("Failed to dispatch message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Faculty Messages & Communications
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          In-app administrative communication and school queries.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Composer */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-extrabold text-foreground">Compose Memo</h3>

          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Leave Application / Schedule Adjustment"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Message Body *</label>
              <textarea
                rows={4}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message to school administration..."
                className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSending || !body.trim()}
              className="w-full rounded-xl text-xs font-bold"
            >
              <Send className="size-3.5 mr-1.5" />
              {isSending ? "Sending..." : "Dispatch Message"}
            </Button>
          </form>
        </div>

        {/* History */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-extrabold text-foreground">Message History</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 text-xs text-destructive">
              <p>{error}</p>
              <Button onClick={loadMessages} variant="outline" size="sm" className="mt-2 text-xs">
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              No message history recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-border bg-surface/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{m.subject || "Message"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {m.createdAt?.split("T")[0]}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
