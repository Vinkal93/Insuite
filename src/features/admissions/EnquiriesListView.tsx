import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  PhoneCall,
  UserPlus,
  RotateCcw,
  Eye,
  Phone,
  MessageSquare,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listEnquiries,
  updateEnquiry,
  createFollowUp,
} from "@/services/admissionService";
import type { Enquiry, EnquiryStatus } from "@/types/admission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CLASSES_LIST = [
  "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4",
  "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
];

const SOURCES_LIST = [
  "Website", "Walk-in", "Phone", "WhatsApp", "Referral", "Advertisement", "Social Media", "School Event", "Other"
];

const STATUSES_LIST: EnquiryStatus[] = [
  "New", "Contacted", "Counselling", "Interested", "Application Started", "Converted", "Lost", "Not Interested"
];

export const EnquiriesListView: React.FC = () => {
  const { organization, selectedSession, allSessions, firebaseUser, userProfile } = useAuth();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>(selectedSession?.id || "");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Follow-up quick modal
  const [followUpEnquiry, setFollowUpEnquiry] = useState<Enquiry | null>(null);
  const [fuDate, setFuDate] = useState("");
  const [fuPurpose, setFuPurpose] = useState("Counseling & Class discussion");
  const [fuMethod, setFuMethod] = useState<"Call" | "WhatsApp" | "Email" | "In Person">("Call");
  const [isSubmittingFu, setIsSubmittingFu] = useState(false);

  const fetchList = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listEnquiries(organization.id, {
        sessionId: selectedSessionId || undefined,
        classId: selectedClass || undefined,
        source: selectedSource || undefined,
        status: selectedStatus || undefined,
        searchQuery,
      });
      setEnquiries(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load enquiries list.");
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedSessionId, selectedClass, selectedSource, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSessionId(selectedSession?.id || "");
    setSelectedClass("");
    setSelectedSource("");
    setSelectedStatus("");
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !followUpEnquiry || !firebaseUser || !fuDate) return;
    setIsSubmittingFu(true);
    try {
      await createFollowUp(
        organization.id,
        {
          organizationId: organization.id,
          enquiryId: followUpEnquiry.id,
          studentName: followUpEnquiry.student.fullName,
          parentName: followUpEnquiry.parent.fatherName || followUpEnquiry.parent.guardianName || "Parent",
          mobile: followUpEnquiry.parent.mobile,
          scheduledDate: fuDate,
          contactMethod: fuMethod,
          purpose: fuPurpose,
          status: "Pending",
          createdBy: firebaseUser.uid,
        },
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setFollowUpEnquiry(null);
      setFuDate("");
      await fetchList();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFu(false);
    }
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case "New":
        return <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">New</span>;
      case "Contacted":
        return <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">Contacted</span>;
      case "Counselling":
        return <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-600">Counselling</span>;
      case "Interested":
        return <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">Interested</span>;
      case "Application Started":
        return <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-600">App Started</span>;
      case "Converted":
        return <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-bold text-success">Converted ✓</span>;
      case "Lost":
      case "Not Interested":
        return <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-bold text-destructive">{status}</span>;
      default:
        return <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Admissions Enquiries</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {enquiries.length} Records
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage incoming student enquiries, follow-ups, and counseling pipeline.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl font-bold">
          <Link to="/admissions/enquiries/new">
            <PhoneCall className="size-4 mr-1.5" /> + New Enquiry
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search ID, Name, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border-border bg-surface pl-9 text-xs"
            />
          </div>

          <div>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Sessions</option>
              {allSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Classes</option>
              {CLASSES_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Sources</option>
              {SOURCES_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Statuses</option>
              {STATUSES_LIST.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="rounded-xl text-xs text-muted-foreground"
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={fetchList} className="rounded-xl text-xs">
            <Filter className="size-3.5 mr-1 text-primary" /> Apply Filters
          </Button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <PhoneCall className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-foreground">No enquiries found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Add new prospective student enquiries or adjust your filter query.
            </p>
            <Button variant="hero" size="sm" asChild className="mt-4 rounded-xl text-xs font-bold">
              <Link to="/admissions/enquiries/new">
                <Plus className="size-3.5 mr-1" /> Add Enquiry
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Enquiry No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Parent & Contact</th>
                    <th className="px-4 py-3">Lead Source</th>
                    <th className="px-4 py-3">Next Follow-up</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enquiries.map((enq) => (
                    <tr key={enq.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {enq.enquiryNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-foreground">{enq.student.fullName}</p>
                        <p className="text-[10px] text-muted-foreground">{enq.createdAt.split("T")[0]}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {enq.student.interestedClass}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-foreground">{enq.parent.mobile}</p>
                        <p className="text-[10px] text-muted-foreground">{enq.parent.fatherName || enq.parent.guardianName || "Parent"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {enq.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {enq.nextFollowUpAt || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(enq.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild className="size-7 rounded-lg">
                            <Link to="/admissions/enquiries/$enquiryId" params={{ enquiryId: enq.id }}>
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Schedule Follow-up"
                            onClick={() => setFollowUpEnquiry(enq)}
                            className="size-7 rounded-lg text-primary hover:bg-primary/10"
                          >
                            <Clock className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid gap-3 p-4 lg:hidden">
              {enquiries.map((enq) => (
                <div key={enq.id} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-primary">{enq.enquiryNumber}</p>
                      <p className="font-bold text-sm text-foreground">{enq.student.fullName}</p>
                    </div>
                    {getStatusBadge(enq.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                    <div>Class: <strong className="text-foreground">{enq.student.interestedClass}</strong></div>
                    <div>Phone: <strong className="text-foreground font-mono">{enq.parent.mobile}</strong></div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <Button variant="outline" size="sm" onClick={() => setFollowUpEnquiry(enq)} className="rounded-xl text-xs">
                      <Clock className="size-3.5 mr-1" /> Follow-up
                    </Button>
                    <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
                      <Link to="/admissions/enquiries/$enquiryId" params={{ enquiryId: enq.id }}>
                        <Eye className="size-3.5 mr-1" /> View CRM
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Schedule Follow-up Quick Modal */}
      {followUpEnquiry && (
        <Dialog open={!!followUpEnquiry} onOpenChange={(open) => !open && setFollowUpEnquiry(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleScheduleFollowUp}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Clock className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">Schedule Follow-up</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  Set follow-up reminder for <strong className="text-foreground">{followUpEnquiry.student.fullName}</strong> ({followUpEnquiry.parent.mobile})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Follow-up Date *</Label>
                  <Input
                    type="date"
                    required
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    className="rounded-xl border-border bg-surface text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Contact Method</Label>
                  <select
                    value={fuMethod}
                    onChange={(e) => setFuMethod(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="In Person">Campus Visit / In Person</option>
                    <option value="Email">Email</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Purpose & Notes</Label>
                  <Textarea
                    value={fuPurpose}
                    onChange={(e) => setFuPurpose(e.target.value)}
                    className="rounded-xl border-border bg-surface text-xs min-h-[60px]"
                  />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFollowUpEnquiry(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" variant="hero" size="sm" disabled={isSubmittingFu || !fuDate} className="rounded-xl font-bold">
                  {isSubmittingFu ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Schedule Reminder
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
