import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  Phone,
  MessageSquare,
  Check,
  Calendar,
  AlertCircle,
  Loader2,
  Eye,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listFollowUps,
  completeFollowUp,
  createFollowUp,
} from "@/services/admissionService";
import type { FollowUp } from "@/types/admission";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const FollowUpsWorkspace: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "overdue" | "completed">("today");
  const [isLoading, setIsLoading] = useState(true);

  // Complete Follow-up Modal
  const [completingFu, setCompletingFu] = useState<FollowUp | null>(null);
  const [outcome, setOutcome] = useState<FollowUp["outcome"]>("Interested");
  const [notes, setNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  // Add Follow-up Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newStudent, setNewStudent] = useState("");
  const [newParent, setNewParent] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newPurpose, setNewPurpose] = useState("Admission inquiry follow-up");
  const [newMethod, setNewMethod] = useState<"Call" | "WhatsApp" | "Email" | "In Person">("Call");
  const [isAdding, setIsAdding] = useState(false);

  const fetchFollowUps = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const list = await listFollowUps(organization.id);
      setFollowUps(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !completingFu || !firebaseUser) return;
    setIsCompleting(true);
    try {
      await completeFollowUp(
        organization.id,
        completingFu.id,
        outcome,
        notes,
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setCompletingFu(null);
      setNotes("");
      await fetchFollowUps();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !newStudent || !newMobile || !newDate) return;
    setIsAdding(true);
    try {
      await createFollowUp(
        organization.id,
        {
          organizationId: organization.id,
          studentName: newStudent,
          parentName: newParent || "Parent",
          mobile: newMobile,
          scheduledDate: newDate,
          contactMethod: newMethod,
          purpose: newPurpose,
          status: "Pending",
          createdBy: firebaseUser.uid,
        },
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setIsAddOpen(false);
      setNewStudent("");
      setNewParent("");
      setNewMobile("");
      setNewDate("");
      await fetchFollowUps();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredList = followUps.filter((f) => {
    if (activeTab === "completed") return f.status === "Completed";
    if (f.status === "Completed") return false;
    if (activeTab === "today") return f.scheduledDate === todayStr;
    if (activeTab === "upcoming") return f.scheduledDate > todayStr;
    if (activeTab === "overdue") return f.scheduledDate < todayStr;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Follow-up Management</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {filteredList.length} Tasks
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage counselor calls, prospective parent meetings, and intake communications.
          </p>
        </div>

        <Button variant="hero" size="sm" onClick={() => setIsAddOpen(true)} className="rounded-xl font-bold">
          <Plus className="size-4 mr-1.5" /> + Add Follow-up
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {[
          { id: "today", label: `Due Today (${followUps.filter((f) => f.scheduledDate === todayStr && f.status === "Pending").length})` },
          { id: "upcoming", label: `Upcoming (${followUps.filter((f) => f.scheduledDate > todayStr && f.status === "Pending").length})` },
          { id: "overdue", label: `Overdue (${followUps.filter((f) => f.scheduledDate < todayStr && f.status === "Pending").length})` },
          { id: "completed", label: `Completed History (${followUps.filter((f) => f.status === "Completed").length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Directory Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Clock className="size-8 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-bold text-foreground">No follow-ups in this queue</h3>
            <p className="mt-1 text-xs text-muted-foreground">All prospective parent follow-ups are clear.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Student / Parent</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Follow-up Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredList.map((fu) => (
                  <tr key={fu.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{fu.studentName}</p>
                      <p className="text-[10px] text-muted-foreground">Parent: {fu.parentName}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">{fu.mobile}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{fu.scheduledDate}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {fu.contactMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-foreground">{fu.purpose}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${fu.status === "Completed" ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600"}`}>
                        {fu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" asChild className="h-7 rounded-lg text-[11px]">
                          <a href={`tel:${fu.mobile}`}><Phone className="size-3 mr-1" /> Call</a>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="h-7 rounded-lg text-[11px]">
                          <a href={`https://wa.me/${fu.mobile.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                            <MessageSquare className="size-3 mr-1" /> WhatsApp
                          </a>
                        </Button>
                        {fu.status === "Pending" && (
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => setCompletingFu(fu)}
                            className="h-7 rounded-lg text-[11px] font-bold"
                          >
                            <Check className="size-3 mr-1" /> Complete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Follow-up Modal */}
      {isAddOpen && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddFollowUp}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Clock className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">New Follow-up Task</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  Create a direct follow-up reminder for a prospective family.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Student Name *</Label>
                  <Input required value={newStudent} onChange={(e) => setNewStudent(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Parent / Guardian Name</Label>
                  <Input value={newParent} onChange={(e) => setNewParent(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Contact Mobile *</Label>
                  <Input required placeholder="+91 98765 43210" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Scheduled Date *</Label>
                  <Input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Contact Method</Label>
                  <select value={newMethod} onChange={(e) => setNewMethod(e.target.value as any)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="In Person">Campus Visit</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Purpose</Label>
                  <Input value={newPurpose} onChange={(e) => setNewPurpose(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" size="sm" disabled={isAdding || !newStudent || !newMobile || !newDate} className="rounded-xl font-bold">
                  {isAdding ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Save Reminder
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Complete Modal */}
      {completingFu && (
        <Dialog open={!!completingFu} onOpenChange={(open) => !open && setCompletingFu(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleComplete}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Check className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">Mark Follow-up Complete</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  Record outcome for <strong className="text-foreground">{completingFu.studentName}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Outcome *</Label>
                  <select value={outcome} onChange={(e) => setOutcome(e.target.value as any)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                    <option value="Interested">Interested — Send Brochure/Details</option>
                    <option value="Application Started">Application Started</option>
                    <option value="Admission Ready">Admission Ready</option>
                    <option value="Call Back">Call Back Later</option>
                    <option value="No Response">No Response</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Discussion Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl border-border bg-surface text-xs min-h-[70px]" />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCompletingFu(null)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" size="sm" disabled={isCompleting} className="rounded-xl font-bold">
                  {isCompleting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Save Outcome
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
