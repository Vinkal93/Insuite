import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Users, CalendarCheck, BookOpen, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getSectionStudents } from "@/services/academicService";

export const TeacherClassesListView: React.FC = () => {
  const { organization } = useAuth();
  const { allocations, teacher } = useTeacher();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          My Classes & Sections
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Classes and subjects allocated to your faculty teaching schedule.
        </p>
      </div>

      {allocations.classes.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Users className="size-12 text-muted-foreground mx-auto" />
          <h3 className="mt-4 text-base font-extrabold text-foreground">No Classes Assigned</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            You do not currently have any class teacher or subject teacher assignments. Please contact the academic administrator.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allocations.classes.map((cls, idx) => {
            const classSubjects = allocations.subjects.filter(
              (s) => s.classId === cls.classId && s.sectionId === cls.sectionId
            );

            return (
              <div
                key={`${cls.classId}_${cls.sectionId}_${idx}`}
                className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-foreground">
                        Class {cls.className} - {cls.sectionName}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">Classroom Division</p>
                    </div>

                    {cls.isClassTeacher && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                        <ShieldCheck className="size-3" /> Class Teacher
                      </span>
                    )}
                  </div>

                  {/* Assigned Subjects */}
                  <div className="bg-surface/50 p-3 rounded-2xl border border-border space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Assigned Subjects
                    </span>
                    {classSubjects.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">Class Teacher Role Only</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {classSubjects.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground"
                          >
                            {sub.subjectName} ({sub.periodsPerWeek || 0} p/w)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    to={`/teacher/attendance`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    <CalendarCheck className="size-3.5" /> Attendance
                  </Link>

                  <Link
                    to={`/teacher/classes/${cls.classId}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    Class Students <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
