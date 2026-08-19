import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  MessageSquare,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  FileCheck,
  Eye,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listCounselling,
  createCounselling,
} from "@/services/admissionService";
import type { CounsellingRecord } from "@/types/admission";
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

export const CounsellingWorkspace: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [records, setRecords] = useState<CounsellingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active detail modal
  const [selectedRecord, setSelectedRecord] = useState<CounsellingRecord | null>(null);

  // New Counselling modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [className, setClassName] = useState("Class 1");
  const [interestLevel, setInterestLevel] = useState<"High" | "Medium" | "Low">("High");
  const [discussionNotes, setDiscussionNotes] = useState("");
  const [feeDiscussion, setFeeDiscussion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const list = await listCounselling(organization.id);
      setRecords(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !studentName || !discussionNotes) return;
    setIsSubmitting(true);
    try {
      await createCounselling(organization.id, {
        organizationId: organization.id,
        enquiryId: "",
        studentName,
        parentName: parentName || "Parent",
        className,
        counsellorId: firebaseUser?.uid || "",
        counsellorName: userProfile?.displayName || "Counsellor",
        interestLevel,
        discussionNotes,
        feeDiscussionNotes: feeDiscussion,
        status: "In Progress",
        lastContactDate: new Date().toISOString().split("T")[0],
      });
      setIsAddOpen(false);
      setStudentName("");
      setParentName("");
      setDiscussionNotes("");
      setFeeDiscussion("");
      await fetchRecords();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInterestBadge = (lvl: "High" | "Medium" | "Low") => {
    switch (lvl) {
      case "High":
        return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">High Interest 🔥</span>;
      case "Medium":
        return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">Medium</span>;
      case "Low":
        return <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Admission Counselling Workspace</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {records.length} Sessions
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Record student & parent interview notes, fee concessions, and curriculum orientation.
          </p>
        </div>

        <Button variant="hero" size="sm" onClick={() => setIsAddOpen(true)} className="rounded-xl font-bold">
          <MessageSquare className="size-4 mr-1.5" /> + New Counselling Session
        </Button>
      </div>

      {/* Directory Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <MessageSquare className="size-8 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-bold text-foreground">No counselling sessions recorded yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">Start counseling prospective candidates for admissions.</p>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)} className="mt-4 rounded-xl text-xs font-bold">
              Record Counselling
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Student & Parent</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Counsellor</th>
                  <th className="px-4 py-3">Interest Level</th>
                  <th className="px-4 py-3">Discussion Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{r.studentName}</p>
                      <p className="text-[10px] text-muted-foreground">Parent: {r.parentName}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.className}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.counsellorName}</td>
                    <td className="px-4 py-3">{getInterestBadge(r.interestLevel)}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-foreground">{r.discussionNotes}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRecord(r)}
                        className="h-7 rounded-lg text-xs"
                      >
                        <Eye className="size-3 mr-1" /> View Notes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Drawer/Modal */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-bold">Counselling Session Notes</DialogTitle>
              <DialogDescription className="text-xs">
                Candidate: <strong className="text-foreground">{selectedRecord.studentName}</strong> • Class: {selectedRecord.className}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-surface p-3">
                <div>
                  <p className="text-muted-foreground text-[10px]">Counsellor</p>
                  <p className="font-bold text-foreground">{selectedRecord.counsellorName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Interest Level</p>
                  <div className="mt-0.5">{getInterestBadge(selectedRecord.interestLevel)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Last Contact</p>
                  <p className="font-mono text-foreground">{selectedRecord.lastContactDate}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Discussion Notes</Label>
                <div className="mt-1 rounded-xl border border-border bg-surface p-3 leading-relaxed text-foreground">
                  {selectedRecord.discussionNotes}
                </div>
              </div>

              {selectedRecord.feeDiscussionNotes && (
                <div>
                  <Label className="text-xs font-semibold">Fee & Scholarship Discussion</Label>
                  <div className="mt-1 rounded-xl border border-border bg-surface p-3 leading-relaxed text-foreground">
                    {selectedRecord.feeDiscussionNotes}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="rounded-xl">
                Close
              </Button>
              <Button variant="hero" size="sm" asChild className="rounded-xl font-bold">
                <Link to="/admissions/applications/new">
                  <FileCheck className="size-3.5 mr-1" /> Start Application
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Counselling Modal */}
      {isAddOpen && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">New Counselling Session</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  Record parent conversation, academic counseling & orientation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Student Name *</Label>
                  <Input required value={studentName} onChange={(e) => setStudentName(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Parent Name</Label>
                  <Input value={parentName} onChange={(e) => setParentName(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold">Class</Label>
                    <Input value={className} onChange={(e) => setClassName(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Interest Level</Label>
                    <select value={interestLevel} onChange={(e) => setInterestLevel(e.target.value as any)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                      <option value="High">High Interest 🔥</option>
                      <option value="Medium">Medium Interest</option>
                      <option value="Low">Low / Unsure</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Discussion Notes *</Label>
                  <Textarea required placeholder="Curriculum questions, parent expectations, student background..." value={discussionNotes} onChange={(e) => setDiscussionNotes(e.target.value)} className="rounded-xl border-border bg-surface text-xs min-h-[70px]" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Fee / Concession Discussion</Label>
                  <Input placeholder="Installment schedule, sibling discount, etc." value={feeDiscussion} onChange={(e) => setFeeDiscussion(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" size="sm" disabled={isSubmitting || !studentName || !discussionNotes} className="rounded-xl font-bold">
                  {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Save Session
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
