import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  User,
  Settings,
  SlidersHorizontal,
  Menu,
  X,
  Search,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Building2,
  Calendar,
  GraduationCap,
  Users,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navSections = [
  {
    title: "Core Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Students Directory", href: "/students", icon: GraduationCap },
      { label: "Enroll Student", href: "/students/new", icon: UserPlus },
      { label: "Student Promotions", href: "/students/promotions", icon: Building2 },
      { label: "Parents & Guardians", href: "/parents", icon: Users },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "School Setup", href: "/setup", icon: SlidersHorizontal },
      { label: "System Settings", href: "/settings", icon: Settings },
      { label: "My Profile", href: "/profile", icon: User },
    ],
  },
];

export const AppLayout: React.FC<{ children: React.ReactNode; pageTitle?: string }> = ({
  children,
  pageTitle,
}) => {
  const { userProfile, organization, membership, activeSession, allSessions, selectedSession, setSelectedSession, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPath = location.pathname;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Left Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border p-1 shadow-sm">
            <img src="/logo.png" alt="InSuite" className="size-full object-contain" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-display text-base font-extrabold tracking-tight truncate">
              {organization?.name || "InSuite"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              {organization?.code ? `Code: ${organization.code}` : "School Management"}
            </span>
          </div>
        </div>

        {/* Academic Session Indicator */}
        {activeSession && (
          <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <Calendar className="size-3.5 text-primary shrink-0" />
            <div className="truncate">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Active Session</p>
              <p className="font-bold text-foreground">{activeSession.name}</p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="mt-4 flex-1 space-y-4 px-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = currentPath === item.href || (item.href !== "/dashboard" && currentPath.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col truncate flex-1">
              <span className="text-xs font-semibold truncate">{userProfile?.displayName || "User"}</span>
              <span className="text-[10px] text-muted-foreground font-mono truncate">
                {membership?.role || "OWNER"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="flex w-64 flex-col border-r border-border bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-display text-base font-extrabold">InSuite</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid size-8 place-items-center rounded-lg border border-border"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-4 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold ${
                        currentPath === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <Button variant="outline" size="sm" onClick={logout} className="mt-auto flex items-center gap-2">
              <LogOut className="size-4" /> Log out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-9 place-items-center rounded-xl border border-border lg:hidden"
            >
              <Menu className="size-4" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">InSuite</Link>
              <span>/</span>
              <span className="font-semibold text-foreground capitalize">
                {pageTitle || currentPath.replace("/", "") || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Center: Global Search UI Placeholder */}
          <div className="hidden max-w-md flex-1 px-8 md:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground" />
              <input
                type="text"
                disabled
                placeholder="Search students, staff, classes... (Phase 1 UI placeholder)"
                className="w-full rounded-xl border border-border bg-secondary/50 py-1.5 pl-9 pr-4 text-xs text-muted-foreground cursor-not-allowed opacity-75"
              />
            </div>
          </div>

          {/* Right: Actions, Academic Session Selector, Theme, User Menu */}
          <div className="flex items-center gap-2">
            {/* Academic Session Selector */}
            {allSessions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                    <Calendar className="size-3.5 shrink-0" />
                    <span>{selectedSession?.name || activeSession?.name || "Session"}</span>
                    <ChevronDown className="size-3 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Academic Sessions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allSessions.map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() => setSelectedSession(s)}
                      className={`flex items-center justify-between text-xs cursor-pointer font-medium ${
                        selectedSession?.id === s.id ? "bg-secondary font-bold text-primary" : ""
                      }`}
                    >
                      <span>{s.name}</span>
                      {s.isActive && (
                        <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[9px] font-bold">
                          Active
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground opacity-60 cursor-not-allowed"
              title="Notifications placeholder"
            >
              <Bell className="size-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground opacity-60 cursor-not-allowed"
              title="Help placeholder"
            >
              <HelpCircle className="size-4" />
            </Button>

            <div className="mx-1 h-5 w-px bg-border" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-1.5 pl-2 text-left transition-colors hover:bg-secondary">
                  <div className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden flex-col text-left sm:flex">
                    <span className="text-xs font-bold leading-none">{userProfile?.displayName || "User"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{membership?.role || "OWNER"}</span>
                  </div>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold leading-none">{userProfile?.displayName}</p>
                    <p className="text-[11px] leading-none text-muted-foreground">{userProfile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="size-4" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
