import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SetupWizard } from "@/features/setup";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "School Setup Wizard — InSuite" },
      { name: "description", content: "Complete your institutional profile and configuration." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const { logout } = useAuth();

  return (
    <ProtectedRoute requireSetupComplete={false}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Minimal Setup Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border p-1 shadow-sm">
              <img src="/logo.png" alt="InSuite" className="size-full object-contain" />
            </div>
            <span className="font-display text-base font-extrabold">InSuite Setup</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
              <Link to="/dashboard">Go to Dashboard →</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-muted-foreground">
              <LogOut className="size-3.5 mr-1.5" /> Sign Out
            </Button>
          </div>
        </header>

        <main className="px-4 pb-16">
          <SetupWizard />
        </main>
      </div>
    </ProtectedRoute>
  );
}
