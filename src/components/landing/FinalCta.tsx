import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = [
  { title: "Product", links: ["Product", "Features", "Solutions", "Pricing"] },
  { title: "Resources", links: ["Resources", "Documentation", "Support", "Contact"] },
  { title: "Company", links: ["Company", "Security", "Privacy", "Terms"] },
  { title: "Access", links: ["Login", "Book Demo", "Start Free Trial"] },
];

export function FinalCta() {
  return (
    <section id="final-cta" className="scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8">
      <div className="bg-gradient-ink relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-16 text-center text-ink-foreground sm:px-12 sm:py-20">
        <div
          className="pointer-events-none absolute -bottom-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "var(--gradient-brand)", opacity: 0.3 }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold sm:text-4xl">
            Give Your School a Smarter Way to Operate.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-foreground/70">
            One intelligent platform for admissions, academics, attendance, fees, exams and
            communication.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="xl">
              Start Free Trial <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button variant="onInk" size="xl">
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-gradient-brand grid size-9 place-items-center rounded-xl text-primary-foreground">
                <GraduationCap className="size-5" aria-hidden />
              </span>
              <span className="font-display text-lg font-extrabold">InSuite</span>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Everything Your School Needs. One Intelligent Platform. A modern, multi-tenant school
              management system built for schools of every size.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((c) => (
              <div key={c.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                  {c.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#top"
                        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-[12px] text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} InSuite. All rights reserved.</p>
          <p>Run Your School Smarter.</p>
        </div>
      </div>
    </footer>
  );
}
