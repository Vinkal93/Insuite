import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listMessages } from "@/services/communicationService";
import type { CommunicationMessage } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const MessagesListView: React.FC = () => {
  const { organization } = useAuth();
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadMessages = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listMessages(organization.id, {
        channel: channelFilter,
        status: statusFilter,
      });
      setMessages(data);
    } catch (err: any) {
      console.error("Error loading messages:", err);
      setError(err.message || "Failed to load communication messages outbox.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [organization, channelFilter, statusFilter]);

  const filteredMessages = messages.filter(
    (m) =>
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Messages & Multi-Channel Outbox
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct communications sent across In-App feeds, SMS, WhatsApp API and Email gateways.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/communication/messages/new">
            <Send className="size-3.5 mr-1.5" /> Compose Message
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
              placeholder="Search by subject or content..."
              className="h-9 pl-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Channels</option>
              <option value="IN_APP">In-App Notification</option>
              <option value="EMAIL">Email Gateway</option>
              <option value="SMS">SMS Gateway</option>
              <option value="WHATSAPP">WhatsApp Business</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Delivery Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="SENT">Sent / Submitted</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Table */}
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
          <Button onClick={loadMessages} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <MessageSquare className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No Messages Dispatched</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your outbox is currently clear. Compose a new message to dispatch to parents or students.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/communication/messages/new">Compose New Message</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Channel</th>
                  <th className="px-4 py-3.5">Audience & Count</th>
                  <th className="px-4 py-3.5">Subject / Message</th>
                  <th className="px-4 py-3.5">Status & Provider</th>
                  <th className="px-6 py-3.5 text-right">Sent By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredMessages.map((m) => (
                  <tr key={m.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">
                        {m.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">
                      <p className="font-bold">{m.audienceType}</p>
                      <p className="text-[10px] text-muted-foreground">{m.recipientCount} Recipients</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[280px]">
                      <p className="font-bold text-foreground truncate">{m.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.content}</p>
                      {m.failureReason && (
                        <p className="mt-1 text-[10px] text-destructive font-semibold">
                          Reason: {m.failureReason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                            m.status === "DELIVERED" || m.status === "SENT"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : m.status === "FAILED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {m.status}
                        </span>
                        {m.provider && (
                          <span className="block text-[9px] text-muted-foreground mt-0.5 truncate">
                            {m.provider}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-muted-foreground">
                      {m.createdByName || "Administrator"}
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
