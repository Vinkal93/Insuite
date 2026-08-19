import React from "react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2 relative">
      {/* Absolute Theme Toggle at top right */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
          className="size-9 rounded-xl bg-card/80 backdrop-blur border-border"
        >
          {theme === "dark" ? (
            <Sun className="size-4 text-amber-400" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </div>

      {/* Left Branding Showcase (Desktop) */}
      <div className="bg-gradient-ink relative hidden flex-col justify-between p-12 text-ink-foreground lg:flex">
        <div
          className="pointer-events-none absolute -bottom-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--gradient-brand)" }}
        />

        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-card/10 border border-white/10 p-1.5 shadow-soft">
              <img src="/logo.png" alt="InSuite" className="size-full object-contain" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight">InSuite</span>
          </Link>
        </div>

        <div className="relative max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-ink-foreground/80">
            <Sparkles className="size-3.5 text-primary" />
            Complete School Management Platform
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Everything Your School Needs. One Intelligent System.
          </h1>
          <p className="text-sm leading-relaxed text-ink-foreground/70">
            Admissions, academics, fee operations, exams, student records, and parent communication
            built on a secure, multi-tenant cloud architecture.
          </p>
        </div>

        <div className="relative border-t border-white/10 pt-6 text-xs text-ink-foreground/60">
          <p>© {new Date().getFullYear()} InSuite. All rights reserved.</p>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-12 bg-background">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/logo.png" alt="InSuite" className="size-10 object-contain" />
            <span className="font-display text-xl font-extrabold">InSuite</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
