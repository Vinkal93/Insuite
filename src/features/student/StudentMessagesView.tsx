import React, { useState, useEffect } from "react";
import { MessageSquare, Send, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { listMessages, sendMessage } from "@/services/communicationService";
import type { CommunicationMessage } from "@/types/communication";
import { Button } from "@/components/ui/button";

export const StudentMessagesView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const { student } = useStudent();

  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
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
      console.error("loadStudentMessages error:", err);
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
    if (!organization || !firebaseUser || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(
        organization.id,
        {
          channel: "IN_APP",
          recipientType: "INDIVIDUAL",
          recipientIds: ["class-teacher"],
          subject: `Student Message from ${student?.fullName || "Student"}`,
          body: newMessage.trim(),
          priority: "NORMAL",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || student?.fullName || "Student" }
      );
      setNewMessage("");
      await loadMessages();
    } catch (err: any) {
      alert("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Teacher Messages & Queries
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask questions or send notes to your class teachers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message Composer */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-extrabold text-foreground">Compose Message</h3>

          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Your Message *
              </label>
              <textarea
                rows={4}
                required
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask your subject or class teacher..."
                className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSending || !newMessage.trim()}
              className="w-full rounded-xl text-xs font-bold"
            >
              <Send className="size-3.5 mr-1.5" />
              {isSending ? "Sending..." : "Send to Teacher"}
            </Button>
          </form>
        </div>

        {/* Message Thread */}
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
              No message conversations yet. Use the box on the left to ask a question.
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
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Delivered
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
