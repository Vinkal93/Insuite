import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Home,
  User,
  CalendarCheck,
  Clock,
  BookOpen,
  Trophy,
  CreditCard,
  BookMarked,
  Bus,
  Megaphone,
  MessageSquare,
  Bell,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { StudentProvider, useStudent } from "@/context/StudentContext";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Dashboard", route: "/student", icon: Home },
  { label: "My Profile", route: "/student/profile", icon: User },
  { label: "Attendance", route: "/student/attendance", icon: CalendarCheck },
  { label: "Timetable", route: "/student/timetable", icon: Clock },
  { label: "Homework", route: "/student/homework", icon: BookOpen },
  { label: "Exams & Results", route: "/student/exams", icon: Trophy },
  { label: "Fee Status", route: "/student/fees", icon: CreditCard },
  { label: "Library Books", route: "/student/library", icon: BookMarked },
  { label: "Transport", route: "/student/transport", icon: Bus },
  { label: "Circulars", route: "/student/notices", icon: Megaphone },
  { label: "Messages", route: "/student/messages", icon: MessageSquare },
  { label: "Notifications", route: "/student/notifications", icon: Bell },
  { label: "Documents", route: "/student/documents", icon: FileText },
  { label: "Hostel", route: "/student/hostel", icon: Building2 },
  { label: "Settings", route: "/student/settings", icon: Settings },
];

const MOBILE_BOTTOM_ITEMS = [
  { label: "Home", route: "/student", icon: Home },
  { label: "Timetable", route: "/student/timetable", icon: Clock },
  { label: "Homework", route: "/student/homework", icon: BookOpen },
  { label: "Exams", route: "/student/exams", icon: Trophy },
  { label: "More", route: "#more", icon: Menu },
];

const StudentLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization, signOut } = useAuth();
  const { student, isLoading } = useStudent();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar (Independent vertical scroll) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shadow-soft shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h2 className="text-xs font-black tracking-tight text-foreground line-clamp-1">
                {organization?.name || "Student Portal"}
              </h2>
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase">
                Student Access
              </span>
            </div>
          </div>
        </div>

        {/* Student Quick Badge */}
        {student && (
          <div className="p-3 border-b border-border bg-surface/50 flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                student.firstName.charAt(0)
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-extrabold text-foreground truncate">{student.fullName}</p>
              <p className="text-[10px] font-semibold text-primary">
                Class {student.academic.className} ({student.academic.sectionName})
              </p>
            </div>
          </div>
        )}

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

        {/* Footer Sign Out */}
        <div className="p-3 border-t border-border flex items-center justify-between">
          <div className="truncate">
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              ID: {student?.admissionNumber || "—"}
            </p>
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
              <GraduationCap className="size-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-foreground truncate max-w-[180px]">
                {student?.fullName || organization?.name || "Student Portal"}
              </h2>
              <p className="text-[9px] font-bold text-primary uppercase">
                {student ? `Class ${student.academic.className} (${student.academic.sectionName})` : "Student Portal"}
              </p>
            </div>
          </div>
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
            <h3 className="text-sm font-extrabold text-foreground">Student Navigation</h3>
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

export const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StudentProvider>
      <StudentLayoutContent>{children}</StudentLayoutContent>
    </StudentProvider>
  );
};
