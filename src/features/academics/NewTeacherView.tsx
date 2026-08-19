import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  User,
  Phone,
  Briefcase,
  ShieldAlert,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { teacherSchema, type TeacherInput } from "@/schemas";
import {
  createTeacher,
  generateTeacherEmployeeId,
  uploadTeacherPhoto,
  uploadTeacherDoc,
  getAcademicSettings,
} from "@/services";
import type { AcademicSettingsConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const NewTeacherView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AcademicSettingsConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Files
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [qualDocFile, setQualDocFile] = useState<File | null>(null);
  const [idDocFile, setIdDocFile] = useState<File | null>(null);

  const form = useForm<TeacherInput>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      personal: {
        firstName: "",
        middleName: "",
        lastName: "",
        photoUrl: null,
        dob: "",
        gender: "male",
        bloodGroup: "",
      },
      contact: {
        mobile: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
      },
      professional: {
        employeeId: "",
        joiningDate: new Date().toISOString().split("T")[0],
        department: "Mathematics",
        designation: "TGT (Trained Graduate Teacher)",
        qualification: "",
        experience: "",
        specialization: "",
      },
      emergencyContact: {
        contactName: "",
        relation: "",
        mobile: "",
      },
      status: "active",
    },
  });

  useEffect(() => {
    if (organization) {
      Promise.all([
        generateTeacherEmployeeId(organization.id),
        getAcademicSettings(organization.id),
      ]).then(([empId, sett]) => {
        form.setValue("professional.employeeId", empId);
        setSettings(sett);
      });
    }
  }, [organization]);

  const onSubmit = async (data: TeacherInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const newTeacher = await createTeacher(organization.id, data, firebaseUser.uid);

      // Upload Photo if selected
      if (photoFile) {
        await uploadTeacherPhoto(organization.id, newTeacher.id, photoFile);
      }

      // Upload Qualification document if selected
      if (qualDocFile) {
        await uploadTeacherDoc(
          organization.id,
          newTeacher.id,
          "Qualification Certificate",
          "certificate",
          qualDocFile
        );
      }

      // Upload ID proof if selected
      if (idDocFile) {
        await uploadTeacherDoc(
          organization.id,
          newTeacher.id,
          "ID Proof",
          "id_proof",
          idDocFile
        );
      }

      navigate({ to: "/academics/teachers" });
    } catch (err: any) {
      console.error("Create teacher error:", err);
      setErrorMsg(err.message || "Failed to register teacher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/academics/teachers">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Register New Faculty / Teacher
          </h1>
          <p className="text-xs text-muted-foreground">
            Create professional teacher records, assign employee credentials, and archive certificates.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION A — PERSONAL */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <User className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Section A — Personal Information
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
            <div className="flex flex-col items-center gap-2">
              <div className="size-20 rounded-2xl border border-dashed border-border bg-surface flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <User className="size-8 text-muted-foreground opacity-50" />
                )}
              </div>
              <input
                id="photoInput"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPhotoFile(e.target.files[0]);
                    setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("photoInput")?.click()}
                className="rounded-xl text-[11px]"
              >
                <Upload className="size-3 mr-1" /> Upload Photo
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 flex-1 w-full">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="e.g. Ramesh"
                  {...form.register("personal.firstName")}
                  className="rounded-xl border-border bg-surface text-xs font-bold"
                />
                {form.formState.errors.personal?.firstName && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.personal.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="middleName" className="text-xs font-semibold">Middle Name</Label>
                <Input
                  id="middleName"
                  placeholder="e.g. Kumar"
                  {...form.register("personal.middleName")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Sharma"
                  {...form.register("personal.lastName")}
                  className="rounded-xl border-border bg-surface text-xs font-bold"
                />
                {form.formState.errors.personal?.lastName && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.personal.lastName.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-semibold">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                {...form.register("personal.dob")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender" className="text-xs font-semibold">Gender *</Label>
              <select
                id="gender"
                {...form.register("personal.gender")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bloodGroup" className="text-xs font-semibold">Blood Group</Label>
              <select
                id="bloodGroup"
                {...form.register("personal.bloodGroup")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select Blood Group</option>
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
          </div>
        </div>

        {/* SECTION B — CONTACT */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Phone className="size-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Section B — Contact Details
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mobile" className="text-xs font-semibold">Primary Mobile *</Label>
              <Input
                id="mobile"
                placeholder="e.g. 9876543210"
                {...form.register("contact.mobile")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
              {form.formState.errors.contact?.mobile && (
                <p className="text-[11px] text-destructive">{form.formState.errors.contact.mobile.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="teacher@school.edu"
                {...form.register("contact.email")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address" className="text-xs font-semibold">Residential Address</Label>
              <Input
                id="address"
                placeholder="House No, Street, Landmark"
                {...form.register("contact.address")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold">City</Label>
              <Input
                id="city"
                placeholder="e.g. New Delhi"
                {...form.register("contact.city")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postalCode" className="text-xs font-semibold">PIN Code</Label>
              <Input
                id="postalCode"
                placeholder="e.g. 110001"
                {...form.register("contact.postalCode")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION C — PROFESSIONAL */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Briefcase className="size-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Section C — Professional & Employment
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId" className="text-xs font-semibold">Employee ID *</Label>
              <Input
                id="employeeId"
                {...form.register("professional.employeeId")}
                className="rounded-xl border-border bg-surface font-mono font-bold uppercase text-xs text-primary"
              />
              {form.formState.errors.professional?.employeeId && (
                <p className="text-[11px] text-destructive">{form.formState.errors.professional.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="joiningDate" className="text-xs font-semibold">Date of Joining *</Label>
              <Input
                id="joiningDate"
                type="date"
                {...form.register("professional.joiningDate")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">Employment Status</Label>
              <select
                id="status"
                {...form.register("status")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs font-semibold">Department</Label>
              <select
                id="department"
                {...form.register("professional.department")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {settings?.defaultDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation" className="text-xs font-semibold">Designation</Label>
              <select
                id="designation"
                {...form.register("professional.designation")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {settings?.defaultDesignations.map((des) => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="qualification" className="text-xs font-semibold">Highest Qualification</Label>
              <Input
                id="qualification"
                placeholder="e.g. M.Sc, B.Ed"
                {...form.register("professional.qualification")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="experience" className="text-xs font-semibold">Years of Experience</Label>
              <Input
                id="experience"
                placeholder="e.g. 6 Years"
                {...form.register("professional.experience")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialization" className="text-xs font-semibold">Specialization / Subject</Label>
              <Input
                id="specialization"
                placeholder="e.g. Pure Calculus & Geometry"
                {...form.register("professional.specialization")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION D — EMERGENCY */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <ShieldAlert className="size-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Section D — Emergency Contact
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs font-semibold">Emergency Contact Person</Label>
              <Input
                id="contactName"
                placeholder="e.g. Sunita Sharma"
                {...form.register("emergencyContact.contactName")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="relation" className="text-xs font-semibold">Relationship</Label>
              <Input
                id="relation"
                placeholder="e.g. Spouse / Parent"
                {...form.register("emergencyContact.relation")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emergencyMobile" className="text-xs font-semibold">Emergency Mobile</Label>
              <Input
                id="emergencyMobile"
                placeholder="e.g. 9811223344"
                {...form.register("emergencyContact.mobile")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION E — DOCUMENTS */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <FileText className="size-4 text-purple-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Section E — Document Uploads (Firebase Storage)
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-center">
              <p className="text-xs font-bold text-foreground">Qualification Certificate</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">PDF or Image up to 5MB</p>
              <input
                id="qualDoc"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setQualDocFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("qualDoc")?.click()}
                  className="rounded-xl text-xs"
                >
                  <Upload className="size-3 mr-1" />
                  {qualDocFile ? qualDocFile.name : "Select Document"}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-center">
              <p className="text-xs font-bold text-foreground">Government ID / Aadhaar / Passport</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">PDF or Image up to 5MB</p>
              <input
                id="idDoc"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setIdDocFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("idDoc")?.click()}
                  className="rounded-xl text-xs"
                >
                  <Upload className="size-3 mr-1" />
                  {idDocFile ? idDocFile.name : "Select ID Proof"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-4 z-40 rounded-3xl border border-border bg-card/90 p-4 shadow-lift backdrop-blur-md flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/academics/teachers">Cancel</Link>
          </Button>
          <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl text-xs font-bold">
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Register Teacher
          </Button>
        </div>
      </form>
    </div>
  );
};
