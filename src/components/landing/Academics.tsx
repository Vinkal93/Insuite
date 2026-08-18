import { Section, SectionHeading } from "./Section";

const chips = [
  "Classes",
  "Sections",
  "Subjects",
  "Academic sessions",
  "Timetable",
  "Homework",
  "Assignments",
  "Exams",
  "Results",
];

const timetable = [
  ["09:00", "Mathematics", "IX-B · Ms. Kapoor"],
  ["09:50", "Science", "IX-B · Mr. Bansal"],
  ["10:40", "English", "IX-B · Ms. Dsouza"],
  ["11:45", "Computer Science", "Lab 2 · Mr. Iyer"],
  ["12:35", "Social Science", "IX-B · Ms. Menon"],
];

export function Academics() {
  return (
    <Section id="academics" tone="surface">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 rounded-3xl border border-border bg-card p-5 shadow-lift lg:order-1">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="text-sm font-bold">Timetable — Class IX-B</p>
            <span className="text-[11px] text-muted-foreground">Tuesday</span>
          </div>
          <ul className="mt-3 divide-y divide-border/70">
            {timetable.map(([time, sub, meta]) => (
              <li key={time} className="flex items-center gap-4 py-3">
                <span className="w-14 text-[12px] font-semibold text-primary">{time}</span>
                <div>
                  <p className="text-[13px] font-medium">{sub}</p>
                  <p className="text-[11px] text-muted-foreground">{meta}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl bg-surface p-4">
            <p className="text-[12px] font-semibold">Homework assigned today</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">
              <li>Mathematics — Exercise 7.3, due 20 Aug · 41/48 submitted</li>
              <li>English — Essay draft, due 21 Aug · 12/48 submitted</li>
            </ul>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeading
            align="left"
            eyebrow="Academic management"
            title="Structure your academics once, run every session on it"
            description="Sessions, classes, sections and subjects sit at the core. Timetables, homework, assignments, exams and results all inherit from that structure."
          />
          <div className="mt-8 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
