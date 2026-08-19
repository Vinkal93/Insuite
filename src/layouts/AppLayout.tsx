import React, { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  User,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { getFilteredNavigation } from "@/config/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const AppLayout: React.FC<{ children: React.ReactNode; pageTitle?: string }> = ({
  children,
  pageTitle,
}) => {
  const {
    userProfile,
    organization,
    membership,
    activeSession,
    allSessions,
    selectedSession,
    setSelectedSession,
    logout,
  } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const currentPath = location.pathname;
  const filteredNavSections = getFilteredNavigation(membership?.role);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [currentPath]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ========================================================================= */}
      {/* 1. DESKTOP LEFT SIDEBAR (100vh, fixed width, independent scroll container) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-64 h-screen flex-col border-r border-border bg-card shrink-0 select-none">
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border p-1 shadow-sm shrink-0">
            <img src="/logo.png" alt="InSuite" className="size-full object-contain" />
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="font-display text-base font-extrabold tracking-tight truncate">
              {organization?.name || "InSuite"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              {organization?.code ? `Code: ${organization.code}` : "School Management"}
            </span>
          </div>
        </div>

        {/* Academic Session Badge */}
        {activeSession && (
          <div className="shrink-0 mx-3 mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <Calendar className="size-3.5 text-primary shrink-0" />
            <div className="truncate min-w-0">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Active Session</p>
              <p className="font-bold text-foreground truncate">{activeSession.name}</p>
            </div>
          </div>
        )}

        {/* Navigation Items (Independent Scroll) */}
        <nav className="flex-1 space-y-4 px-3 py-3 overflow-y-auto min-h-0">
          {filteredNavSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive =
                  currentPath === item.route ||
                  (item.route !== "/dashboard" && currentPath.startsWith(`${item.route}/`));
                return (
                  <Link
                    key={item.id}
                    to={item.route}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shrink-0">
              {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col truncate flex-1 min-w-0">
              <span className="text-xs font-semibold truncate">{userProfile?.displayName || "User"}</span>
              <span className="text-[10px] text-muted-foreground font-mono truncate">
                {membership?.role || "OWNER"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE NAVIGATION DRAWER                                              */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative z-10 flex w-72 max-w-[85vw] h-full flex-col border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="InSuite" className="size-6 object-contain" />
                <span className="font-display text-base font-extrabold">{organization?.name || "InSuite"}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Mobile Nav Links (Independent Scroll) */}
            <nav className="flex-1 space-y-4 px-3 py-3 overflow-y-auto min-h-0">
              {filteredNavSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {section.title}
                  </p>
                  {section.items.map((item) => (
                    <Link
                      key={item.id}
                      to={item.route}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                        currentPath === item.route
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>

            {/* Mobile Footer */}
            <div className="shrink-0 border-t border-border p-3 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                <LogOut className="size-4" /> Log out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT CONTAINER (100vh, Header + Independent Viewport)         */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="shrink-0 flex h-16 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6 z-30">
          {/* Left: Mobile Hamburger & Breadcrumb */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid size-9 place-items-center rounded-xl border border-border text-foreground hover:bg-secondary lg:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate">
              <Link to="/dashboard" className="hover:text-foreground shrink-0">InSuite</Link>
              <span>/</span>
              <span className="font-semibold text-foreground capitalize truncate max-w-[140px] sm:max-w-xs">
                {pageTitle || currentPath.replace("/", "") || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Center: Global Search (Desktop) */}
          <div className="hidden max-w-md flex-1 px-8 md:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search students, staff, classes, admissions, fees..."
                className="w-full rounded-xl border border-border bg-surface py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Right: Actions, Theme, Session, User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="size-9 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
              aria-label="Toggle search"
            >
              <Search className="size-4" />
            </Button>

            {/* Academic Session Selector */}
            {allSessions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
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

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-9 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="size-4 text-slate-700 dark:text-slate-200 transition-transform duration-200 hover:-rotate-12" />
              )}
            </Button>

            <div className="mx-1 h-5 w-px bg-border hidden sm:block" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-1 sm:p-1.5 sm:pl-2 text-left transition-colors hover:bg-secondary">
                  <div className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground shrink-0">
                    {userProfile?.displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="hidden flex-col text-left sm:flex">
                    <span className="text-xs font-bold leading-none truncate max-w-[100px]">
                      {userProfile?.displayName || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono leading-tight">
                      {membership?.role || "OWNER"}
                    </span>
                  </div>
                  <ChevronDown className="size-3 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-bold leading-none">{userProfile?.displayName}</p>
                    <p className="text-[11px] leading-none text-muted-foreground truncate">{userProfile?.email}</p>
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

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <div className="shrink-0 border-b border-border bg-card p-3 md:hidden">
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search students, staff, fees..."
                className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Main Content Viewport (Independent Scroll!) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
