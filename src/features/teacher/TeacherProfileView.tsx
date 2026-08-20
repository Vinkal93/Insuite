import React from "react";
import { User, PenTool, Mail, Phone, Building, Briefcase } from "lucide-react";
import { useTeacher } from "@/context/TeacherContext";

export const TeacherProfileView: React.FC = () => {
  const { teacher, allocations, isLoading } = useTeacher();

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (!teacher) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <PenTool className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">Profile Unavailable</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Faculty Staff Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Official staff credentials, assigned teaching responsibilities, and department info.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Identity Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft text-center space-y-4">
          <div className="size-24 rounded-3xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center mx-auto overflow-hidden border border-primary/20">
            {teacher.photoUrl ? (
              <img src={teacher.photoUrl} alt={teacher.fullName} className="w-full h-full object-cover" />
            ) : (
              teacher.fullName.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">{teacher.fullName}</h2>
            <p className="text-xs font-bold text-primary mt-0.5">{teacher.designation || "Faculty"}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {teacher.status}
            </span>
          </div>

          <div className="bg-surface/50 p-4 rounded-2xl border border-border space-y-2 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Employee ID:</span>
              <span className="font-mono font-bold text-primary">{teacher.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-semibold text-foreground">{teacher.department || "Academics"}</span>
            </div>
          </div>
        </div>

        {/* Contact & Allocations */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Contact Details</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="bg-surface/50 p-3.5 rounded-2xl border border-border flex items-center gap-3">
                <Mail className="size-4 text-primary shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-muted-foreground block">Email</span>
                  <span className="font-semibold text-foreground truncate block">{teacher.email}</span>
                </div>
              </div>
              <div className="bg-surface/50 p-3.5 rounded-2xl border border-border flex items-center gap-3">
                <Phone className="size-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Phone</span>
                  <span className="font-mono text-foreground">{teacher.phone || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">
              Teaching Allocations ({allocations.classes.length} Classes)
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              {allocations.classes.map((c, i) => (
                <div key={i} className="p-3 rounded-2xl bg-surface/50 border border-border">
                  <span className="font-extrabold text-foreground block">
                    Class {c.className} - {c.sectionName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {c.isClassTeacher ? "Class Teacher" : "Subject Faculty"}
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
