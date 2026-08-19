import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import {
  FileCheck,
  User,
  Users,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { applicationSchema, type ApplicationFormInput } from "@/schemas/admission";
import { createApplication } from "@/services/admissionService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CLASSES_LIST = [
  "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4",
  "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
];

const STEPS = [
  { id: 1, label: "Candidate", icon: User },
  { id: 2, label: "Parents", icon: Users },
  { id: 3, label: "Address", icon: MapPin },
  { id: 4, label: "Academic History", icon: GraduationCap },
  { id: 5, label: "Placement", icon: Sparkles },
  { id: 6, label: "Review & Submit", icon: FileCheck },
];

export const NewApplicationForm: React.FC = () => {
  const { organization, selectedSession, allSessions, firebaseUser, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ApplicationFormInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dob: "",
      gender: "MALE",
      nationality: "Indian",
      religion: "Hindu",
      category: "General",
      bloodGroup: "O+",
      mobile: "",
      email: "",
      addressLine: "",
      city: "",
      state: "",
      postalCode: "",
      sessionId: selectedSession?.id || (allSessions[0]?.id ?? ""),
      applyingClass: "Class 1",
      sectionPreference: "Section A",
      previousSchool: "",
      previousBoard: "CBSE",
      previousGradePercentage: "",
    },
  });

  const formValues = watch();

  const handleNext = async () => {
    let fieldsToValidate: (keyof ApplicationFormInput)[] = [];
    if (currentStep === 1) fieldsToValidate = ["firstName", "lastName", "dob", "gender"];
    if (currentStep === 2) fieldsToValidate = ["mobile"];
    if (currentStep === 3) fieldsToValidate = ["addressLine"];
    if (currentStep === 5) fieldsToValidate = ["sessionId", "applyingClass"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async (data: ApplicationFormInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const sessionObj = allSessions.find((s) => s.id === data.sessionId);
      const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");

      const app = await createApplication(
        organization.id,
        {
          organizationId: organization.id,
          academicSessionId: data.sessionId,
          sessionName: sessionObj?.name,
          enquiryId: data.enquiryId,
          student: {
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            fullName,
            dob: data.dob,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            nationality: data.nationality,
            religion: data.religion,
            category: data.category,
          },
          parent: {
            fatherName: data.fatherName,
            fatherMobile: data.fatherMobile,
            fatherEmail: data.fatherEmail,
            fatherOccupation: data.fatherOccupation,
            motherName: data.motherName,
            motherMobile: data.motherMobile,
            motherEmail: data.motherEmail,
            motherOccupation: data.motherOccupation,
            guardianName: data.guardianName,
            guardianMobile: data.guardianMobile,
            guardianRelation: data.guardianRelation,
          },
          contact: {
            mobile: data.mobile,
            email: data.email,
            addressLine: data.addressLine,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
          },
          academicHistory: {
            previousSchool: data.previousSchool,
            previousClass: data.previousClass,
            previousBoard: data.previousBoard,
            previousGradePercentage: data.previousGradePercentage,
            transferCertificateNo: data.transferCertificateNo,
          },
          applyingClass: data.applyingClass,
          sectionPreference: data.sectionPreference,
          documents: [],
          status: "Submitted",
          createdBy: firebaseUser.uid,
          updatedBy: firebaseUser.uid,
        },
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );

      window.location.href = `/admissions/applications/${app.id}`;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit admission application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
          <Link to="/admissions/applications">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">New Admission Application</h1>
          <p className="text-xs text-muted-foreground">
            Complete formal enrollment application with candidate and guardian credentials.
          </p>
        </div>
      </div>

      {/* Wizard Step Pills */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isDone = s.id < currentStep;
          const isCurrent = s.id === currentStep;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-2 rounded-2xl border p-2.5 transition-all ${
                isCurrent
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                  : isDone
                  ? "border-success/30 bg-success/5 text-success font-semibold"
                  : "border-border bg-card text-muted-foreground opacity-60"
              }`}
            >
              <div className={`grid size-6 place-items-center rounded-lg text-xs ${isCurrent ? "bg-primary text-white" : isDone ? "bg-success text-white" : "bg-secondary"}`}>
                {isDone ? "✓" : s.id}
              </div>
              <span className="text-[11px] truncate hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Candidate Basic */}
        {currentStep === 1 && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Step 1: Student Information</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs font-semibold">First Name *</Label>
                <Input {...register("firstName")} className="rounded-xl border-border bg-surface text-xs" />
                {errors.firstName && <p className="text-[10px] text-destructive">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">Middle Name</Label>
                <Input {...register("middleName")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Last Name *</Label>
                <Input {...register("lastName")} className="rounded-xl border-border bg-surface text-xs" />
                {errors.lastName && <p className="text-[10px] text-destructive">{errors.lastName.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">Date of Birth *</Label>
                <Input type="date" {...register("dob")} className="rounded-xl border-border bg-surface text-xs" />
                {errors.dob && <p className="text-[10px] text-destructive">{errors.dob.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">Gender *</Label>
                <select {...register("gender")} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Blood Group</Label>
                <select {...register("bloodGroup")} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Nationality</Label>
                <Input {...register("nationality")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Religion</Label>
                <Input {...register("religion")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <select {...register("category")} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Parents */}
        {currentStep === 2 && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Users className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Step 2: Parents & Guardians</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Father */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground">Father's Profile</h3>
                <div>
                  <Label className="text-xs font-semibold">Father's Name</Label>
                  <Input {...register("fatherName")} className="rounded-xl border-border bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Father's Mobile</Label>
                  <Input {...register("fatherMobile")} className="rounded-xl border-border bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Father's Occupation</Label>
                  <Input {...register("fatherOccupation")} className="rounded-xl border-border bg-card text-xs" />
                </div>
              </div>

              {/* Mother */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground">Mother's Profile</h3>
                <div>
                  <Label className="text-xs font-semibold">Mother's Name</Label>
                  <Input {...register("motherName")} className="rounded-xl border-border bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Mother's Mobile</Label>
                  <Input {...register("motherMobile")} className="rounded-xl border-border bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Mother's Occupation</Label>
                  <Input {...register("motherOccupation")} className="rounded-xl border-border bg-card text-xs" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Primary Contact Mobile *</Label>
                <Input {...register("mobile")} placeholder="+91 98765 43210" className="rounded-xl border-border bg-surface text-xs" />
                {errors.mobile && <p className="text-[10px] text-destructive">{errors.mobile.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Address */}
        {currentStep === 3 && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <MapPin className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Step 3: Residential Address</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <Label className="text-xs font-semibold">Address Line *</Label>
                <Input {...register("addressLine")} placeholder="House No, Street, Landmark..." className="rounded-xl border-border bg-surface text-xs" />
                {errors.addressLine && <p className="text-[10px] text-destructive">{errors.addressLine.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-semibold">City</Label>
                <Input {...register("city")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">State</Label>
                <Input {...register("state")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Postal / PIN Code</Label>
                <Input {...register("postalCode")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Academic History */}
        {currentStep === 4 && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <GraduationCap className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Step 4: Previous Academic Background</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">Previous School Name</Label>
                <Input {...register("previousSchool")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Previous Board</Label>
                <Input {...register("previousBoard")} placeholder="CBSE / ICSE / State Board" className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Last Passed Class</Label>
                <Input {...register("previousClass")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Percentage / Grade Obtained</Label>
                <Input {...register("previousGradePercentage")} placeholder="e.g. 88.5% or Grade A" className="rounded-xl border-border bg-surface text-xs" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Transfer Certificate (TC) Number</Label>
                <Input {...register("transferCertificateNo")} className="rounded-xl border-border bg-surface text-xs" />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Class Placement */}
        {currentStep === 5 && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Step 5: Academic Placement</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">Academic Session *</Label>
                <select {...register("sessionId")} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                  {allSessions.map((s) => (
                    <option key={s.id} value={s.id}>Session {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Applying Class *</Label>
                <select {...register("applyingClass")} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                  {CLASSES_LIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Section Preference</Label>
                <select {...register("sectionPreference")} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Section C">Section C</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review & Final Submission */}
        {currentStep === 6 && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FileCheck className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Step 6: Review & Submit Application</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-1.5">
                <p className="text-muted-foreground font-semibold">Candidate</p>
                <p className="text-sm font-bold text-foreground">{formValues.firstName} {formValues.lastName}</p>
                <p>Gender: {formValues.gender} • DOB: {formValues.dob}</p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-4 space-y-1.5">
                <p className="text-muted-foreground font-semibold">Class Applying</p>
                <p className="text-sm font-bold text-primary">{formValues.applyingClass}</p>
                <p>Section Preference: {formValues.sectionPreference}</p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-4 space-y-1.5">
                <p className="text-muted-foreground font-semibold">Primary Contact</p>
                <p className="text-sm font-bold font-mono text-foreground">{formValues.mobile}</p>
                <p>{formValues.fatherName ? `Father: ${formValues.fatherName}` : formValues.motherName ? `Mother: ${formValues.motherName}` : ""}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-secondary/50 p-4 text-xs text-muted-foreground">
              By submitting, this application will be logged under <strong>Submitted</strong> status for administrative review and document verification.
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="rounded-xl text-xs"
          >
            <ArrowLeft className="size-3.5 mr-1" /> Previous
          </Button>

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              variant="hero"
              size="sm"
              onClick={handleNext}
              className="rounded-xl text-xs font-bold"
            >
              Continue <ArrowRight className="size-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold px-6"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Submit Admission Application
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
