import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import {
  User,
  MapPin,
  GraduationCap,
  Users2,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Sparkles,
} from "lucide-react";
import { studentSchema, type StudentFormInput } from "@/schemas/student";
import {
  createStudent,
  updateStudent,
  generateNextStudentId,
} from "@/services/studentService";
import { createParent } from "@/services/parentService";
import { uploadStudentDocument } from "@/services/documentService";
import { uploadUserProfilePhoto } from "@/services/storageService";
import { useAuth } from "@/hooks/useAuth";
import type { Student, DocumentType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CLASSES_LIST = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const SECTIONS_LIST = ["Section A", "Section B", "Section C", "Section D"];

interface StudentFormProps {
  initialStudent?: Student | null;
  onSuccess?: (studentId: string) => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ initialStudent, onSuccess }) => {
  const { organization, selectedSession, allSessions, firebaseUser, userProfile } = useAuth();
  const isEditing = !!initialStudent;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialStudent?.photoUrl || null);

  // Documents state for creation
  const [initialDocFile, setInitialDocFile] = useState<File | null>(null);
  const [initialDocType, setInitialDocType] = useState<DocumentType>("BIRTH_CERTIFICATE");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: initialStudent?.firstName || "",
      middleName: initialStudent?.middleName || "",
      lastName: initialStudent?.lastName || "",
      photoUrl: initialStudent?.photoUrl || "",
      dateOfBirth: initialStudent?.dateOfBirth || "",
      gender: initialStudent?.gender || "MALE",
      bloodGroup: initialStudent?.bloodGroup || "",
      nationality: initialStudent?.nationality || "Indian",
      religion: initialStudent?.religion || "",
      category: initialStudent?.category || "General",
      previousSchool: initialStudent?.previousSchool || "",
      mobile: initialStudent?.contact.mobile || "",
      email: initialStudent?.contact.email || "",
      addressLine: initialStudent?.address.addressLine || "",
      city: initialStudent?.address.city || "",
      state: initialStudent?.address.state || "",
      postalCode: initialStudent?.address.postalCode || "",
      country: initialStudent?.address.country || "India",
      sessionId: initialStudent?.academic.sessionId || selectedSession?.id || (allSessions[0]?.id ?? ""),
      classId: initialStudent?.academic.classId || "Class 1",
      sectionId: initialStudent?.academic.sectionId || "Section A",
      admissionDate: initialStudent?.academic.admissionDate || new Date().toISOString().split("T")[0],
      admissionNumber: initialStudent?.admissionNumber || "",
      rollNumber: initialStudent?.academic.rollNumber || "",
    },
  });

  const onSubmit = async (data: StudentFormInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const actor = { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" };
      let photoUrl = initialStudent?.photoUrl || "";

      // 1. Upload photo if selected
      if (photoFile) {
        photoUrl = await uploadUserProfilePhoto(`student_${Date.now()}`, photoFile);
      }

      let fatherId = initialStudent?.parentIds.fatherId;
      let motherId = initialStudent?.parentIds.motherId;

      // 2. Create father record if specified and not editing
      if (!isEditing && data.fatherName) {
        const father = await createParent(
          organization.id,
          {
            organizationId: organization.id,
            firstName: data.fatherName,
            lastName: data.lastName,
            fullName: data.fatherName,
            relation: "FATHER",
            mobile: data.fatherMobile || data.mobile || "",
            email: data.fatherEmail || "",
            occupation: data.fatherOccupation || "",
            address: data.addressLine,
            childrenIds: [],
            status: "ACTIVE",
          },
          actor
        );
        fatherId = father.id;
      }

      // 3. Create mother record if specified and not editing
      if (!isEditing && data.motherName) {
        const mother = await createParent(
          organization.id,
          {
            organizationId: organization.id,
            firstName: data.motherName,
            lastName: data.lastName,
            fullName: data.motherName,
            relation: "MOTHER",
            mobile: data.motherMobile || "",
            email: data.motherEmail || "",
            occupation: data.motherOccupation || "",
            address: data.addressLine,
            childrenIds: [],
            status: "ACTIVE",
          },
          actor
        );
        motherId = mother.id;
      }

      const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ");
      const sessionObj = allSessions.find((s) => s.id === data.sessionId);

      if (isEditing && initialStudent) {
        // UPDATE EXISTING STUDENT
        await updateStudent(
          organization.id,
          initialStudent.id,
          {
            firstName: data.firstName,
            middleName: data.middleName || "",
            lastName: data.lastName,
            fullName,
            photoUrl,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            bloodGroup: data.bloodGroup || "",
            nationality: data.nationality || "Indian",
            religion: data.religion || "",
            category: data.category || "General",
            previousSchool: data.previousSchool || "",
            contact: { mobile: data.mobile || "", email: data.email || "" },
            address: {
              addressLine: data.addressLine,
              city: data.city || "",
              state: data.state || "",
              postalCode: data.postalCode || "",
              country: data.country || "India",
            },
            academic: {
              sessionId: data.sessionId,
              sessionName: sessionObj?.name || "",
              classId: data.classId,
              className: data.classId,
              sectionId: data.sectionId,
              sectionName: data.sectionId,
              rollNumber: data.rollNumber || "",
              admissionDate: data.admissionDate,
            },
            admissionNumber: data.admissionNumber || initialStudent.admissionNumber,
          },
          actor
        );

        if (onSuccess) onSuccess(initialStudent.id);
        else window.location.href = `/students/${initialStudent.id}`;
      } else {
        // CREATE NEW STUDENT
        const sessionYear = sessionObj?.name?.split("-")[0] || new Date().getFullYear().toString();
        const autoStudentId = await generateNextStudentId(organization.id, sessionYear);
        const admissionNum = data.admissionNumber || `ADM-${autoStudentId.replace("INS-", "")}`;

        const newStudent = await createStudent(
          organization.id,
          {
            organizationId: organization.id,
            studentId: autoStudentId,
            admissionNumber: admissionNum,
            firstName: data.firstName,
            middleName: data.middleName || "",
            lastName: data.lastName,
            fullName,
            photoUrl,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            bloodGroup: data.bloodGroup || "",
            nationality: data.nationality || "Indian",
            religion: data.religion || "",
            category: data.category || "General",
            previousSchool: data.previousSchool || "",
            contact: { mobile: data.mobile || "", email: data.email || "" },
            address: {
              addressLine: data.addressLine,
              city: data.city || "",
              state: data.state || "",
              postalCode: data.postalCode || "",
              country: data.country || "India",
            },
            academic: {
              sessionId: data.sessionId,
              sessionName: sessionObj?.name || "",
              classId: data.classId,
              className: data.classId,
              sectionId: data.sectionId,
              sectionName: data.sectionId,
              rollNumber: data.rollNumber || "",
              admissionDate: data.admissionDate,
            },
            parentIds: {
              fatherId,
              motherId,
            },
            status: "ACTIVE",
            createdBy: actor.uid,
            updatedBy: actor.uid,
          },
          actor
        );

        // Upload initial document if attached
        if (initialDocFile) {
          await uploadStudentDocument(organization.id, newStudent.id, initialDocFile, initialDocType, actor);
        }

        if (onSuccess) onSuccess(newStudent.id);
        else window.location.href = `/students/${newStudent.id}`;
      }
    } catch (err: any) {
      console.error("Student form submit error:", err);
      setErrorMsg(err.message || "Failed to save student profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
            <Link to="/students">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {isEditing ? `Edit Student: ${initialStudent?.fullName}` : "Enroll New Student"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? `Permanent ID: ${initialStudent?.studentId}`
                : "Fill out the multi-section institutional registration form."}
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION A: Basic Information */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <User className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">Section A — Basic Information</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Photo Picker */}
            <div className="sm:col-span-3 flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-surface border border-border overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="size-full object-cover" />
                ) : (
                  <User className="size-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  id="studentPhoto"
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
                  onClick={() => document.getElementById("studentPhoto")?.click()}
                  className="rounded-xl text-xs"
                >
                  <Upload className="size-3.5 mr-1.5" /> Upload Student Photo
                </Button>
                <p className="mt-1 text-[10px] text-muted-foreground">JPG, PNG up to 2MB</p>
              </div>
            </div>

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
              <Input type="date" {...register("dateOfBirth")} className="rounded-xl border-border bg-surface text-xs" />
              {errors.dateOfBirth && <p className="text-[10px] text-destructive">{errors.dateOfBirth.message}</p>}
            </div>

            <div>
              <Label className="text-xs font-semibold">Gender *</Label>
              <select
                {...register("gender")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Blood Group</Label>
              <select
                {...register("bloodGroup")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
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

            <div>
              <Label className="text-xs font-semibold">Nationality</Label>
              <Input {...register("nationality")} defaultValue="Indian" className="rounded-xl border-border bg-surface text-xs" />
            </div>

            <div>
              <Label className="text-xs font-semibold">Religion</Label>
              <Input {...register("religion")} className="rounded-xl border-border bg-surface text-xs" />
            </div>

            <div>
              <Label className="text-xs font-semibold">Category</Label>
              <select
                {...register("category")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <Label className="text-xs font-semibold">Previous School / Transfer Remarks</Label>
              <Input {...register("previousSchool")} placeholder="e.g. St. Xavier High School" className="rounded-xl border-border bg-surface text-xs" />
            </div>
          </div>
        </div>

        {/* SECTION B: Contact & Address */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <MapPin className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">Section B — Contact & Residence</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-semibold">Student Mobile</Label>
              <Input {...register("mobile")} placeholder="+91 98765 43210" className="rounded-xl border-border bg-surface text-xs" />
            </div>

            <div>
              <Label className="text-xs font-semibold">Student Email</Label>
              <Input type="email" {...register("email")} placeholder="student@example.com" className="rounded-xl border-border bg-surface text-xs" />
              {errors.email && <p className="text-[10px] text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="text-xs font-semibold">Postal / PIN Code</Label>
              <Input {...register("postalCode")} className="rounded-xl border-border bg-surface text-xs" />
            </div>

            <div className="sm:col-span-3">
              <Label className="text-xs font-semibold">Residential Address *</Label>
              <Input {...register("addressLine")} placeholder="Street, landmark, apartment..." className="rounded-xl border-border bg-surface text-xs" />
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
              <Label className="text-xs font-semibold">Country</Label>
              <Input {...register("country")} defaultValue="India" className="rounded-xl border-border bg-surface text-xs" />
            </div>
          </div>
        </div>

        {/* SECTION C: Academic Placement */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <GraduationCap className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">Section C — Academic Placement</h2>
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
              {errors.sessionId && <p className="text-[10px] text-destructive">{errors.sessionId.message}</p>}
            </div>

            <div>
              <Label className="text-xs font-semibold">Class / Grade *</Label>
              <select
                {...register("classId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                {CLASSES_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Section *</Label>
              <select
                {...register("sectionId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                {SECTIONS_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Admission Date *</Label>
              <Input type="date" {...register("admissionDate")} className="rounded-xl border-border bg-surface text-xs" />
              {errors.admissionDate && <p className="text-[10px] text-destructive">{errors.admissionDate.message}</p>}
            </div>

            <div>
              <Label className="text-xs font-semibold">Admission Number (School Ref)</Label>
              <Input
                {...register("admissionNumber")}
                placeholder={isEditing ? "" : "Auto-generated if left empty"}
                className="rounded-xl border-border bg-surface text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Roll Number</Label>
              <Input {...register("rollNumber")} placeholder="e.g. 01" className="rounded-xl border-border bg-surface text-xs font-mono" />
            </div>
          </div>
        </div>

        {/* SECTION D: Parents & Guardians (On creation) */}
        {!isEditing && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Users2 className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Section D — Parents & Guardian Information</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Father Details */}
              <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 text-xs">
                <p className="font-bold text-foreground">Father's Information</p>
                <div>
                  <Label className="text-xs font-semibold">Father's Full Name</Label>
                  <Input {...register("fatherName")} className="rounded-xl bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input {...register("fatherMobile")} placeholder="+91 98765 43210" className="rounded-xl bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Email Address</Label>
                  <Input type="email" {...register("fatherEmail")} className="rounded-xl bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Occupation</Label>
                  <Input {...register("fatherOccupation")} placeholder="e.g. Business / Engineer" className="rounded-xl bg-card text-xs" />
                </div>
              </div>

              {/* Mother Details */}
              <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 text-xs">
                <p className="font-bold text-foreground">Mother's Information</p>
                <div>
                  <Label className="text-xs font-semibold">Mother's Full Name</Label>
                  <Input {...register("motherName")} className="rounded-xl bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Mobile Number</Label>
                  <Input {...register("motherMobile")} placeholder="+91 98765 43210" className="rounded-xl bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Email Address</Label>
                  <Input type="email" {...register("motherEmail")} className="rounded-xl bg-card text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Occupation</Label>
                  <Input {...register("motherOccupation")} placeholder="e.g. Doctor / Homemaker" className="rounded-xl bg-card text-xs" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: Initial Documents Upload (On creation) */}
        {!isEditing && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <FileText className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Section E — Verification Documents</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">Initial Document Type</Label>
                <select
                  value={initialDocType}
                  onChange={(e) => setInitialDocType(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
                >
                  <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                  <option value="PREVIOUS_MARKSHEET">Previous Marksheet</option>
                  <option value="TRANSFER_CERTIFICATE">Transfer Certificate (TC)</option>
                  <option value="PHOTO_ID">Govt / Photo ID</option>
                  <option value="OTHER">Other Certificate</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Select Document File (PDF, JPG, PNG)</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setInitialDocFile(e.target.files[0]);
                  }}
                  className="rounded-xl border-border bg-surface text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/students">Cancel</Link>
          </Button>
          <Button type="submit" variant="hero" size="sm" disabled={isSubmitting} className="rounded-xl font-bold px-6">
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            {isEditing ? "Save Student Changes" : "Complete Enrollment"}
          </Button>
        </div>
      </form>
    </div>
  );
};
