import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listCampaigns,
  createCampaign,
  listEnquiries,
  listApplications,
  listAdmissions,
} from "@/services/admissionService";
import type {
  AdmissionCampaign,
  Enquiry,
  Application,
  AdmissionRecord,
  EnquirySource,
} from "@/types/admission";
import { Button } from "@/components/ui/button";

export const AdmissionCampaignsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<AdmissionCampaign[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Campaign Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [source, setSource] = useState<EnquirySource>("Advertisement");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cList, eList, appList, admList] = await Promise.all([
        listCampaigns(organization.id),
        listEnquiries(organization.id),
        listApplications(organization.id),
        listAdmissions(organization.id),
      ]);
      setCampaigns(cList);
      setEnquiries(eList);
      setApplications(appList);
      setAdmissions(admList);
    } catch (err: any) {
      console.error("loadCampaigns error:", err);
      setError(err.message || "Failed to load marketing campaigns.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    if (!name.trim()) {
      alert("Campaign name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCampaign(
        organization.id,
        {
          name: name.trim(),
          source,
          startDate,
          endDate: endDate || null,
          budget: Number(budget) || null,
          status: "Active",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowModal(false);
      setName("");
      setEndDate("");
      setBudget(0);
      await loadData();
    } catch (err: any) {
      alert("Failed to create campaign: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Admission Outreach & Campaigns
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track lead acquisition campaigns, marketing channels, and true enquiry-to-admission conversion ROI.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => setShowModal(true)}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Launch Campaign
        </Button>
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
      ) : campaigns.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Megaphone className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No marketing campaigns registered</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Track admission billboards, newspaper ads, Google/Meta social campaigns, and school open house drives.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Launch Campaign
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const matchedEnquiries = enquiries.filter((e) => e.source === c.source);
            const conversionCount = matchedEnquiries.filter((e) => e.status === "Converted").length;
            const convRate = matchedEnquiries.length > 0 ? ((conversionCount / matchedEnquiries.length) * 100).toFixed(1) : "0.0";

            return (
              <div
                key={c.id}
                className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{c.name}</h3>
                    <span className="text-[10px] font-semibold text-primary">{c.source}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      c.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-surface/50 p-3 rounded-2xl border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Leads Generated</span>
                    <span className="font-mono font-bold text-foreground">{matchedEnquiries.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Conversion Rate</span>
                    <span className="font-mono font-bold text-emerald-600">{convRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Allocated Budget</span>
                    <span className="font-mono font-semibold text-foreground">
                      {c.budget ? `₹${c.budget.toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Start Date</span>
                    <span className="font-mono text-muted-foreground">{c.startDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Launch Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Launch Outreach Campaign</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 2026 Academic Session Social Media Drive"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Primary Channel *
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Social Media">Social Media (Meta/Instagram)</option>
                    <option value="Advertisement">Print / Billboard Ads</option>
                    <option value="Website">School Website / SEO</option>
                    <option value="School Event">Open House / School Event</option>
                    <option value="Referral">Parent Referral Program</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Launching..." : "Launch Campaign"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
