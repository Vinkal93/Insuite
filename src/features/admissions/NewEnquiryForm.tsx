import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import {
  PhoneCall,
  User,
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { enquirySchema, type EnquiryFormInput } from "@/schemas/admission";
import { createEnquiry } from "@/services/admissionService";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CLASSES_LIST = [
  "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4",
  "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
];

const SOURCES_LIST = [
  "Website", "Walk-in", "Phone", "WhatsApp", "Referral", "Advertisement", "Social Media", "School Event", "Other"
];

export const NewEnquiryForm: React.FC = () => {
  const { organization, selectedSession, allSessions, firebaseUser, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnquiryFormInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      interestedClass: "Class 1",
      sessionId: selectedSession?.id || (allSessions[0]?.id ?? ""),
      source: "Walk-in",
      preferredContactMethod: "Call",
      mobile: "",
      email: "",
    } as any,
  });

  const onSubmit = async (data: EnquiryFormInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const sessionObj = allSessions.find((s) => s.id === data.sessionId);
      const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");

      const enq = await createEnquiry(
        organization.id,
        {
          organizationId: organization.id,
          academicSessionId: data.sessionId,
          sessionName: sessionObj?.name,
          student: {
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            fullName,
            dob: data.dob,
            gender: data.gender,
            interestedClass: data.interestedClass,
            interestedCourse: data.interestedCourse,
          },
          parent: {
            fatherName: data.fatherName,
            motherName: data.motherName,
            guardianName: data.guardianName,
            mobile: data.mobile,
            alternateMobile: data.alternateMobile,
            email: data.email || undefined,
          },
          address: {
            addressLine: data.addressLine,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
          },
          source: data.source as any,
          referralDetails: data.referralDetails,
          preferredContactMethod: data.preferredContactMethod,
          notes: data.notes,
          assignedCounsellorName: data.assignedCounsellorName || userProfile?.displayName || "Admin",
          status: "New",
          nextFollowUpAt: data.nextFollowUpAt,
          createdBy: firebaseUser.uid,
          updatedBy: firebaseUser.uid,
        },
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );

      window.location.href = `/admissions/enquiries/${enq.id}`;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create enquiry record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
          <Link to="/admissions/enquiries">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">New Prospective Enquiry</h1>
          <p className="text-xs text-muted-foreground">
            Record walk-in, phone, or online admission inquiry.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Student */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <User className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">Student Information</h2>
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
              <Label className="text-xs font-semibold">Class Applying For *</Label>
              <select
                {...register("interestedClass")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                {CLASSES_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Date of Birth</Label>
              <Input type="date" {...register("dob")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Gender</Label>
              <select
                {...register("gender")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Parent & Contact */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <PhoneCall className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">Parent & Contact Information</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-semibold">Father's Name</Label>
              <Input {...register("fatherName")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Mother's Name</Label>
              <Input {...register("motherName")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Primary Mobile *</Label>
              <Input {...register("mobile")} placeholder="+91 98765 43210" className="rounded-xl border-border bg-surface text-xs" />
              {errors.mobile && <p className="text-[10px] text-destructive">{errors.mobile.message}</p>}
            </div>
            <div>
              <Label className="text-xs font-semibold">Alternate Mobile</Label>
              <Input {...register("alternateMobile")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input type="email" {...register("email")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div>
              <Label className="text-xs font-semibold">City</Label>
              <Input {...register("city")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-xs font-semibold">Address / Locality</Label>
              <Input {...register("addressLine")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
          </div>
        </div>

        {/* Section 3: Enquiry & Lead Metadata */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Calendar className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">Lead Source & Follow-up Details</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-semibold">Academic Session *</Label>
              <select
                {...register("sessionId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                {allSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Session {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Lead Source *</Label>
              <select
                {...register("source")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                {SOURCES_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Preferred Contact Method</Label>
              <select
                {...register("preferredContactMethod")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                <option value="Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="In Person">Campus Visit</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Next Follow-up Date</Label>
              <Input type="date" {...register("nextFollowUpAt")} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold">Assigned Counsellor</Label>
              <Input {...register("assignedCounsellorName")} defaultValue={userProfile?.displayName || "Admin"} className="rounded-xl border-border bg-surface text-xs" />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-xs font-semibold">Discussion Notes / Queries</Label>
              <Textarea {...register("notes")} placeholder="Parent asked about transport and fee installments..." className="rounded-xl border-border bg-surface text-xs min-h-[70px]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/admissions/enquiries">Cancel</Link>
          </Button>
          <Button type="submit" variant="hero" size="sm" disabled={isSubmitting} className="rounded-xl font-bold px-6">
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save Enquiry
          </Button>
        </div>
      </form>
    </div>
  );
};
