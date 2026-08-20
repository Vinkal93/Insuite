import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createHostel } from "@/services/hostelService";
import { listStaff } from "@/services/hrService";
import type { HostelType, HostelStatus } from "@/types/hostel";
import type { Staff } from "@/types/staff";
import { Button } from "@/components/ui/button";

export const CreateHostelView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<HostelType>("Boys");
  const [capacity, setCapacity] = useState(50);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<HostelStatus>("Active");

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedWardenId, setSelectedWardenId] = useState("");
  const [selectedWardenName, setSelectedWardenName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadStaff = async () => {
      if (!organization) return;
      try {
        const staff = await listStaff(organization.id);
        setStaffList(staff);
        if (staff.length > 0) {
          setSelectedWardenId(staff[0].id);
          setSelectedWardenName(staff[0].fullName);
        }
      } catch (err) {
        console.error("loadStaff error:", err);
      }
    };
    loadStaff();
  }, [organization]);

  const handleWardenChange = (staffId: string) => {
    setSelectedWardenId(staffId);
    const s = staffList.find((x) => x.id === staffId);
    if (s) setSelectedWardenName(s.fullName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    try {
      await createHostel(
        organization.id,
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
          capacity: Number(capacity) || 0,
          wardenId: selectedWardenId || undefined,
          wardenName: selectedWardenName || undefined,
          description: description.trim(),
          status,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      alert(`Hostel "${name}" created successfully.`);
      navigate({ to: "/hostel/hostels" });
    } catch (err: any) {
      alert("Failed to create hostel: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/hostel/hostels"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Add New Hostel</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure hostel block, capacity, gender assignment, and chief warden.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Hostel Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tagore Boys Hostel"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Hostel Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. HST-TBH"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none uppercase"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block font-semibold text-foreground mb-1">Hostel Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as HostelType)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
            >
              <option value="Boys">Boys Hostel</option>
              <option value="Girls">Girls Hostel</option>
              <option value="Mixed">Mixed / Co-ed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Total Bed Capacity *</label>
            <input
              type="number"
              min={1}
              required
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HostelStatus)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Designated Chief Warden</label>
          <select
            value={selectedWardenId}
            onChange={(e) => handleWardenChange(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.designation || "Staff"} • {s.department || "General"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Description / Location</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. North Campus Residential Sector, Block A"
            className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !name.trim() || !code.trim()}
            className="rounded-xl text-xs font-bold"
          >
            <Save className="size-3.5 mr-1.5" />
            {isSubmitting ? "Creating..." : "Save Hostel"}
          </Button>
        </div>
      </form>
    </div>
  );
};
