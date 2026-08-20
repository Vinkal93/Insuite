import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Wrench,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostelComplaints,
  createHostelComplaint,
  updateHostelComplaintStatus,
  listHostelAllocations,
} from "@/services/hostelService";
import type { HostelComplaint, HostelAllocation, ComplaintPriority, ComplaintStatus } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelComplaintsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [complaints, setComplaints] = useState<HostelComplaint[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  // New complaint form
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [category, setCategory] = useState("Plumbing & Washroom");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ComplaintPriority>("Normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cList, aList] = await Promise.all([
        listHostelComplaints(organization.id, { status: statusFilter || undefined }),
        listHostelAllocations(organization.id, { status: "Active" }),
      ]);
      setComplaints(cList);
      setAllocations(aList);
      if (aList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(aList[0].studentId);
      }
    } catch (err: any) {
      console.error("loadComplaints error:", err);
      setError(err.message || "Failed to load complaints.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, statusFilter]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !selectedStudentId || !title.trim() || !description.trim()) return;

    const alloc = allocations.find((a) => a.studentId === selectedStudentId);
    if (!alloc) return;

    setIsSubmitting(true);
    try {
      await createHostelComplaint(organization.id, {
        studentId: alloc.studentId,
        studentName: alloc.studentName,
        hostelId: alloc.hostelId,
        hostelName: alloc.hostelName,
        roomId: alloc.roomId,
        roomNumber: alloc.roomNumber,
        category,
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      setTitle("");
      setDescription("");
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to lodge complaint: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (complaintId: string) => {
    const resolution = prompt("Enter resolution details / action taken:");
    if (!resolution || !organization || !firebaseUser) return;

    try {
      await updateHostelComplaintStatus(organization.id, complaintId, "Resolved", resolution, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Warden",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Grievances & Complaints
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Student maintenance requests, plumbing, electrical, hygiene, and room repairs.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" />
          {isCreating ? "Cancel" : "Lodge Complaint"}
        </Button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateComplaint}
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-soft space-y-4 text-xs"
        >
          <h3 className="font-extrabold text-sm text-foreground">Lodge Student Complaint</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Boarding Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {allocations.map((a) => (
                  <option key={a.studentId} value={a.studentId}>
                    {a.studentName} ({a.hostelName} • Rm {a.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Issue Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Plumbing & Washroom">Plumbing & Washroom</option>
                <option value="Electrical & Power">Electrical & Power</option>
                <option value="Carpentry & Bed">Carpentry & Bedding</option>
                <option value="Cleanliness & Hygiene">Cleanliness & Hygiene</option>
                <option value="Mess & Food">Mess & Food</option>
                <option value="Other">Other</option>
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

          <div>
            <label className="block font-semibold text-foreground mb-1">Title / Brief Summary *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Geyser in Room 204 not heating water"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the exact fault or malfunction..."
              className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Open", "Resolved"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? `${st} Tickets` : "All Tickets"}
          </button>
        ))}
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <CheckCircle2 className="size-10 text-emerald-500 mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No complaints filed</h3>
          <p className="mt-1 text-xs text-muted-foreground">All hostel facilities are currently operational.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      c.priority === "Urgent"
                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        : c.priority === "High"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {c.priority}
                  </span>
                  <span className="font-extrabold text-sm text-foreground">{c.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({c.category})</span>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border self-start sm:self-auto ${
                    c.status === "Resolved"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <p className="text-muted-foreground text-[11px] leading-relaxed">{c.description}</p>

              <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
                <span>
                  Resident: <strong className="text-foreground">{c.studentName}</strong> • {c.hostelName} (Rm {c.roomNumber})
                </span>

                {c.status === "Open" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(c.id)}
                    className="rounded-xl text-[11px] font-bold h-7 px-3 text-emerald-600 hover:bg-emerald-50 self-end sm:self-auto"
                  >
                    <CheckCircle2 className="size-3 mr-1" /> Mark Resolved
                  </Button>
                ) : (
                  <span className="text-emerald-600 font-bold">
                    Resolution: {c.resolution || "Addressed by hostel maintenance"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
