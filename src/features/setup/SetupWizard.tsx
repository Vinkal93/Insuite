import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Calendar,
  Palette,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Loader2,
  AlertCircle,
  Sparkles,
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
  checkSchoolCodeAvailable,
  createOrganization,
  updateOrganization,
  createAcademicSession,
  uploadSchoolLogo,
} from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const SetupWizard: React.FC = () => {
  const { firebaseUser, organization, refreshUserData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Logo file upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logoUrl || null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Form states
  const schoolForm = useForm<SchoolInfoInput>({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      name: organization?.name || "",
      code: organization?.code || "",
      principalName: organization?.principalName || "",
      email: organization?.email || firebaseUser?.email || "",
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
      name: "2026-27",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      isActive: true,
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

  // Step 1: Validate School Info & unique code
  const handleStep1Submit = async (data: SchoolInfoInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const isAvailable = await checkSchoolCodeAvailable(data.code, organization?.id);
      if (!isAvailable) {
        schoolForm.setError("code", { message: "This school code is already taken. Choose another." });
        return;
      }
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to validate school information");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Validate Session
  const handleStep2Submit = async (_data: AcademicSessionInput) => {
    setCurrentStep(3);
  };

  // Step 3: Handle Logo & Branding
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleStep3Submit = async (_data: BrandingInput) => {
    setCurrentStep(4);
  };

  // Step 4: Finalize and Complete Setup
  const handleFinalSubmit = async () => {
    if (!firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const schoolData = schoolForm.getValues();
      const sessionData = sessionForm.getValues();
      const brandData = brandingForm.getValues();

      let currentOrg = organization;

      // 1. Create or Update Organization
      if (!currentOrg) {
        currentOrg = await createOrganization(firebaseUser.uid, schoolData, brandData);
      } else {
        await updateOrganization(currentOrg.id, {
          name: schoolData.name,
          code: schoolData.code.toUpperCase(),
          principalName: schoolData.principalName || null,
          email: schoolData.email || null,
          phone: schoolData.phone || null,
          alternatePhone: schoolData.alternatePhone || null,
          website: schoolData.website || null,
          address: schoolData.address || null,
          city: schoolData.city || null,
          state: schoolData.state || null,
          postalCode: schoolData.postalCode || null,
          country: schoolData.country || "India",
          primaryColor: brandData.primaryColor,
          secondaryColor: brandData.secondaryColor,
        });
      }

      // 2. Upload Logo if selected
      if (logoFile && currentOrg) {
        setIsUploadingLogo(true);
        const uploadedUrl = await uploadSchoolLogo(currentOrg.id, logoFile);
        await updateOrganization(currentOrg.id, { logoUrl: uploadedUrl });
      }

      // 3. Create Academic Session
      if (currentOrg) {
        await createAcademicSession(currentOrg.id, sessionData);

        // 4. Mark setupCompleted = true
        await updateOrganization(currentOrg.id, { setupCompleted: true });
      }

      await refreshUserData();
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Setup completion error:", err);
      setErrorMsg(err.message || "Failed to complete school setup.");
    } finally {
      setIsSubmitting(false);
      setIsUploadingLogo(false);
    }
  };

  const steps = [
    { num: 1, label: "School Info", icon: Building2 },
    { num: 2, label: "Academic Session", icon: Calendar },
    { num: 3, label: "Branding", icon: Palette },
    { num: 4, label: "Review & Complete", icon: CheckCircle2 },
  ];

  const handleSkipSetup = async () => {
    if (!organization) {
      window.location.href = "/dashboard";
      return;
    }
    setIsSubmitting(true);
    try {
      await updateOrganization(organization.id, { setupCompleted: true });
      await refreshUserData();
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      window.location.href = "/dashboard";
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      {/* Wizard Header */}
      <div className="text-center relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          InSuite Guided Onboarding
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Complete Your School Setup
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Step {currentStep} of 4 — Set up your school profile, academic calendar, and custom branding.
        </p>
        <div className="mt-3 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSkipSetup}
            disabled={isSubmitting}
            className="text-xs text-primary font-bold hover:bg-primary/10 rounded-xl"
          >
            ⚡ Skip for now & Complete details later in Settings
          </Button>
        </div>
      </div>

      {/* Stepper Progress */}
      <div className="mt-8 grid grid-cols-4 gap-2">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          return (
            <div
              key={s.num}
              className={`flex items-center gap-2 rounded-2xl border p-3 transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : isDone
                    ? "border-success/30 bg-success/5 text-success"
                    : "border-border bg-card text-muted-foreground opacity-60"
              }`}
            >
              <div
                className={`grid size-7 place-items-center rounded-xl text-xs font-bold ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-success text-success-foreground"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {isDone ? <CheckCircle2 className="size-4" /> : s.num}
              </div>
              <span className="hidden text-xs font-bold sm:inline truncate">{s.label}</span>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Content Container */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-10">
        {/* STEP 1: School Information */}
        {currentStep === 1 && (
          <form onSubmit={schoolForm.handleSubmit(handleStep1Submit)} className="space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-lg font-bold">Step 1 — School Information</h2>
              <p className="text-xs text-muted-foreground">
                Enter official institution details and unique school identifier code.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-semibold">
                  School / Institution Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. St. Xavier's International Academy"
                  {...schoolForm.register("name")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
                {schoolForm.formState.errors.name && (
                  <p className="text-[11px] text-destructive">{schoolForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-semibold">
                  School Code (Unique ID) *
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. SXIA-DELHI"
                  {...schoolForm.register("code")}
                  onChange={(e) => schoolForm.setValue("code", e.target.value.toUpperCase())}
                  className="rounded-xl border-border bg-surface font-mono uppercase text-xs"
                />
                {schoolForm.formState.errors.code && (
                  <p className="text-[11px] text-destructive">{schoolForm.formState.errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="principalName" className="text-xs font-semibold">
                  Principal / Director Name
                </Label>
                <Input
                  id="principalName"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  {...schoolForm.register("principalName")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Official Contact Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@school.com"
                  {...schoolForm.register("email")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  {...schoolForm.register("phone")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alternatePhone" className="text-xs font-semibold">
                  Alternate Phone
                </Label>
                <Input
                  id="alternatePhone"
                  placeholder="Office Landline"
                  {...schoolForm.register("alternatePhone")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-semibold">
                  School Website
                </Label>
                <Input
                  id="website"
                  placeholder="https://yourschool.com"
                  {...schoolForm.register("website")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address" className="text-xs font-semibold">
                  Campus Address
                </Label>
                <Input
                  id="address"
                  placeholder="Street address, Sector, Landmark"
                  {...schoolForm.register("address")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold">
                  City
                </Label>
                <Input
                  id="city"
                  placeholder="e.g. New Delhi"
                  {...schoolForm.register("city")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-semibold">
                  State / Province
                </Label>
                <Input
                  id="state"
                  placeholder="e.g. Delhi"
                  {...schoolForm.register("state")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="postalCode" className="text-xs font-semibold">
                  PIN / Postal Code
                </Label>
                <Input
                  id="postalCode"
                  placeholder="110001"
                  {...schoolForm.register("postalCode")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-semibold">
                  Country
                </Label>
                <Input
                  id="country"
                  placeholder="India"
                  {...schoolForm.register("country")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl font-bold">
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save & Continue <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Academic Session */}
        {currentStep === 2 && (
          <form onSubmit={sessionForm.handleSubmit(handleStep2Submit)} className="space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-lg font-bold">Step 2 — Academic Session</h2>
              <p className="text-xs text-muted-foreground">
                Define the primary academic year session. Historical records will be scoped to this session.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sessionName" className="text-xs font-semibold">
                  Session Name (e.g. 2026-27) *
                </Label>
                <Input
                  id="sessionName"
                  placeholder="2026-27"
                  {...sessionForm.register("name")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
                {sessionForm.formState.errors.name && (
                  <p className="text-[11px] text-destructive">{sessionForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold">
                  Session Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...sessionForm.register("startDate")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-semibold">
                  Session End Date *
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...sessionForm.register("endDate")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
                {sessionForm.formState.errors.endDate && (
                  <p className="text-[11px] text-destructive">{sessionForm.formState.errors.endDate.message}</p>
                )}
              </div>

              <div className="sm:col-span-2 flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isActive"
                  checked={sessionForm.watch("isActive")}
                  onCheckedChange={(c) => sessionForm.setValue("isActive", !!c)}
                />
                <label htmlFor="isActive" className="text-xs font-medium text-muted-foreground cursor-pointer">
                  Set this as the currently Active Academic Session
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="rounded-xl">
                <ArrowLeft className="size-4 mr-1.5" /> Back
              </Button>
              <Button type="submit" variant="hero" className="rounded-xl font-bold">
                Save & Continue <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Branding */}
        {currentStep === 3 && (
          <form onSubmit={brandingForm.handleSubmit(handleStep3Submit)} className="space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-lg font-bold">Step 3 — School Branding</h2>
              <p className="text-xs text-muted-foreground">
                Upload your crest/logo and select primary institutional colors for portals and report cards.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo Upload Box */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">School Logo / Emblem</Label>
                <div className="flex items-center gap-4 rounded-2xl border border-dashed border-border p-4 bg-surface/50">
                  <div className="relative flex size-16 shrink-0 items-center justify-center rounded-xl bg-card border border-border p-1 shadow-sm">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="size-full object-contain" />
                    ) : (
                      <Building2 className="size-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div>
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logoUpload")?.click()}
                      className="rounded-xl text-xs"
                    >
                      <Upload className="size-3.5 mr-1.5" /> Select Logo Image
                    </Button>
                    <p className="mt-1 text-[10px] text-muted-foreground">PNG, JPG, or SVG up to 5MB</p>
                  </div>
                </div>
              </div>

              {/* Color Themes */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="primaryColor" className="text-xs font-semibold">
                    Primary Brand Color
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="primaryColor"
                      type="color"
                      {...brandingForm.register("primaryColor")}
                      className="size-8 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      type="text"
                      {...brandingForm.register("primaryColor")}
                      className="rounded-xl border-border bg-surface font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor" className="text-xs font-semibold">
                    Secondary Accent Color
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      id="secondaryColor"
                      type="color"
                      {...brandingForm.register("secondaryColor")}
                      className="size-8 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      type="text"
                      {...brandingForm.register("secondaryColor")}
                      className="rounded-xl border-border bg-surface font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Branding Preview Card */}
            <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Live Branding Preview
              </p>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-card border border-border p-3 shadow-sm">
                <div className="size-10 flex items-center justify-center rounded-lg bg-card border border-border p-1">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="size-full object-contain" />
                  ) : (
                    <img src="/logo.png" alt="InSuite Default" className="size-full object-contain" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-extrabold text-foreground">
                    {schoolForm.watch("name") || "Your School Name"}
                  </p>
                  <p className="text-[11px] font-mono text-primary font-bold">
                    Code: {schoolForm.watch("code") || "SCH-001"}
                  </p>
                </div>
                <div className="ml-auto flex gap-1.5">
                  <div
                    className="size-5 rounded-md border border-border"
                    style={{ backgroundColor: brandingForm.watch("primaryColor") }}
                  />
                  <div
                    className="size-5 rounded-md border border-border"
                    style={{ backgroundColor: brandingForm.watch("secondaryColor") }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="rounded-xl">
                <ArrowLeft className="size-4 mr-1.5" /> Back
              </Button>
              <Button type="submit" variant="hero" className="rounded-xl font-bold">
                Review Setup <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Review & Finalize */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-lg font-bold">Step 4 — Review & Complete Setup</h2>
              <p className="text-xs text-muted-foreground">
                Verify your institutional configuration before launching your InSuite dashboard.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                <p className="font-bold text-primary uppercase tracking-wider text-[11px]">School Profile</p>
                <p><span className="text-muted-foreground">Name:</span> <strong className="text-foreground">{schoolForm.getValues("name")}</strong></p>
                <p><span className="text-muted-foreground">Code:</span> <strong className="font-mono text-foreground">{schoolForm.getValues("code")}</strong></p>
                <p><span className="text-muted-foreground">Principal:</span> <span className="text-foreground">{schoolForm.getValues("principalName") || "—"}</span></p>
                <p><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{schoolForm.getValues("email") || "—"}</span></p>
                <p><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{schoolForm.getValues("phone") || "—"}</span></p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                <p className="font-bold text-primary uppercase tracking-wider text-[11px]">Academic & Branding</p>
                <p><span className="text-muted-foreground">Active Session:</span> <strong className="text-foreground">{sessionForm.getValues("name")}</strong></p>
                <p><span className="text-muted-foreground">Duration:</span> <span className="text-foreground">{sessionForm.getValues("startDate")} to {sessionForm.getValues("endDate")}</span></p>
                <p><span className="text-muted-foreground">Primary Color:</span> <span className="font-mono text-foreground">{brandingForm.getValues("primaryColor")}</span></p>
                <p><span className="text-muted-foreground">Logo Attached:</span> <span className="text-foreground">{logoFile ? logoFile.name : "Default / Uploaded"}</span></p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(3)}
                className="rounded-xl"
              >
                <ArrowLeft className="size-4 mr-1.5" /> Back
              </Button>
              <Button
                type="button"
                variant="hero"
                size="lg"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="rounded-xl font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {isUploadingLogo ? "Uploading Logo..." : "Finalizing Setup..."}
                  </>
                ) : (
                  <>
                    Complete Setup & Launch Dashboard <ArrowRight className="size-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
