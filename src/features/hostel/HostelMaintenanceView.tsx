import React, { useState, useEffect } from "react";
import { Wrench, Plus, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostelMaintenance,
  createHostelMaintenance,
  listHostels,
  listHostelRooms,
} from "@/services/hostelService";
import type { HostelMaintenance, Hostel, HostelRoom, ComplaintPriority } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelMaintenanceView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [items, setItems] = useState<HostelMaintenance[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  // New maintenance ticket form
  const [isCreating, setIsCreating] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<ComplaintPriority>("Normal");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [mList, hList, rList] = await Promise.all([
        listHostelMaintenance(organization.id, { status: statusFilter || undefined }),
        listHostels(organization.id),
        listHostelRooms(organization.id),
      ]);
      setItems(mList);
      setHostels(hList);
      setRooms(rList);
      if (hList.length > 0 && !selectedHostelId) {
        setSelectedHostelId(hList[0].id);
      }
    } catch (err: any) {
      console.error("loadMaintenance error:", err);
      setError(err.message || "Failed to load maintenance records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, statusFilter]);

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !selectedHostelId || !issue.trim()) return;

    const hostel = hostels.find((h) => h.id === selectedHostelId);
    const room = rooms.find((r) => r.id === selectedRoomId);

    setIsSubmitting(true);
    try {
      await createHostelMaintenance(organization.id, {
        hostelId: selectedHostelId,
        hostelName: hostel?.name || "Hostel",
        roomId: selectedRoomId || undefined,
        roomNumber: room?.roomNumber || undefined,
        issue: issue.trim(),
        priority,
        assignedStaff: assignedStaff.trim() || undefined,
        estimatedCost: Number(estimatedCost) || 0,
        status: "Open",
      });
      setIssue("");
      setAssignedStaff("");
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to log maintenance: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Facility Maintenance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log facility repairs, electrical work, carpentry, and asset maintenance across hostel wings.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" />
          {isCreating ? "Cancel" : "Add Maintenance Ticket"}
        </Button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateMaintenance}
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-soft space-y-4 text-xs"
        >
          <h3 className="font-extrabold text-sm text-foreground">Log Maintenance Work Order</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Hostel *</label>
              <select
                value={selectedHostelId}
                onChange={(e) => setSelectedHostelId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Specific Room (Optional)</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">General Facility / Common Area</option>
                {rooms
                  .filter((r) => (selectedHostelId ? r.hostelId === selectedHostelId : true))
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Maintenance Issue *</label>
              <input
                type="text"
                required
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g. Water pump overhaul in Tagore Hostel basement"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Assigned Staff / Vendor</label>
              <input
                type="text"
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                placeholder="e.g. Campus Electrician / Apex Plumbing Co."
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !issue.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Saving..." : "Create Work Order"}
            </Button>
          </div>
        </form>
      )}

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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Wrench className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No maintenance work orders</h3>
          <p className="mt-1 text-xs text-muted-foreground">Log preventive or repair maintenance tickets.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      m.priority === "Urgent"
                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {m.priority}
                  </span>
                  <span className="font-bold text-sm text-foreground">{m.issue}</span>
                </div>

                <p className="text-[11px] text-muted-foreground font-mono">
                  Location: {m.hostelName} {m.roomNumber ? `• Rm ${m.roomNumber}` : "• Common Facility"}
                  {m.assignedStaff ? ` • Assigned to: ${m.assignedStaff}` : ""}
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-foreground border border-border self-start sm:self-center">
                {m.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
