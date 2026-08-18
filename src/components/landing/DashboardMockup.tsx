import {
  Users,
  CalendarCheck,
  Wallet,
  GraduationCap,
  BellRing,
  FileSpreadsheet,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const stats = [
  { label: "Total Students", value: "1,284", delta: "+34 this term", icon: Users },
  { label: "Active Teachers", value: "86", delta: "100% assigned", icon: GraduationCap },
  { label: "Today's Attendance", value: "94.2%", delta: "1,210 present", icon: CalendarCheck },
  { label: "Fee Collected", value: "82%", delta: "₹41.2L of ₹50.1L", icon: Wallet },
];

const bars = [58, 72, 65, 88, 76, 94, 81, 90, 68, 84, 96, 79];

export function DashboardMockup() {
  return (
    <div className="rounded-3xl border border-border/80 bg-card shadow-lift overflow-hidden">
      {/* Top browser / app bar */}
      <div className="flex items-center gap-2 border-b border-border bg-surface/50 px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/50" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <div className="ml-3 hidden items-center gap-2 rounded-lg bg-secondary px-3 py-1 text-[11px] font-mono text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          app.insuite.in / dps-main-campus / dashboard
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Session 2026–27
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-surface p-3.5 transition-all hover:border-primary/30">
                <div className="flex items-center justify-between">
                  <s.icon className="size-4 text-primary" aria-hidden />
                  <span className="text-success text-[10px] font-semibold">{s.delta}</span>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Fee collection & Academic Chart */}
          <div className="rounded-2xl border border-border p-4 bg-surface/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  Fee Collection & Revenue Trend
                  <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                    +18.4% YoY
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">Term II installments across all grades</p>
              </div>
              <span className="text-success inline-flex items-center gap-1 text-[11px] font-medium">
                <TrendingUp className="size-3.5" aria-hidden /> On track
              </span>
            </div>
            <div className="mt-4 flex h-28 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="bg-gradient-brand flex-1 rounded-t-md opacity-90 transition-all hover:opacity-100"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Alerts & Upcoming Schedule */}
        <aside className="space-y-3">
          {/* Actionable Instant Alerts */}
          <div className="rounded-2xl border border-border p-3.5 bg-card">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <BellRing className="size-3.5 text-primary" aria-hidden /> Actionable Alerts
              </p>
              <span className="size-2 rounded-full bg-destructive animate-ping" />
            </div>
            <ul className="mt-3 space-y-2 text-[11px]">
              <li className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-2 text-destructive">
                <div>
                  <p className="font-semibold">32 fee payments overdue</p>
                  <p className="text-[10px] text-destructive/80">₹3.8L pending Term II</p>
                </div>
                <button type="button" className="rounded-lg bg-destructive px-2 py-1 text-[10px] font-semibold text-destructive-foreground hover:opacity-90">
                  View Defaulters
                </button>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-warning/20 bg-warning/5 p-2 text-warning-foreground">
                <div>
                  <p className="font-semibold text-foreground">8 absentees 3+ days</p>
                  <p className="text-[10px] text-muted-foreground">Class 8B & 10A</p>
                </div>
                <button type="button" className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-secondary/80">
                  Notify Parents
                </button>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-2 text-foreground">
                <div>
                  <p className="font-semibold">2 exams marks entry</p>
                  <p className="text-[10px] text-muted-foreground">Class 9 Physics, Math</p>
                </div>
                <button type="button" className="rounded-lg bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90">
                  Enter Marks
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Schedule */}
          <div className="rounded-2xl border border-border p-3.5 bg-surface/50">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <FileSpreadsheet className="size-3.5 text-primary" aria-hidden /> Upcoming Examinations
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
              <li className="flex justify-between border-b border-border/50 pb-1">
                <span>Class X — Mathematics</span> <span className="font-medium text-foreground">12 Sep</span>
              </li>
              <li className="flex justify-between border-b border-border/50 pb-1">
                <span>Class VIII — Science</span> <span className="font-medium text-foreground">14 Sep</span>
              </li>
              <li className="flex justify-between">
                <span>Class XII — Physics</span> <span className="font-medium text-foreground">18 Sep</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
