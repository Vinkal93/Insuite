import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Calendar,
  Palette,
  User,
  Plus,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
  CalendarDays,
  Send,
} from "lucide-react";
import {
  schoolInfoSchema,
  academicSessionSchema,
  brandingSchema,
  type SchoolInfoInput,
  type AcademicSessionInput,
  type BrandingInput,
} from "@/schemas";
import {
  updateOrganization,
  createAcademicSession,
  getAcademicSessions,
  uploadSchoolLogo,
} from "@/services";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import type { AcademicSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const SettingsView: React.FC = () => {
  const { firebaseUser, organization, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<"school" | "session" | "branding" | "account">("school");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sessions list
  const [sessionsList, setSessionsList] = useState<AcademicSession[]>([]);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // Branding logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logoUrl || null);

  const schoolForm = useForm<SchoolInfoInput>({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      name: organization?.name || "",
      code: organization?.code || "",
      principalName: organization?.principalName || "",
      email: organization?.email || "",
      phone: organization?.phone || "",
      alternatePhone: organization?.alternatePhone || "",
      website: organization?.website || "",
      address: organization?.address || "",
      city: organization?.city || "",
      state: organization?.state || "",
      postalCode: organization?.postalCode || "",
      country: organization?.country || "India",
    },
  });

  const sessionForm = useForm<AcademicSessionInput>({
    resolver: zodResolver(academicSessionSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      isActive: false,
    },
  });

  const brandingForm = useForm<BrandingInput>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      displayName: organization?.name || "",
      primaryColor: organization?.primaryColor || "#1E40AF",
      secondaryColor: organization?.secondaryColor || "#F59E0B",
      logoUrl: organization?.logoUrl || "",
    },
  });

  useEffect(() => {
    if (organization) {
      getAcademicSessions(organization.id).then((list) => setSessionsList(list));
    }
  }, [organization]);

  const onSaveSchoolInfo = async (data: SchoolInfoInput) => {
    if (!organization) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateOrganization(organization.id, {
        name: data.name,
        code: data.code.toUpperCase(),
        principalName: data.principalName || null,
        email: data.email || null,
        phone: data.phone || null,
        alternatePhone: data.alternatePhone || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || "India",
      });
      await refreshUserData();
      setSuccessMsg("School profile updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update school info.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCreateSession = async (data: AcademicSessionInput) => {
    if (!organization) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await createAcademicSession(organization.id, data);
      const list = await getAcademicSessions(organization.id);
      setSessionsList(list);
      await refreshUserData();
      setShowNewSessionModal(false);
      sessionForm.reset();
      setSuccessMsg("Academic session created successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create academic session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveBranding = async (data: BrandingInput) => {
    if (!organization) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      let uploadedLogoUrl = organization.logoUrl;
      if (logoFile) {
        uploadedLogoUrl = await uploadSchoolLogo(organization.id, logoFile);
      }

      await updateOrganization(organization.id, {
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        logoUrl: uploadedLogoUrl,
      });

      await refreshUserData();
      setSuccessMsg("Branding updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update branding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!firebaseUser?.email) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await sendPasswordResetEmail(auth, firebaseUser.email);
      setSuccessMsg(`Password reset email sent to ${firebaseUser.email}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "school", label: "School Information", icon: Building2 },
    { id: "session", label: "Academic Sessions", icon: Calendar },
    { id: "branding", label: "School Branding", icon: Palette },
    { id: "account", label: "My Account", icon: User },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-xs text-muted-foreground">
          Phase 1 institutional settings and organizational configurations.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/20 bg-success/10 p-3.5 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: School Information */}
      {activeTab === "school" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <form onSubmit={schoolForm.handleSubmit(onSaveSchoolInfo)} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Institution Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-semibold">School Name *</Label>
                <Input id="name" {...schoolForm.register("name")} className="rounded-xl border-border bg-surface text-xs" />
                {schoolForm.formState.errors.name && <p className="text-[11px] text-destructive">{schoolForm.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">School Code *</Label>
                <Input id="code" {...schoolForm.register("code")} className="rounded-xl border-border bg-surface font-mono uppercase text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="principalName" className="text-xs font-semibold">Principal Name</Label>
                <Input id="principalName" {...schoolForm.register("principalName")} className="rounded-xl border-border bg-surface text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">Official Contact Email</Label>
                <Input id="email" type="email" {...schoolForm.register("email")} className="rounded-xl border-border bg-surface text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                <Input id="phone" {...schoolForm.register("phone")} className="rounded-xl border-border bg-surface text-xs" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address" className="text-xs font-semibold">Address</Label>
                <Input id="address" {...schoolForm.register("address")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl font-bold">
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save School Information
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Academic Sessions */}
      {activeTab === "session" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Configured Academic Sessions
              </h2>
              <p className="text-xs text-muted-foreground">
                Historical records are partitioned by academic sessions.
              </p>
            </div>
            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={() => setShowNewSessionModal((v) => !v)}
              className="rounded-xl"
            >
              <Plus className="size-3.5 mr-1" /> Add New Session
            </Button>
          </div>

          {showNewSessionModal && (
            <form
              onSubmit={sessionForm.handleSubmit(onCreateSession)}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4"
            >
              <h3 className="text-xs font-bold uppercase text-primary">Create Academic Year Session</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="sName" className="text-xs font-semibold">Session Name (e.g. 2027-28)</Label>
                  <Input id="sName" placeholder="2027-28" {...sessionForm.register("name")} className="rounded-xl bg-card text-xs" />
                  {sessionForm.formState.errors.name && <p className="text-[10px] text-destructive">{sessionForm.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="sStart" className="text-xs font-semibold">Start Date</Label>
                  <Input id="sStart" type="date" {...sessionForm.register("startDate")} className="rounded-xl bg-card text-xs" />
                </div>
                <div>
                  <Label htmlFor="sEnd" className="text-xs font-semibold">End Date</Label>
                  <Input id="sEnd" type="date" {...sessionForm.register("endDate")} className="rounded-xl bg-card text-xs" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newActive"
                  checked={sessionForm.watch("isActive")}
                  onCheckedChange={(c) => sessionForm.setValue("isActive", !!c)}
                />
                <label htmlFor="newActive" className="text-xs font-medium cursor-pointer">
                  Make this the active session
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewSessionModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" variant="hero" size="sm" disabled={isSubmitting} className="rounded-xl">
                  {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Save Session
                </Button>
              </div>
            </form>
          )}

          {/* Session Cards List */}
          <div className="grid gap-3 sm:grid-cols-2">
            {sessionsList.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                  session.isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-card border border-border">
                    <CalendarDays className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-sm text-foreground">{session.name}</p>
                      {session.isActive && (
                        <span className="rounded bg-primary px-2 py-0.5 text-[9px] font-bold uppercase text-primary-foreground">
                          Active Session
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {session.startDate} to {session.endDate}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Branding */}
      {activeTab === "branding" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <form onSubmit={brandingForm.handleSubmit(onSaveBranding)} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Visual Identity & Custom Theme
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">School Logo</Label>
                <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-4 bg-surface">
                  <div className="flex size-14 items-center justify-center rounded-xl bg-card border border-border p-1">
                    <img src={logoPreview || "/logo.png"} alt="Logo" className="size-full object-contain" />
                  </div>
                  <div>
                    <input
                      id="brandLogo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setLogoFile(e.target.files[0]);
                          setLogoPreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("brandLogo")?.click()}
                      className="rounded-xl text-xs"
                    >
                      <Upload className="size-3.5 mr-1" /> Replace Logo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="primaryColor" className="text-xs font-semibold">Primary Brand Color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      {...brandingForm.register("primaryColor")}
                      className="size-8 rounded-lg border border-border cursor-pointer"
                    />
                    <Input {...brandingForm.register("primaryColor")} className="rounded-xl font-mono text-xs" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor" className="text-xs font-semibold">Secondary Accent Color</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="secondaryColor"
                      type="color"
                      {...brandingForm.register("secondaryColor")}
                      className="size-8 rounded-lg border border-border cursor-pointer"
                    />
                    <Input {...brandingForm.register("secondaryColor")} className="rounded-xl font-mono text-xs" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl font-bold">
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save Branding Settings
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: My Account */}
      {activeTab === "account" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
          <div className="space-y-2 pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Security & Credentials
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your login password and active sessions.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <p className="text-xs font-bold text-foreground">Password Management</p>
            <p className="text-xs text-muted-foreground">
              Click below to send a secure password reset email to{" "}
              <strong className="text-foreground font-mono">{firebaseUser?.email}</strong>.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              <Send className="size-3.5 mr-1.5" /> Send Password Reset Email
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
