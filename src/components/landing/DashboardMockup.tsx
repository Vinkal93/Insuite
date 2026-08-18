import {
  Users,
  CalendarCheck,
  Wallet,
  UserPlus,
  BellRing,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";

const stats = [
  { label: "Students", value: "1,284", delta: "+34 this term", icon: Users },
  { label: "Attendance today", value: "94.2%", delta: "1,210 present", icon: CalendarCheck },
  { label: "Fee collected", value: "82%", delta: "₹41.2L of ₹50.1L", icon: Wallet },
  { label: "Admissions", value: "62", delta: "18 in counselling", icon: UserPlus },
];

const bars = [58, 72, 65, 88, 76, 94, 81, 90, 68, 84, 96, 79];

export function DashboardMockup() {
  return (
    <div className="rounded-3xl border border-border/80 bg-card shadow-lift">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/50" />
        <span className="bg-warning/60 size-2.5 rounded-full" />
        <span className="bg-success/60 size-2.5 rounded-full" />
        <div className="ml-3 hidden rounded-md bg-secondary px-3 py-1 text-[11px] text-muted-foreground sm:block">
          app.insuite.school / dashboard
        </div>
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">
          Academic Session 2026–27
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-surface p-3.5">
                <s.icon className="size-4 text-primary" aria-hidden />
                <p className="mt-2 text-xl font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                <p className="text-success mt-1 text-[10px]">{s.delta}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Fee collection trend</p>
                <p className="text-[11px] text-muted-foreground">Last 12 weeks</p>
              </div>
              <span className="text-success inline-flex items-center gap-1 text-[11px] font-medium">
                <TrendingUp className="size-3.5" aria-hidden /> On track
              </span>
            </div>
            <div className="mt-4 flex h-28 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="bg-gradient-brand flex-1 rounded-t-md opacity-90"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <FileSpreadsheet className="size-3.5 text-primary" aria-hidden /> Upcoming exams
            </p>
            <ul className="mt-2.5 space-y-2 text-[11px] text-muted-foreground">
              <li className="flex justify-between">
                <span>Class X — Mathematics</span> <span>12 Sep</span>
              </li>
              <li className="flex justify-between">
                <span>Class VIII — Science</span> <span>14 Sep</span>
              </li>
              <li className="flex justify-between">
                <span>Class XII — Physics</span> <span>18 Sep</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <BellRing className="size-3.5 text-primary" aria-hidden /> Alerts
            </p>
            <ul className="mt-2.5 space-y-2 text-[11px]">
              <li className="rounded-lg bg-destructive/8 px-2.5 py-1.5 text-destructive">
                24 fee defaulters this month
              </li>
              <li className="bg-warning/10 rounded-lg px-2.5 py-1.5 text-foreground/80">
                6 absentees not notified
              </li>
              <li className="rounded-lg bg-accent px-2.5 py-1.5 text-accent-foreground">
                Class IX results ready to publish
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
