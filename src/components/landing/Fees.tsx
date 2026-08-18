import { Receipt, Layers, AlarmClock, UserX, CreditCard, Check } from "lucide-react";
import { Section, SectionHeading } from "./Section";

const highlights = [
  { icon: Layers, title: "Installments", desc: "Split any fee structure into term-wise or custom installments." },
  { icon: Receipt, title: "Receipts", desc: "Auto-generated, numbered receipts for online and offline payments." },
  { icon: AlarmClock, title: "Late fees", desc: "Rules-based late fees applied automatically after due dates." },
  { icon: UserX, title: "Defaulters", desc: "Live defaulter lists with one-click reminders to parents." },
  { icon: CreditCard, title: "Payment tracking", desc: "Partial payments, discounts and scholarships reconciled cleanly." },
];

export function Fees() {
  return (
    <Section id="fees">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Fee management"
            title="Collect more, chase less"
            description="Everything finance needs — structures, invoices, receipts and reconciliation — without a single spreadsheet."
          />
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li key={h.title} className="flex gap-3.5 rounded-2xl border border-border bg-card p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-accent-foreground">
                  <h.icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-bold">{h.title}</p>
                  <p className="text-[13px] text-muted-foreground">{h.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Fee receipt</p>
              <p className="text-[11px] text-muted-foreground">RCPT-2026-01184 · 18 Aug 2026</p>
            </div>
            <span className="bg-success/12 text-success inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold">
              <Check className="size-3.5" aria-hidden /> Payment successful
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-surface p-4 text-[12px]">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Student</span>
              <span className="font-medium">Aarav Raghunathan · IX-B</span>
            </div>
            {[
              ["Tuition — Term II", "₹24,000"],
              ["Transport — Route 7", "₹6,500"],
              ["Late fee (5 days)", "₹250"],
              ["Sibling discount", "− ₹2,000"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/60 py-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 text-sm font-bold">
              <span>Total paid</span>
              <span>₹28,750</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px]">
            {[
              ["Installment", "2 of 4"],
              ["Mode", "UPI · Online"],
              ["Next due", "30 Sep 2026"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border py-3">
                <p className="font-semibold">{v}</p>
                <p className="text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
