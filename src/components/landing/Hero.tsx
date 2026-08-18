import { ArrowRight, PlayCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "./DashboardMockup";

const strip = [
  { label: "Schools & Campuses", value: "500+" },
  { label: "Active Students", value: "250K+" },
  { label: "Teachers & Staff", value: "15,000+" },
  { label: "Uptime & Reliability", value: "99.9%" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="grid-faint pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_55%_at_50%_0%,black,transparent)]" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-brand)", opacity: 0.14 }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden />
            Multi-tenant cloud platform with role-based access
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            Run Your Entire School From{" "}
            <span className="text-gradient-brand">One Powerful Platform.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Admissions, students, attendance, fees, exams, teachers, parents, communication and
            reports — all connected in one intelligent school management system.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="xl">
              Start Free Trial <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button variant="outline" size="xl">
              <PlayCircle className="size-4" aria-hidden /> Book a Demo
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Everything Your School Needs. One Intelligent Platform.
          </p>
        </div>

        <div className="animate-rise mt-14">
          <DashboardMockup />
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-surface p-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Trusted by leading educational institutions worldwide
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
            {strip.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-display text-3xl font-extrabold text-foreground">
                  {s.value}
                </dd>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
