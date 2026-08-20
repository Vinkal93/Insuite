import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Users,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createStaff,
  listDepartments,
  listDesignations,
  generateNextEmployeeId,
  getHrSettings,
  uploadStaffDocument,
} from "@/services/hrService";
import type { Department, Designation, HrSettingsConfig } from "@/types/hr";
import type { StaffInput } from "@/schemas/hr";
import { Button } from "@/components/ui/button";

export const CreateStaffView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [settings, setSettings] = useState<HrSettingsConfig | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [bloodGroup, setBloodGroup] = useState("");

  const [mobile, setMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [employmentType, setEmploymentType] = useState<any>("Full Time");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [isTeachingStaff, setIsTeachingStaff] = useState(false);

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyMobile, setEmergencyMobile] = useState("");

  // Attached files for upload after creation
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedIdProof, setSelectedIdProof] = useState<File | null>(null);
  const [selectedCert, setSelectedCert] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [deptList, desigList, hrConf] = await Promise.all([
          listDepartments(organization.id),
          listDesignations(organization.id),
          getHrSettings(organization.id),
        ]);
        setDepartments(deptList);
        setDesignations(desigList);
        setSettings(hrConf);

        if (deptList.length > 0) setDepartmentId(deptList[0].id);
        if (desigList.length > 0) setDesignationId(desigList[0].id);

        if (hrConf.autoGenerateEmployeeId) {
          const autoId = await generateNextEmployeeId(organization.id, hrConf.employeeIdPrefix);
          setEmployeeId(autoId);
        }
      } catch (err: any) {
        console.error("Init create staff error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const handleGenerateId = async () => {
    if (!organization) return;
    try {
      const autoId = await generateNextEmployeeId(
        organization.id,
        settings?.employeeIdPrefix || "INS-EMP"
      );
      setEmployeeId(autoId);
    } catch (err: any) {
      alert("Failed to generate employee ID: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and Last names are required.");
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      setError("Please provide a valid 10-digit mobile number.");
      return;
    }
    if (!employeeId.trim()) {
      setError("Employee ID is required.");
      return;
    }
    if (!departmentId || !designationId) {
      setError("Please select a valid department and designation.");
      return;
    }

    const deptObj = departments.find((d) => d.id === departmentId);
    const desigObj = designations.find((d) => d.id === designationId);

    const input: StaffInput = {
      personal: {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        dob,
        gender,
        bloodGroup: bloodGroup.trim() || null,
      },
      contact: {
        mobile: mobile.trim(),
        alternateMobile: alternateMobile.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        pinCode: pinCode.trim() || null,
      },
      professional: {
        employeeId: employeeId.trim().toUpperCase(),
        joiningDate,
        departmentId,
        departmentName: deptObj?.name || "General",
        designationId,
        designationName: desigObj?.name || "Staff",
        employmentType,
        qualification: qualification.trim() || null,
        experience: experience.trim() || null,
        specialization: specialization.trim() || null,
        isTeachingStaff,
      },
      emergencyContact: {
        contactName: emergencyContactName.trim() || null,
        relation: emergencyRelation.trim() || null,
        mobile: emergencyMobile.trim() || null,
      },
      status: "Active",
    };

    setIsSubmitting(true);
    try {
      const createdStaff = await createStaff(organization.id, input, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });

      // Upload documents if selected
      const uploadPromises: Promise<any>[] = [];
      if (selectedPhoto) {
        uploadPromises.push(
          uploadStaffDocument(
            organization.id,
            createdStaff.id,
            selectedPhoto,
            "PHOTO",
            null,
            { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
          )
        );
      }
      if (selectedIdProof) {
        uploadPromises.push(
          uploadStaffDocument(
            organization.id,
            createdStaff.id,
            selectedIdProof,
            "ID_PROOF",
            null,
            { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
          )
        );
      }
      if (selectedCert) {
        uploadPromises.push(
          uploadStaffDocument(
            organization.id,
            createdStaff.id,
            selectedCert,
            "QUALIFICATION_CERTIFICATE",
            null,
            { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
          )
        );
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      navigate({ to: "/hr/staff/$staffId", params: { staffId: createdStaff.id } });
    } catch (err: any) {
      console.error("Create staff error:", err);
      setError(err.message || "Failed to create staff record.");
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/hr/staff">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Register New Staff Member
            </h1>
            <p className="text-xs text-muted-foreground">
              Complete the multi-section employee onboarding dossier.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION A: Personal Information */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section A: Personal Information
            </h2>
            <p className="text-xs text-muted-foreground">Basic demographic and identity details</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Middle Name
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="e.g. Kumar"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="e.g. O+"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: Contact Information */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section B: Contact & Residential
            </h2>
            <p className="text-xs text-muted-foreground">Communication channels and address</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Alternate Mobile
              </label>
              <input
                type="tel"
                value={alternateMobile}
                onChange={(e) => setAlternateMobile(e.target.value)}
                placeholder="e.g. 9876500000"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
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
                placeholder="e.g. staff@school.com"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, locality, house number"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">PIN Code</label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                placeholder="e.g. 110001"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: Professional & Employment */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section C: Professional & Role Designation
            </h2>
            <p className="text-xs text-muted-foreground">Organizational placement and credentials</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Employee ID *</label>
                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5"
                >
                  <Sparkles className="size-2.5" /> Auto
                </button>
              </div>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. INS-EMP-2026-0001"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Joining Date *
              </label>
              <input
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Employment Type *
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
                <option value="Intern">Intern</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Department *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Select Department
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Designation *
              </label>
              <select
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Select Designation
                </option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Highest Qualification
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. M.Sc, B.Ed"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Total Experience
              </label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 5 Years"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Specialization / Subject
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Mathematics & Physics"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Academic Teaching Faculty Toggle */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="isTeaching"
              checked={isTeachingStaff}
              onChange={(e) => setIsTeachingStaff(e.target.checked)}
              className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
            />
            <div>
              <label
                htmlFor="isTeaching"
                className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <GraduationCap className="size-3.5 text-blue-600" /> Teaching Faculty Member
              </label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Automatically enables timetable assignments, examination evaluations, class teacher
                designations, and academic syllabus tracking.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION D: Emergency Contact */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section D: Emergency Contact
            </h2>
            <p className="text-xs text-muted-foreground">Primary emergency contact point</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="e.g. Spouse / Sibling"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Emergency Mobile
              </label>
              <input
                type="tel"
                value={emergencyMobile}
                onChange={(e) => setEmergencyMobile(e.target.value)}
                placeholder="e.g. 9876599999"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION E: Initial Documents */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section E: Initial Document Uploads
            </h2>
            <p className="text-xs text-muted-foreground">Attach proof files (PDF, JPG, PNG)</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface/50 p-3 space-y-1">
              <span className="text-xs font-bold text-foreground">Profile Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
              />
            </div>

            <div className="rounded-2xl border border-border bg-surface/50 p-3 space-y-1">
              <span className="text-xs font-bold text-foreground">Government ID Proof</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setSelectedIdProof(e.target.files?.[0] || null)}
                className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
              />
            </div>

            <div className="rounded-2xl border border-border bg-surface/50 p-3 space-y-1">
              <span className="text-xs font-bold text-foreground">Highest Degree Certificate</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setSelectedCert(e.target.files?.[0] || null)}
                className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:bg-primary/10 file:text-primary"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/hr/staff">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Creating Staff Dossier..." : "Register Staff Member"}
          </Button>
        </div>
      </form>
    </div>
  );
};
