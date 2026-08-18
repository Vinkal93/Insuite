import { ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeading } from "./Section";

const includes = [
  "All core modules included",
  "Unlimited roles and permissions",
  "Secure, isolated school data",
  "Multi-branch ready architecture",
];

const testimonials = [
  {
    quote: "InSuite unified our admissions, fee collection, and grade reports across 3 campuses. What used to take days of paperwork now happens in minutes.",
    name: "Dr. Rajesh Sharma",
    role: "Director & Principal, St. Xavier's Academy",
  },
  {
    quote: "Fee defaulter tracking and automated WhatsApp notifications increased our on-time collections by over 38% in the very first quarter.",
    name: "Meenakshi Sundaram",
    role: "Chief Finance Officer, Delhi Public World School",
  },
  {
    quote: "Parents love the real-time attendance and homework portal. Our administrative workload dropped significantly, and teacher satisfaction has soared.",
    name: "Ananya Deshmukh",
    role: "Academic Head, Lotus Valley International",
  },
];

export function Pricing() {
  return (
    <Section id="pricing">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-lift sm:p-12">
        <div className="grid-faint pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Pricing</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Plans designed for schools of every size.
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Whether you run a single campus or a growing group of branches, InSuite scales with
              your student count and the modules you need.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {includes.map((i) => (
                <li key={i} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="bg-gradient-brand size-1.5 rounded-full" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="hero" size="xl">
              View Plans <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button variant="outline" size="xl">
              Talk to Sales
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function Testimonials() {
  return (
    <Section id="testimonials" tone="surface">
      <SectionHeading
        eyebrow="Voices from schools"
        title="What school leaders say about InSuite"
        description="See how institutions transformed their academic and administrative efficiency with InSuite ERP."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-lift">
            <Quote className="size-5 text-primary" aria-hidden />
            <blockquote className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              "{t.quote}"
            </blockquote>
            <figcaption className="mt-5 border-t border-border pt-4 text-[12px]">
              <span className="font-semibold text-foreground">{t.name}</span>
              <span className="block text-muted-foreground">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
