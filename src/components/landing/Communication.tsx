import { Bell, Megaphone, Wallet, CalendarX, Trophy } from "lucide-react";
import { Section, SectionHeading } from "./Section";

const channels = [
  { icon: Bell, title: "Push notifications", desc: "Instant in-app alerts to parent and student devices." },
  { icon: Megaphone, title: "Notices", desc: "School-wide, class-wide or role-specific announcements." },
  { icon: Wallet, title: "Fee reminders", desc: "Automated reminders before and after the due date." },
  { icon: CalendarX, title: "Attendance alerts", desc: "Parents notified the moment a student is marked absent." },
  { icon: Trophy, title: "Result announcements", desc: "Publish results and notify every parent at once." },
];

const feed = [
  { tag: "Attendance", text: "Aarav was marked absent in Period 1 today.", time: "9:12 AM" },
  { tag: "Fees", text: "Term III installment of ₹24,000 is due on 30 Sep.", time: "Yesterday" },
  { tag: "Notice", text: "Parent–teacher meeting on Saturday, 10:00 AM.", time: "2 days ago" },
  { tag: "Result", text: "Term I report card for Class IX-B is now available.", time: "5 days ago" },
];

export function Communication() {
  return (
    <Section id="communication">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Parent communication"
            title="Keep every parent in the loop, automatically"
            description="Communication is built into the workflow — architected for WhatsApp, SMS and email delivery alongside in-app notifications."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {channels.map((c) => (
              <div key={c.title} className="rounded-2xl border border-border bg-card p-4">
                <c.icon className="size-4 text-primary" aria-hidden />
                <p className="mt-2.5 text-sm font-bold">{c.title}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[320px]">
          <div className="rounded-[2.25rem] border-8 border-foreground/90 bg-card p-4 shadow-lift">
            <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-foreground/20" />
            <p className="text-sm font-bold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">Parent portal · 2 children</p>
            <ul className="mt-4 space-y-2.5">
              {feed.map((f) => (
                <li key={f.text} className="rounded-2xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                      {f.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{f.time}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-snug">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
