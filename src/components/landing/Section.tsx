import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  id,
  children,
  className,
  tone = "light",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "light" | "surface" | "ink";
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 py-20 sm:py-24",
        tone === "surface" && "bg-surface",
        tone === "ink" && "bg-gradient-ink text-ink-foreground",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  tone?: "light" | "ink";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.18em]",
          tone === "ink" ? "text-ink-foreground/60" : "text-primary",
        )}
      >
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed",
            tone === "ink" ? "text-ink-foreground/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
