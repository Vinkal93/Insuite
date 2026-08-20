import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getStaff,
  updateStaff,
  listDepartments,
  listDesignations,
} from "@/services/hrService";
import type { Staff, Department, Designation } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const EditStaffView: React.FC = () => {
  const { staffId } = useParams({ from: "/hr/staff/$staffId/edit" });
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
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

  useEffect(() => {
    const init = async () => {
      if (!organization || !staffId) return;
      try {
        const [stData, deptList, desigList] = await Promise.all([
          getStaff(organization.id, staffId),
          listDepartments(organization.id),
          listDesignations(organization.id),
        ]);
        if (!stData) {
          setError("Staff record not found.");
          return;
        }
        setStaff(stData);
        setDepartments(deptList);
        setDesignations(desigList);

        // Populate fields
        setFirstName(stData.personal.firstName);
        setMiddleName(stData.personal.middleName || "");
        setLastName(stData.personal.lastName);
        setDob(stData.personal.dob || "");
        setGender(stData.personal.gender || "MALE");
        setBloodGroup(stData.personal.bloodGroup || "");

        setMobile(stData.contact.mobile);
        setAlternateMobile(stData.contact.alternateMobile || "");
        setEmail(stData.contact.email || "");
        setAddress(stData.contact.address || "");
        setCity(stData.contact.city || "");
        setState(stData.contact.state || "");
        setPinCode(stData.contact.pinCode || "");

        setDepartmentId(stData.professional.departmentId);
        setDesignationId(stData.professional.designationId);
        setEmploymentType(stData.professional.employmentType);
        setQualification(stData.professional.qualification || "");
        setExperience(stData.professional.experience || "");
        setSpecialization(stData.professional.specialization || "");
        setIsTeachingStaff(stData.professional.isTeachingStaff);

        if (stData.emergencyContact) {
          setEmergencyContactName(stData.emergencyContact.contactName || "");
          setEmergencyRelation(stData.emergencyContact.relation || "");
          setEmergencyMobile(stData.emergencyContact.mobile || "");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load staff details for editing.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [organization, staffId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !staffId) return;
    setError(null);

    const deptObj = departments.find((d) => d.id === departmentId);
    const desigObj = designations.find((d) => d.id === designationId);

    setIsSubmitting(true);
    try {
      await updateStaff(
        organization.id,
        staffId,
        {
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
            employeeId: staff?.employeeId || "",
            joiningDate: staff?.professional.joiningDate || "",
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
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      navigate({ to: "/hr/staff/$staffId", params: { staffId } });
    } catch (err: any) {
      setError(err.message || "Failed to update staff record.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error && !staff) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
        <Button variant="outline" size="sm" asChild className="mt-3 text-xs">
          <Link to="/hr/staff">Return</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/hr/staff/$staffId" params={{ staffId: staff!.id }}>
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Edit Staff Profile
            </h1>
            <p className="text-xs text-muted-foreground">
              Update employee records, contact information, and role assignments.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Personal Information
          </h2>
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
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Gender</label>
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
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Contact & Address
          </h2>
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
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
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
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Department & Designation
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Department *
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
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
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Employment Type
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Qualification
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Experience
              </label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="editIsTeaching"
              checked={isTeachingStaff}
              onChange={(e) => setIsTeachingStaff(e.target.checked)}
              className="mt-0.5 size-4 rounded text-primary focus:ring-primary"
            />
            <div>
              <label
                htmlFor="editIsTeaching"
                className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
              >
                <GraduationCap className="size-3.5 text-blue-600" /> Teaching Faculty Member
              </label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Automatically syncs with teacher database for classes and timetables.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/hr/staff/$staffId" params={{ staffId: staff!.id }}>
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Saving Changes..." : "Save Profile Updates"}
          </Button>
        </div>
      </form>
    </div>
  );
};
