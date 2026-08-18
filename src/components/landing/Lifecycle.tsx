import {
  MessageCircleQuestion,
  FileCheck2,
  User,
  CalendarCheck,
  NotebookPen,
  ClipboardList,
  Trophy,
  FileBadge,
} from "lucide-react";
import { Section, SectionHeading } from "./Section";

const steps = [
  { icon: MessageCircleQuestion, label: "Enquiry", note: "Captured & assigned" },
  { icon: FileCheck2, label: "Admission", note: "Verified & approved" },
  { icon: User, label: "Student", note: "Profile & class allocated" },
  { icon: CalendarCheck, label: "Attendance", note: "Daily & period-wise" },
  { icon: NotebookPen, label: "Homework", note: "Assigned & submitted" },
  { icon: ClipboardList, label: "Exam", note: "Scheduled & marked" },
  { icon: Trophy, label: "Result", note: "Graded & published" },
  { icon: FileBadge, label: "Certificate", note: "Issued & stored" },
];

export function Lifecycle() {
  return (
    <Section id="lifecycle" tone="ink">
      <SectionHeading
        eyebrow="Student lifecycle"
        tone="ink"
        title="From first enquiry to final certificate — one continuous record"
        description="Each stage feeds the next. No re-entry, no lost paperwork, no disconnected registers."
      />
      <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.label}
            className="relative rounded-2xl border border-ink-foreground/12 bg-ink-foreground/5 p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-ink-foreground/10">
                <s.icon className="size-5" aria-hidden />
              </span>
              <span className="font-display text-xs font-bold text-ink-foreground/40">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 text-base font-bold">{s.label}</h3>
            <p className="mt-1 text-[12px] text-ink-foreground/60">{s.note}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
