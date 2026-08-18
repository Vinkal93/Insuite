import { useState } from "react";
import {
  CheckCircle2,
  Building,
  Calendar,
  Layers,
  Grid,
  BookOpen,
  GraduationCap,
  Wallet,
  FileCheck,
  Palette,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Section, SectionHeading } from "./Section";
import { Button } from "@/components/ui/button";

const steps = [
  { step: 1, title: "School Info", desc: "Campus name, affiliation, address & contact details", icon: Building },
  { step: 2, title: "Academic Session", desc: "Configure active session (e.g., 2026–27) & terms", icon: Calendar },
  { step: 3, title: "Classes", desc: "Add grades from Nursery to Grade 12", icon: Layers },
  { step: 4, title: "Sections", desc: "Define sections (A, B, C) with student intake limits", icon: Grid },
  { step: 5, title: "Subjects", desc: "Map core, elective & practical subjects per grade", icon: BookOpen },
  { step: 6, title: "Teachers", desc: "Invite faculty, assign subjects & class teachers", icon: GraduationCap },
  { step: 7, title: "Fee Structure", desc: "Setup tuition, transport, lab fees & installments", icon: Wallet },
  { step: 8, title: "Exam Structure", desc: "Configure grading schemes, terms & assessment types", icon: FileCheck },
  { step: 9, title: "School Branding", desc: "Upload school crest, colors & report card header", icon: Palette },
  { step: 10, title: "Go Live!", desc: "Instant activation, student import & portal launch", icon: Sparkles },
];

export function SetupWizard() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <Section id="setup-wizard" tone="surface">
      <SectionHeading
        eyebrow="Fast 10-Minute Onboarding"
        title="10-Step School Setup Wizard"
        description="Onboard your entire school campus seamlessly. No complex configuration, no developer needed — just follow the guided wizard."
      />

      <div className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-10">
        {/* Step Progress Pills */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
          {steps.map((s) => {
            const isDone = s.step < activeStep;
            const isCurrent = s.step === activeStep;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex flex-col items-center rounded-xl p-2.5 text-center transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40"
                    : isDone
                      ? "bg-secondary text-foreground hover:bg-secondary/80"
                      : "bg-surface text-muted-foreground opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-1">
                  {isDone ? (
                    <CheckCircle2 className="size-3.5 text-success" />
                  ) : (
                    <span className="text-[11px] font-bold">#{s.step}</span>
                  )}
                </div>
                <span className="mt-1 text-[11px] font-semibold leading-tight line-clamp-1">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Step Preview Box */}
        <div className="mt-8 grid gap-6 rounded-2xl border border-border bg-surface p-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-soft">
                {(() => {
                  const CurrentIcon = steps[activeStep - 1].icon;
                  return <CurrentIcon className="size-6" />;
                })()}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Step {activeStep} of 10
                </span>
                <h3 className="text-xl font-extrabold text-foreground">
                  {steps[activeStep - 1].title} Configuration
                </h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {steps[activeStep - 1].desc}. InSuite pre-populates standardized templates so you can finish setup in minutes.
            </p>

            <div className="mt-4 rounded-xl border border-border/80 bg-card p-4 text-xs font-mono text-muted-foreground">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span>organizationId: <span className="text-primary font-bold">org_school_dps_01</span></span>
                <span className="text-success font-semibold">Ready to save</span>
              </div>
              <p className="mt-2 text-foreground font-sans">
                ✓ Multi-branch support ready (`branchId: main_campus`)
              </p>
              <p className="mt-1 text-foreground font-sans">
                ✓ Multi-session immutable storage (`session: 2026-27`)
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div>
              <p className="text-xs font-bold uppercase text-primary">Why schools love this</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                "We set up our 1,200-student school over the weekend without needing any technical training."
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={activeStep === 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="flex-1"
                onClick={() => setActiveStep((prev) => (prev === 10 ? 1 : prev + 1))}
              >
                {activeStep === 10 ? "Start Again" : "Next Step"} <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
