import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home,
  Users,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Trophy,
  Clock,
  Bus,
  Megaphone,
  MessageSquare,
  Bell,
  User,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  GraduationCap,
  Sparkles,
  Award,
  Calendar,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ParentProvider, useParent } from "@/context/ParentContext";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Home", route: "/parent", icon: Home },
  { label: "My Children", route: "/parent/children", icon: Users },
  { label: "Attendance", route: "/parent/attendance", icon: CalendarCheck },
  { label: "Fees & Receipts", route: "/parent/fees", icon: CreditCard },
  { label: "Homework", route: "/parent/homework", icon: BookOpen },
  { label: "Exams & Results", route: "/parent/exams", icon: Trophy },
  { label: "Timetable", route: "/parent/timetable", icon: Clock },
  { label: "PTM Meetings", route: "/parent/ptm", icon: Calendar },
  { label: "Certificates", route: "/parent/documents", icon: Award },
  { label: "Hostel", route: "/parent/hostel", icon: Building2 },
  { label: "Transport", route: "/parent/transport", icon: Bus },
  { label: "Notices", route: "/parent/notices", icon: Megaphone },
  { label: "Messages", route: "/parent/messages", icon: MessageSquare },
  { label: "Notifications", route: "/parent/notifications", icon: Bell },
  { label: "Profile", route: "/parent/profile", icon: User },
  { label: "Settings", route: "/parent/settings", icon: Settings },
];

const MOBILE_BOTTOM_ITEMS = [
  { label: "Home", route: "/parent", icon: Home },
  { label: "Attendance", route: "/parent/attendance", icon: CalendarCheck },
  { label: "Fees", route: "/parent/fees", icon: CreditCard },
  { label: "Homework", route: "/parent/homework", icon: BookOpen },
  { label: "More", route: "#more", icon: Menu },
];

const ParentLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization, signOut } = useAuth();
  const {
    parent,
    children: kids,
    selectedChildId,
    selectedChild,
    setSelectedChildId,
    isLoading,
  } = useParent();

  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar (Independent vertical scroll) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shadow-soft shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-xs font-black tracking-tight text-foreground line-clamp-1">
                {organization?.name || "School Portal"}
              </h2>
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                Parent Portal
              </span>
            </div>
          </div>
        </div>

        {/* Child Selector Widget */}
        <div className="p-3 border-b border-border bg-surface/50">
          <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Select Active Child
          </label>
          {kids.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No children linked</p>
          ) : (
            <select
              value={selectedChildId || ""}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.fullName} ({k.academic.className} - {k.academic.sectionName})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.route;
            const Icon = item.icon;
            return (
              <Link
                key={item.route}
                to={item.route}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer User Profile */}
        <div className="p-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="size-8 rounded-full bg-secondary text-foreground font-bold text-xs flex items-center justify-center shrink-0">
              {parent?.firstName?.charAt(0) || "P"}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-foreground truncate">
                {parent?.fullName || "Parent User"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{parent?.relation || "Guardian"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area (Independent vertical scroll) */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between p-3.5 border-b border-border bg-card shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-foreground truncate max-w-[160px]">
                {organization?.name || "School Portal"}
              </h2>
              <p className="text-[9px] font-bold text-primary uppercase">Parent Portal</p>
            </div>
          </div>

          {kids.length > 1 && (
            <select
              value={selectedChildId || ""}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="rounded-xl border border-border bg-card px-2 py-1 text-[11px] font-bold text-foreground max-w-[130px]"
            >
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.firstName} ({k.academic.className})
                </option>
              ))}
            </select>
          )}
        </header>

        {/* Main Workspace (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-md py-2 px-1 shadow-lg">
          {MOBILE_BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const isMore = item.route === "#more";
            const isActive = !isMore && location.pathname === item.route;

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex flex-col items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  <Icon className="size-4" />
                  <span>More</span>
                </button>
              );
            }

            return (
              <Link
                key={item.route}
                to={item.route}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
                  isActive ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile "More" Full Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <h3 className="text-sm font-extrabold text-foreground">Menu & Modules</h3>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.route}
                  to={item.route}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border text-xs font-bold text-foreground"
                >
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="size-4" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="w-full rounded-2xl text-xs font-bold text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ParentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ParentProvider>
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </ParentProvider>
  );
};
