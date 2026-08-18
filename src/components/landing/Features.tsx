import {
  Users,
  UserPlus,
  BookOpen,
  CalendarCheck,
  Wallet,
  ClipboardList,
  HeartHandshake,
  GraduationCap,
  Presentation,
  Briefcase,
  MessageSquare,
  FileBadge,
  BarChart3,
  ShieldCheck,
  Building2,
  Workflow,
} from "lucide-react";
import { Section, SectionHeading } from "./Section";

const modules = [
  { icon: Users, title: "Student Management", desc: "Profiles, IDs, academic history, documents and full activity trail." },
  { icon: UserPlus, title: "Admissions & Enquiries", desc: "Enquiry to enrollment: counselling, verification, class allocation." },
  { icon: BookOpen, title: "Academic Management", desc: "Classes, sections, subjects, sessions, timetable and homework." },
  { icon: CalendarCheck, title: "Attendance", desc: "Student and staff attendance with leave, reports and parent alerts." },
  { icon: Wallet, title: "Fee Management", desc: "Structures, installments, invoices, late fees, discounts, receipts." },
  { icon: ClipboardList, title: "Examination", desc: "Schedules, marks entry, grades, ranks, report cards and publishing." },
  { icon: HeartHandshake, title: "Parent Portal", desc: "Multiple children, fees, homework, results and notices in one app." },
  { icon: GraduationCap, title: "Student Portal", desc: "Timetable, assignments, results, documents and certificates." },
  { icon: Presentation, title: "Teacher Portal", desc: "Assigned classes, attendance, marks, homework and leave requests." },
  { icon: Briefcase, title: "Staff & HR", desc: "Employees, departments, designations, leave and payroll-ready data." },
  { icon: MessageSquare, title: "Communication", desc: "Notices, push notifications, WhatsApp/SMS/email-ready templates." },
  { icon: FileBadge, title: "Documents & Certificates", desc: "Bonafide, character, transfer certificates, ID cards, report cards." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Admissions, attendance, collections, exam and teacher performance." },
  { icon: ShieldCheck, title: "Security & Access", desc: "Role and permission based access, audit logs, secure storage." },
  { icon: Building2, title: "Multi-Tenant SaaS", desc: "Isolated data per school with multi-branch ready architecture." },
  { icon: Workflow, title: "Automation", desc: "Automate reminders, notifications and repetitive academic tasks." },
];

export function Features() {
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="Complete platform"
        title="Everything your school needs, in one place"
        description="Sixteen connected modules that share the same data model — so a fee update, an attendance mark or an exam result is visible everywhere it matters."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => (
          <article
            key={m.title}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-accent-foreground transition-colors group-hover:bg-gradient-brand group-hover:text-primary-foreground">
              <m.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-sm font-bold">{m.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{m.desc}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
