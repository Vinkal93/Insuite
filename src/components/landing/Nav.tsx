import { useEffect, useState } from "react";
import { Menu, X, Sparkles, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#roles" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#faq" },
];

export function AnnouncementBar() {
  return (
    <div className="bg-gradient-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm">
        <Sparkles className="hidden size-4 shrink-0 opacity-80 sm:block" aria-hidden />
        <span className="opacity-90">
          InSuite is now cloud-native and multi-tenant — one platform for every school branch.
        </span>
        <a
          href="#final-cta"
          className="hidden items-center gap-1 font-medium underline-offset-4 hover:underline sm:inline-flex"
        >
          Learn more <ArrowRight className="size-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-transparent transition-all",
        scrolled && "border-border/70 bg-background/85 shadow-soft backdrop-blur-xl",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
      >
        <a href="#top" className="flex items-center gap-2.5">
          <span className="bg-gradient-brand grid size-9 place-items-center rounded-xl text-primary-foreground shadow-soft">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">InSuite</span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Login
          </Button>
          <Button variant="outline" size="sm">
            Book a Demo
          </Button>
          <Button variant="hero" size="sm">
            Start Free Trial
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-xl border border-border lg:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-background px-4 pb-6 pt-3 lg:hidden">
          <ul className="grid gap-1">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2">
            <Button variant="outline">Login</Button>
            <Button variant="outline">Book a Demo</Button>
            <Button variant="hero">Start Free Trial</Button>
          </div>
        </div>
      )}
    </header>
  );
}
