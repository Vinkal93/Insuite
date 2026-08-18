import { useState } from "react";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "./Section";
import { DashboardMockup } from "./DashboardMockup";

const tabs = ["Dashboard", "Student profile", "Fee management", "Attendance", "Examination"] as const;
type Tab = (typeof tabs)[number];

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-lift sm:p-6">
      {children}
    </div>
  );
}

function StudentProfile() {
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
        <span className="bg-gradient-brand grid size-14 place-items-center rounded-2xl text-lg font-bold text-primary-foreground">
          AR
        </span>
        <div>
          <h3 className="text-base font-bold">Aarav Raghunathan</h3>
          <p className="text-xs text-muted-foreground">
            STU-2026-0184 · Class IX-B · Admitted 12 Apr 2026
          </p>
        </div>
        <span className="bg-success/12 text-success ml-auto rounded-full px-3 py-1 text-[11px] font-semibold">
          Active
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Attendance", "96.4%", "182 / 189 days"],
          ["Fee status", "₹18,000 due", "Installment 3 of 4"],
          ["Last exam", "Rank 6", "Term I · 87.2%"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] text-muted-foreground">{k}</p>
            <p className="mt-1 text-lg font-bold">{v}</p>
            <p className="text-[11px] text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold">Parent information</p>
          <ul className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">
            <li>Father — Nikhil Raghunathan · +91 90000 00000</li>
            <li>Mother — Sneha Raghunathan · +91 90000 00001</li>
            <li>Portal access — Enabled for 2 children</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold">Documents</p>
          <ul className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">
            <li>Birth certificate · Verified</li>
            <li>Previous school TC · Verified</li>
            <li>Bonafide certificate · Issued 02 Jun 2026</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function FeePanel() {
  const rows = [
    ["INV-4821", "Term II — Tuition", "₹24,000", "Paid", "success"],
    ["INV-4822", "Transport — Route 7", "₹6,500", "Partial", "warning"],
    ["INV-4823", "Term III — Tuition", "₹24,000", "Due 30 Sep", "muted"],
    ["INV-4788", "Lab & Activity", "₹3,200", "Overdue", "destructive"],
  ] as const;
  return (
    <Panel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">Fee ledger — Class IX-B</h3>
          <p className="text-xs text-muted-foreground">Session 2026–27 · 48 students</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <span className="rounded-full bg-secondary px-3 py-1">Collected ₹41.2L</span>
          <span className="rounded-full bg-destructive/10 px-3 py-1 text-destructive">
            24 defaulters
          </span>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 font-medium">Invoice</th>
              <th className="pb-2 font-medium">Head</th>
              <th className="pb-2 font-medium">Amount</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([id, head, amt, status, tone]) => (
              <tr key={id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-medium">{id}</td>
                <td className="py-2.5 text-muted-foreground">{head}</td>
                <td className="py-2.5 font-semibold">{amt}</td>
                <td className="py-2.5">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      tone === "success" && "bg-success/12 text-success",
                      tone === "warning" && "bg-warning/15 text-foreground/80",
                      tone === "muted" && "bg-secondary text-muted-foreground",
                      tone === "destructive" && "bg-destructive/10 text-destructive",
                    )}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function AttendancePanel() {
  const students: [string, string][] = [
    ["Aarav R.", "P"],
    ["Diya M.", "P"],
    ["Ishaan K.", "L"],
    ["Kabir S.", "A"],
    ["Meera J.", "P"],
    ["Nihal P.", "P"],
    ["Riya T.", "LV"],
    ["Vivaan D.", "P"],
  ];
  const tone: Record<string, string> = {
    P: "bg-success/12 text-success",
    A: "bg-destructive/10 text-destructive",
    L: "bg-warning/15 text-foreground/80",
    LV: "bg-secondary text-muted-foreground",
  };
  return (
    <Panel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">Attendance — Class IX-B</h3>
          <p className="text-xs text-muted-foreground">18 Aug 2026 · Period 1 · Mathematics</p>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Parents auto-notified for absentees
        </span>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {students.map(([n, s]) => (
          <div
            key={n}
            className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-[12px]"
          >
            <span>{n}</span>
            <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", tone[s] ?? "")}>
              {s}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3 text-center text-[11px]">
        {[
          ["Present", "42"],
          ["Absent", "3"],
          ["Late", "2"],
          ["Leave", "1"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface py-3">
            <p className="text-base font-bold">{v}</p>
            <p className="text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ExamPanel() {
  const rows = [
    ["Mathematics", 92, "A1"],
    ["Science", 86, "A2"],
    ["English", 78, "B1"],
    ["Social Science", 88, "A2"],
    ["Computer Science", 95, "A1"],
  ] as const;
  return (
    <Panel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">Term I result — Aarav Raghunathan</h3>
          <p className="text-xs text-muted-foreground">Class IX-B · Report card ready</p>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
          Rank 6 of 48 · Pass
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map(([sub, marks, grade]) => (
          <div key={sub} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-[12px] text-muted-foreground">{sub}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="bg-gradient-brand h-full rounded-full" style={{ width: `${marks}%` }} />
            </div>
            <span className="w-16 text-right text-[12px] font-semibold">
              {marks} · {grade}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ProductPreview() {
  const [tab, setTab] = useState<Tab>("Dashboard");

  return (
    <Section id="product" tone="surface">
      <SectionHeading
        eyebrow="Product preview"
        title="See the interfaces your team will use every day"
        description="Realistic mock data from a typical school — the same screens your principal, accountant and teachers work in."
      />

      <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Product screens">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] font-medium transition-all",
              tab === t
                ? "border-transparent bg-gradient-brand text-primary-foreground shadow-soft"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "Dashboard" && <DashboardMockup />}
        {tab === "Student profile" && <StudentProfile />}
        {tab === "Fee management" && <FeePanel />}
        {tab === "Attendance" && <AttendancePanel />}
        {tab === "Examination" && <ExamPanel />}
      </div>
    </Section>
  );
}
