import React from "react";
import { User, GraduationCap, Calendar, Phone, Mail, MapPin, Award } from "lucide-react";
import { useStudent } from "@/context/StudentContext";

export const StudentProfileView: React.FC = () => {
  const { student, isLoading } = useStudent();

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (!student) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <GraduationCap className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">Student Profile Unavailable</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Student Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Official school admission dossier, enrolled class details, and student identification.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Identity Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft text-center space-y-4">
          <div className="size-24 rounded-3xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center mx-auto border border-primary/20 overflow-hidden">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              student.firstName.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">{student.fullName}</h2>
            <p className="text-xs font-bold text-primary mt-0.5">
              Class {student.academic.className} ({student.academic.sectionName})
            </p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {student.status}
            </span>
          </div>

          <div className="text-left bg-surface/50 p-4 rounded-2xl border border-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admission #:</span>
              <span className="font-mono font-bold text-primary">{student.admissionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Roll Number:</span>
              <span className="font-mono font-bold text-foreground">{student.academic.rollNumber || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student ID:</span>
              <span className="font-mono text-muted-foreground">{student.studentId}</span>
            </div>
          </div>
        </div>

        {/* Academic & Personal Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Academic Information</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Class & Section</span>
                <span className="font-bold text-foreground">
                  Class {student.academic.className} - {student.academic.sectionName}
                </span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Academic Session</span>
                <span className="font-bold text-foreground">{student.academic.sessionName || "Active"}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Admission Date</span>
                <span className="font-mono text-foreground">{student.academic.admissionDate || "—"}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Previous School</span>
                <span className="font-semibold text-foreground truncate block">
                  {student.previousSchool || "None"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Personal Information</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Gender</span>
                <span className="font-bold text-foreground">{student.gender}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Date of Birth</span>
                <span className="font-mono text-foreground">{student.dateOfBirth || "—"}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Blood Group</span>
                <span className="font-bold text-foreground">{student.bloodGroup || "—"}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Nationality</span>
                <span className="font-semibold text-foreground">{student.nationality || "Indian"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
