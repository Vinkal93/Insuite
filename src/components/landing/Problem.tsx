import { X, Check, ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "./Section";

const pairs = [
  { problem: "Data spread across multiple spreadsheets", solution: "One connected school database" },
  { problem: "Manual attendance registers", solution: "Digital attendance with instant reports" },
  { problem: "Fee tracking errors and missed dues", solution: "Automated invoices, receipts & defaulters" },
  { problem: "Scattered student records and documents", solution: "Complete student profile with documents" },
  { problem: "Difficult parent communication", solution: "Parent portal with push notifications" },
  { problem: "Manual result preparation", solution: "Automated marks, grades and report cards" },
  { problem: "No real-time visibility for management", solution: "Live dashboards and school analytics" },
];

export function Problem() {
  return (
    <Section id="problem" tone="surface">
      <SectionHeading
        eyebrow="The everyday reality"
        title="Schools don't have a data problem. They have a disconnected-systems problem."
        description="Every manual workaround costs your staff hours and your management clarity. InSuite replaces each one with a connected workflow."
      />

      <div className="mt-14 grid gap-3">
        {pairs.map((p) => (
          <div
            key={p.problem}
            className="grid items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift sm:grid-cols-[1fr_auto_1fr] sm:p-5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                <X className="size-3.5" aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">{p.problem}</p>
            </div>
            <ArrowRight
              className="hidden size-4 text-muted-foreground/50 sm:block"
              aria-hidden
            />
            <div className="flex items-start gap-3">
              <span className="bg-success/12 text-success mt-0.5 grid size-6 shrink-0 place-items-center rounded-full">
                <Check className="size-3.5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-foreground">{p.solution}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
