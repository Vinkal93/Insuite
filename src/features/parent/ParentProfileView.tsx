import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Users, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import { updateParent } from "@/services/parentService";
import { Button } from "@/components/ui/button";

export const ParentProfileView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const { parent, children: kids, refreshParentData } = useParent();

  const [mobile, setMobile] = useState(parent?.mobile || "");
  const [email, setEmail] = useState(parent?.email || "");
  const [address, setAddress] = useState(parent?.address || "");
  const [occupation, setOccupation] = useState(parent?.occupation || "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !parent || !firebaseUser) return;

    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await updateParent(
        organization.id,
        parent.id,
        { mobile, email, address, occupation },
        { uid: firebaseUser.uid, name: userProfile?.name || "Parent" }
      );
      setSavedSuccess(true);
      await refreshParentData();
    } catch (err: any) {
      alert("Failed to save profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Parent Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Family contact details, residential address, and linked student guardianships.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft text-center space-y-4">
          <div className="size-20 rounded-3xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center mx-auto border border-primary/20">
            {parent?.firstName?.charAt(0) || "P"}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">{parent?.fullName || "Parent"}</h2>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              {parent?.relation || "Guardian"}
            </span>
          </div>

          <div className="text-left bg-surface/50 p-4 rounded-2xl border border-border space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-foreground truncate">{parent?.mobile || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-foreground truncate">{parent?.email || "—"}</span>
            </div>
          </div>
        </div>

        {/* Edit Form & Linked Children */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Contact & Address Information</h3>

            {savedSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="size-4" /> Profile updated successfully.
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isSaving}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          {/* Linked Children List */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Users className="size-4 text-primary" /> Linked Children ({kids.length})
            </h3>
            <div className="space-y-2">
              {kids.map((kid) => (
                <div
                  key={kid.id}
                  className="p-3 rounded-2xl bg-surface/50 border border-border flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-foreground">{kid.fullName}</span>
                  <span className="text-muted-foreground font-semibold">
                    Class {kid.academic.className} ({kid.academic.sectionName})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
