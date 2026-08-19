import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  UserCheck,
  Wallet,
  UserPlus,
  PhoneCall,
  FileText,
  Clock,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import type { Dashboard2KPIs } from "../types";

export const KeyMetricsSection: React.FC<{
  kpis: Dashboard2KPIs | null;
  isLoading: boolean;
}> = ({ kpis, isLoading }) => {
  const cards = [
    {
      id: "students",
      title: "TOTAL STUDENTS",
      value: kpis?.totalStudents.value ? kpis.totalStudents.value.toLocaleString() : "0",
      subtext: kpis?.totalStudents.subtext || "Active Students",
      icon: Users,
      iconBg: "bg-blue-500/10 text-blue-500",
      route: "/students",
    },
    {
      id: "teachers",
      title: "TOTAL TEACHERS",
      value: kpis?.totalTeachers.value ? kpis.totalTeachers.value.toLocaleString() : "0",
      subtext: kpis?.totalTeachers.subtext || "Active Teaching Staff",
      icon: GraduationCap,
      iconBg: "bg-purple-500/10 text-purple-500",
      route: "/academics/teachers",
    },
    {
      id: "attendance",
      title: "TODAY'S ATTENDANCE",
      value:
        kpis?.todayAttendance.percentage !== null && kpis?.todayAttendance.percentage !== undefined
          ? `${kpis.todayAttendance.percentage}%`
          : "Not Marked",
      subtext:
        kpis?.todayAttendance.total && kpis.todayAttendance.total > 0
          ? `Present: ${kpis.todayAttendance.present} / ${kpis.todayAttendance.total}`
          : "Roll call pending",
      icon: UserCheck,
      iconBg: "bg-emerald-500/10 text-emerald-600",
      route: "/attendance",
    },
    {
      id: "fees",
      title: "PENDING FEES",
      value: kpis?.pendingFees.isConfigured ? (kpis.pendingFees.value || "₹0") : "Not configured",
      subtext: kpis?.pendingFees.isConfigured ? (kpis.pendingFees.overdue || "No overdue") : "Module unlocks in Phase 9",
      icon: Wallet,
      iconBg: "bg-amber-500/10 text-amber-500",
      route: "/settings",
    },
    {
      id: "admissions",
      title: "NEW ADMISSIONS",
      value: kpis?.newAdmissions.value ? kpis.newAdmissions.value.toLocaleString() : "0",
      subtext: kpis?.newAdmissions.subtext || "This session",
      icon: UserPlus,
      iconBg: "bg-rose-500/10 text-rose-500",
      route: "/admissions/list",
    },
    {
      id: "enquiries",
      title: "PENDING ENQUIRIES",
      value: kpis?.pendingEnquiries.value ? kpis.pendingEnquiries.value.toLocaleString() : "0",
      subtext: kpis?.pendingEnquiries.subtext || "Requires follow-up",
      icon: PhoneCall,
      iconBg: "bg-cyan-500/10 text-cyan-600",
      route: "/admissions/enquiries",
    },
    {
      id: "assignments",
      title: "ASSIGNMENTS",
      value: kpis?.assignments.value ? kpis.assignments.value.toLocaleString() : "0",
      subtext: kpis?.assignments.needsGrading ? `${kpis.assignments.needsGrading} needs grading` : "Active tasks",
      icon: FileText,
      iconBg: "bg-indigo-500/10 text-indigo-500",
      route: "/academic-work",
    },
    {
      id: "schedule",
      title: "TODAY'S SCHEDULE",
      value: kpis?.todaySchedule.periodsCount ? `${kpis.todaySchedule.periodsCount}` : "0",
      subtext: kpis?.todaySchedule.subtext || "Classes today",
      icon: Clock,
      iconBg: "bg-teal-500/10 text-teal-600",
      route: "/timetable/classes",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            to={card.route}
            className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {card.title}
              </span>
              <div className={`rounded-2xl p-2.5 transition-transform group-hover:scale-110 ${card.iconBg}`}>
                <Icon className="size-4" />
              </div>
            </div>

            <div className="mt-3">
              {isLoading ? (
                <div className="h-7 w-20 animate-pulse rounded-lg bg-secondary" />
              ) : (
                <p className="text-2xl font-black tracking-tight text-foreground">
                  {card.value}
                </p>
              )}
              <p className="mt-1 text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                <span>{card.subtext}</span>
                <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
