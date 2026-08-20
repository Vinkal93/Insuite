import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, UserCheck, Ticket, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { registerAndCheckInVisitor } from "@/services/frontOfficeService";
import { listStaff } from "@/services/hrService";
import { getTeachers } from "@/services/academicService";
import type { VisitorType } from "@/types/frontOffice";
import type { Staff } from "@/types/staff";
import { Button } from "@/components/ui/button";

export const RegisterVisitorView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [visitorType, setVisitorType] = useState<VisitorType>("Parent");
  const [idType, setIdType] = useState("National ID / Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedPersonName, setSelectedPersonName] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadStaffMembers = async () => {
      if (!organization) return;
      try {
        const staff = await listStaff(organization.id);
        setStaffList(staff);
        if (staff.length > 0) {
          setSelectedPersonId(staff[0].id);
          setSelectedPersonName(staff[0].fullName);
          setDepartmentName(staff[0].department || "Academics");
        }
      } catch (err) {
        console.error("loadStaff error:", err);
      }
    };
    loadStaffMembers();
  }, [organization]);

  const handleStaffChange = (staffId: string) => {
    setSelectedPersonId(staffId);
    const s = staffList.find((x) => x.id === staffId);
    if (s) {
      setSelectedPersonName(s.fullName);
      setDepartmentName(s.department || "Academics");
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !name.trim() || !mobile.trim() || !purpose.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Mask ID Number if provided
      let maskedId = idNumber.trim();
      if (maskedId.length > 4) {
        maskedId = "XXXX-" + maskedId.slice(-4);
      }

      const res = await registerAndCheckInVisitor(
        organization.id,
        {
          visitor: {
            name: name.trim(),
            mobile: mobile.trim(),
            email: email.trim(),
            organizationName: organizationName.trim(),
            visitorType,
            idType,
            idNumber: maskedId,
            vehicleNumber: vehicleNumber.trim(),
            notes: notes.trim(),
          },
          personToMeetId: selectedPersonId || "admin-desk",
          personToMeetName: selectedPersonName || "School Administration",
          departmentName,
          purpose: purpose.trim(),
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Receptionist" }
      );

      alert(`Visitor ${name} checked in! Gate Pass #${res.gatePass.passNumber} issued.`);
      navigate({ to: `/front-office/gate-passes/${res.gatePass.id}` });
    } catch (err: any) {
      alert("Failed to check in visitor: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/front-office/visitors"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Visitor Fast Check-In</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register visitor identity, purpose of visit, and issue immediate digital gate pass.
          </p>
        </div>
      </div>

      <form onSubmit={handleCheckInSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5 text-xs">
        {/* Basic Visitor Details */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-foreground">1. Visitor Identification</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Visitor Type *</label>
              <select
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value as VisitorType)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Vendor">Vendor / Supplier</option>
                <option value="Delivery">Delivery / Courier</option>
                <option value="Official">Government / Official</option>
                <option value="Alumni">Alumni</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Organization / Affiliation</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Company / School Name"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Vehicle Number</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. DL 01 AB 1234"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">ID Proof Type</label>
              <input
                type="text"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                placeholder="e.g. Driver License / Aadhaar"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">ID Number (Masked)</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="e.g. 1234-5678-9012"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Meeting & Purpose Details */}
        <div className="space-y-3 pt-3 border-t border-border">
          <h3 className="font-extrabold text-sm text-foreground">2. Visit Information</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Person To Meet *</label>
              <select
                value={selectedPersonId}
                onChange={(e) => handleStaffChange(e.target.value)}
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
              <label className="block font-semibold text-foreground mb-1">Purpose of Visit *</label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Fee enquiry, Parent conference, Document collection"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Reception Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional security observations or luggage items..."
              className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !name.trim() || !mobile.trim() || !purpose.trim()}
            className="rounded-xl text-xs font-bold"
          >
            <UserCheck className="size-3.5 mr-1.5" />
            {isSubmitting ? "Checking In..." : "Check In & Generate Gate Pass"}
          </Button>
        </div>
      </form>
    </div>
  );
};
