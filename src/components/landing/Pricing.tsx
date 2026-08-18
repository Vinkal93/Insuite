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
    quote: "[Placeholder testimonial — replace with a real quote from your school partner before launch.]",
    name: "[Name]",
    role: "[Principal, School Name]",
  },
  {
    quote: "[Placeholder testimonial — replace with a real quote from an administrator or accountant.]",
    name: "[Name]",
    role: "[Administrator, School Name]",
  },
  {
    quote: "[Placeholder testimonial — replace with a real quote from a teacher or parent.]",
    name: "[Name]",
    role: "[Teacher, School Name]",
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
        title="What school leaders will say"
        description="Placeholder testimonials shown below — replace each with a verified quote before going live."
      />
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.role} className="rounded-2xl border border-dashed border-border bg-card p-6">
            <Quote className="size-5 text-primary" aria-hidden />
            <blockquote className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              {t.quote}
            </blockquote>
            <figcaption className="mt-5 border-t border-border pt-4 text-[12px]">
              <span className="font-semibold">{t.name}</span>
              <span className="block text-muted-foreground">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
