import {
  Crown,
  Settings2,
  Calculator,
  Presentation,
  HeartHandshake,
  GraduationCap,
} from "lucide-react";
import { Section, SectionHeading } from "./Section";

const roles = [
  {
    icon: Crown,
    role: "Principal",
    line: "School-wide visibility",
    points: ["Live performance dashboards", "Admission & fee overview", "Staff and academic reports"],
  },
  {
    icon: Settings2,
    role: "Administrator",
    line: "Day-to-day operations",
    points: ["Admissions & enrollment", "Classes, sections, timetable", "Documents & certificates"],
  },
  {
    icon: Calculator,
    role: "Accountant",
    line: "Fees and collections",
    points: ["Fee structures & installments", "Invoices, receipts, late fees", "Defaulters & collection reports"],
  },
  {
    icon: Presentation,
    role: "Teacher",
    line: "Classroom workflow",
    points: ["Attendance & homework", "Marks entry and grading", "Notices and leave requests"],
  },
  {
    icon: HeartHandshake,
    role: "Parent",
    line: "Stay informed",
    points: ["Multiple children in one login", "Attendance, fees, results", "Instant push notifications"],
  },
  {
    icon: GraduationCap,
    role: "Student",
    line: "Own your academics",
    points: ["Timetable & assignments", "Exams, results, documents", "Certificates and notices"],
  },
];

export function Roles() {
  return (
    <Section id="roles">
      <SectionHeading
        eyebrow="Role-based ecosystem"
        title="One platform, a dedicated experience for every role"
        description="Permissions decide what each person sees. Nobody wades through screens that aren't theirs."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <article
            key={r.role}
            className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="bg-gradient-brand absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-accent-foreground">
              <r.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-bold">{r.role}</h3>
            <p className="text-xs font-medium text-primary">{r.line}</p>
            <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
              {r.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="bg-gradient-brand mt-1.5 size-1.5 shrink-0 rounded-full" />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
