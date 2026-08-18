import { KeyRound, SlidersHorizontal, Building2, FolderLock, ScrollText, Workflow, Smartphone, Tablet, Monitor } from "lucide-react";
import { Section, SectionHeading } from "./Section";

const security = [
  { icon: KeyRound, title: "Role-based access", desc: "Every user sees only what their role allows." },
  { icon: SlidersHorizontal, title: "Permission control", desc: "Granular, per-module permissions per user." },
  { icon: Building2, title: "School-wise isolation", desc: "Multi-tenant architecture keeps each school's data separate." },
  { icon: FolderLock, title: "Secure documents", desc: "Cloud document storage with controlled access." },
  { icon: ScrollText, title: "Audit logs", desc: "Traceable record of sensitive actions across the platform." },
];

const automations = [
  "Send fee reminders before and after due dates",
  "Notify parents automatically when a student is absent",
  "Apply late fees using your own rules",
  "Generate report cards once marks are entered",
  "Issue certificates from verified student records",
  "Publish notices to selected classes or roles",
];

export function Security() {
  return (
    <Section id="security" tone="ink">
      <SectionHeading
        eyebrow="Security & architecture"
        tone="ink"
        title="Enterprise-grade controls around your school's data"
        description="Built on secure cloud infrastructure with authentication, isolation and auditability designed in from the start."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {security.map((s) => (
          <div key={s.title} className="rounded-2xl border border-ink-foreground/12 bg-ink-foreground/5 p-5">
            <s.icon className="size-5" aria-hidden />
            <h3 className="mt-3.5 text-sm font-bold">{s.title}</h3>
            <p className="mt-1.5 text-[13px] text-ink-foreground/65">{s.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Automation() {
  return (
    <Section id="automation">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Workflow automation"
            title="Let the platform handle the repetitive work"
            description="The tasks your staff repeat every week can run on their own, triggered by the data already in InSuite."
          />
        </div>
        <ul className="grid gap-3">
          {automations.map((a) => (
            <li key={a} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-[13px]">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-accent-foreground">
                <Workflow className="size-4" aria-hidden />
              </span>
              {a}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function MobileReady() {
  const devices = [
    { icon: Monitor, label: "Desktop", desc: "Full administrative control for office staff and management." },
    { icon: Tablet, label: "Tablet", desc: "Classroom-friendly attendance, homework and marks entry." },
    { icon: Smartphone, label: "Mobile", desc: "Parents and students stay updated wherever they are." },
  ];
  return (
    <Section id="mobile" tone="surface">
      <SectionHeading
        eyebrow="Anywhere access"
        title="Designed for every screen your school uses"
        description="A responsive interface that adapts from the principal's desktop to a parent's phone."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {devices.map((d) => (
          <div key={d.label} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
            <span className="bg-gradient-brand mx-auto grid size-12 place-items-center rounded-2xl text-primary-foreground">
              <d.icon className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-base font-bold">{d.label}</h3>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{d.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
