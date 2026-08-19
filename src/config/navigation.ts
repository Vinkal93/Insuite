import {
  LayoutDashboard,
  GraduationCap,
  UserPlus,
  Building2,
  Users,
  Calendar,
  Layers,
  BookOpen,
  UserCheck,
  PhoneCall,
  FileCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Settings,
  SlidersHorizontal,
  User,
  ClipboardCheck,
  CalendarDays,
  FileSpreadsheet,
  CreditCard,
  Receipt,
  Percent,
  AlertCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItemConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  section: string;
  permission?: string;
  children?: NavItemConfig[];
}

export interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

export const navigationConfig: NavSectionConfig[] = [
  {
    title: "Core",
    items: [
      {
        id: "core-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        route: "/dashboard",
        section: "Core",
        permission: "dashboard.view",
      },
    ],
  },
  {
    title: "Student Management",
    items: [
      {
        id: "students-directory",
        label: "Students",
        icon: GraduationCap,
        route: "/students",
        section: "Student Management",
        permission: "students.view",
      },
      {
        id: "students-new",
        label: "Enroll Student",
        icon: UserPlus,
        route: "/students/new",
        section: "Student Management",
        permission: "students.create",
      },
      {
        id: "students-promotions",
        label: "Student Promotions",
        icon: Building2,
        route: "/students/promotions",
        section: "Student Management",
        permission: "students.edit",
      },
      {
        id: "parents-directory",
        label: "Parents & Guardians",
        icon: Users,
        route: "/parents",
        section: "Student Management",
        permission: "parents.view",
      },
    ],
  },
  {
    title: "Academics",
    items: [
      {
        id: "academic-sessions",
        label: "Academic Sessions",
        icon: Calendar,
        route: "/academics/sessions",
        section: "Academics",
        permission: "academics.view",
      },
      {
        id: "academic-classes",
        label: "Classes",
        icon: GraduationCap,
        route: "/academics/classes",
        section: "Academics",
        permission: "academics.view",
      },
      {
        id: "academic-sections",
        label: "Sections",
        icon: Layers,
        route: "/academics/sections",
        section: "Academics",
        permission: "academics.view",
      },
      {
        id: "academic-subjects",
        label: "Subjects",
        icon: BookOpen,
        route: "/academics/subjects",
        section: "Academics",
        permission: "academics.view",
      },
      {
        id: "academic-teachers",
        label: "Teachers",
        icon: Users,
        route: "/academics/teachers",
        section: "Academics",
        permission: "teachers.view",
      },
      {
        id: "academic-assignments",
        label: "Assignments",
        icon: UserCheck,
        route: "/academics/assignments",
        section: "Academics",
        permission: "academics.assign",
      },
      {
        id: "academic-settings",
        label: "Settings",
        icon: Settings,
        route: "/academics/settings",
        section: "Academics",
        permission: "academics.settings",
      },
    ],
  },
  {
    title: "Admissions",
    items: [
      {
        id: "admissions-enquiries",
        label: "Enquiries",
        icon: PhoneCall,
        route: "/admissions/enquiries",
        section: "Admissions",
        permission: "admissions.view",
      },
      {
        id: "admissions-applications",
        label: "Applications",
        icon: FileCheck,
        route: "/admissions/applications",
        section: "Admissions",
        permission: "admissions.view",
      },
      {
        id: "admissions-admitted",
        label: "Admissions",
        icon: CheckCircle2,
        route: "/admissions/admitted",
        section: "Admissions",
        permission: "admissions.view",
      },
      {
        id: "admissions-followups",
        label: "Follow-ups",
        icon: Clock,
        route: "/admissions/follow-ups",
        section: "Admissions",
        permission: "admissions.view",
      },
      {
        id: "admissions-counselling",
        label: "Counselling",
        icon: MessageSquare,
        route: "/admissions/counselling",
        section: "Admissions",
        permission: "admissions.view",
      },
      {
        id: "admissions-documents",
        label: "Documents",
        icon: FileText,
        route: "/admissions/documents",
        section: "Admissions",
        permission: "admissions.view",
      },
      {
        id: "admissions-settings",
        label: "Settings",
        icon: Settings,
        route: "/admissions/settings",
        section: "Admissions",
        permission: "admissions.settings",
      },
    ],
  },
  {
    title: "Attendance",
    items: [
      {
        id: "attendance-dashboard",
        label: "Attendance Dashboard",
        icon: LayoutDashboard,
        route: "/attendance",
        section: "Attendance",
        permission: "attendance.dashboard.view",
      },
      {
        id: "attendance-students",
        label: "Student Attendance",
        icon: ClipboardCheck,
        route: "/attendance/students",
        section: "Attendance",
        permission: "attendance.view",
      },
      {
        id: "attendance-staff",
        label: "Staff Attendance",
        icon: UserCheck,
        route: "/attendance/staff",
        section: "Attendance",
        permission: "staffAttendance.view",
      },
      {
        id: "attendance-leave",
        label: "Leave Management",
        icon: CalendarDays,
        route: "/attendance/leave",
        section: "Attendance",
        permission: "leave.view",
      },
      {
        id: "attendance-reports",
        label: "Reports",
        icon: FileSpreadsheet,
        route: "/attendance/reports",
        section: "Attendance",
        permission: "attendance.reports.view",
      },
      {
        id: "attendance-settings",
        label: "Settings",
        icon: Settings,
        route: "/attendance/settings",
        section: "Attendance",
        permission: "attendance.settings",
      },
    ],
  },
  {
    title: "Timetable",
    items: [
      {
        id: "timetable-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        route: "/timetable",
        section: "Timetable",
        permission: "timetable.view",
      },
      {
        id: "timetable-classes",
        label: "Class Timetable",
        icon: GraduationCap,
        route: "/timetable/classes",
        section: "Timetable",
        permission: "timetable.view",
      },
      {
        id: "timetable-teachers",
        label: "Teacher Timetable",
        icon: Users,
        route: "/timetable/teachers",
        section: "Timetable",
        permission: "timetable.view",
      },
      {
        id: "timetable-rooms",
        label: "Room Timetable",
        icon: Building2,
        route: "/timetable/rooms",
        section: "Timetable",
        permission: "timetable.manageRooms",
      },
      {
        id: "timetable-create",
        label: "Create Timetable",
        icon: SlidersHorizontal,
        route: "/timetable/create",
        section: "Timetable",
        permission: "timetable.create",
      },
      {
        id: "timetable-substitutions",
        label: "Substitutions",
        icon: UserCheck,
        route: "/timetable/substitutions",
        section: "Timetable",
        permission: "timetable.manageSubstitutions",
      },
      {
        id: "timetable-periods",
        label: "Periods",
        icon: Clock,
        route: "/timetable/periods",
        section: "Timetable",
        permission: "timetable.managePeriods",
      },
      {
        id: "timetable-settings",
        label: "Settings",
        icon: Settings,
        route: "/timetable/settings",
        section: "Timetable",
        permission: "timetable.settings",
      },
    ],
  },
  {
    title: "Academic Work",
    items: [
      {
        id: "academic-work-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        route: "/academic-work",
        section: "Academic Work",
        permission: "academicWork.dashboard.view",
      },
      {
        id: "academic-work-assignments",
        label: "Assignments",
        icon: FileText,
        route: "/academic-work/assignments",
        section: "Academic Work",
        permission: "assignments.view",
      },
      {
        id: "academic-work-homework",
        label: "Homework",
        icon: BookOpen,
        route: "/academic-work/homework",
        section: "Academic Work",
        permission: "assignments.view",
      },
      {
        id: "academic-work-classwork",
        label: "Classwork",
        icon: Layers,
        route: "/academic-work/classwork",
        section: "Academic Work",
        permission: "assignments.view",
      },
      {
        id: "academic-work-submissions",
        label: "Submissions",
        icon: ClipboardCheck,
        route: "/academic-work/submissions",
        section: "Academic Work",
        permission: "submissions.view",
      },
      {
        id: "academic-work-grading",
        label: "Grading",
        icon: CheckCircle2,
        route: "/academic-work/grading",
        section: "Academic Work",
        permission: "submissions.grade",
      },
      {
        id: "academic-work-resources",
        label: "Resources",
        icon: FileSpreadsheet,
        route: "/academic-work/resources",
        section: "Academic Work",
        permission: "resources.view",
      },
      {
        id: "academic-work-settings",
        label: "Settings",
        icon: Settings,
        route: "/academic-work/settings",
        section: "Academic Work",
        permission: "academicWork.settings",
      },
    ],
  },
  {
    title: "Fees & Finance",
    items: [
      {
        id: "fees-dashboard",
        label: "Fees Dashboard",
        icon: LayoutDashboard,
        route: "/fees",
        section: "Fees & Finance",
        permission: "fees.dashboard.view",
      },
      {
        id: "fees-structure",
        label: "Fee Structure",
        icon: Layers,
        route: "/fees/structure",
        section: "Fees & Finance",
        permission: "feeStructure.view",
      },
      {
        id: "fees-students",
        label: "Student Fees",
        icon: Users,
        route: "/fees/students",
        section: "Fees & Finance",
        permission: "fees.view",
      },
      {
        id: "fees-collect",
        label: "Collect Fees",
        icon: CreditCard,
        route: "/fees/collect",
        section: "Fees & Finance",
        permission: "fees.collect",
      },
      {
        id: "fees-payments",
        label: "Payments",
        icon: Receipt,
        route: "/fees/payments",
        section: "Fees & Finance",
        permission: "payments.view",
      },
      {
        id: "fees-defaulters",
        label: "Defaulters",
        icon: AlertCircle,
        route: "/fees/defaulters",
        section: "Fees & Finance",
        permission: "fees.view",
      },
      {
        id: "fees-discounts",
        label: "Discounts",
        icon: Percent,
        route: "/fees/discounts",
        section: "Fees & Finance",
        permission: "discounts.view",
      },
      {
        id: "fees-receipts",
        label: "Receipts",
        icon: FileText,
        route: "/fees/receipts",
        section: "Fees & Finance",
        permission: "receipts.view",
      },
      {
        id: "fees-reports",
        label: "Reports",
        icon: FileSpreadsheet,
        route: "/fees/reports",
        section: "Fees & Finance",
        permission: "fees.reports.view",
      },
      {
        id: "fees-settings",
        label: "Settings",
        icon: Settings,
        route: "/fees/settings",
        section: "Fees & Finance",
        permission: "fees.settings",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        id: "admin-setup",
        label: "School Setup",
        icon: SlidersHorizontal,
        route: "/setup",
        section: "Administration",
        permission: "admin.setup",
      },
      {
        id: "admin-settings",
        label: "System Settings",
        icon: Settings,
        route: "/settings",
        section: "Administration",
        permission: "admin.settings",
      },
      {
        id: "admin-profile",
        label: "My Profile",
        icon: User,
        route: "/profile",
        section: "Administration",
        permission: "profile.view",
      },
    ],
  },
];

/**
 * Filter navigation items based on user role / permissions
 */
export function getFilteredNavigation(userRole?: string): NavSectionConfig[] {
  const role = userRole?.toUpperCase() || "ADMIN";

  // OWNER, ADMIN, PRINCIPAL, SUPER_ADMIN, VICE_PRINCIPAL have full access
  const isSuperOrAdmin =
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "PRINCIPAL" ||
    role === "SUPER_ADMIN" ||
    role === "VICE_PRINCIPAL";

  if (isSuperOrAdmin) {
    return navigationConfig;
  }

  // Role-specific filtering for Teachers, Staff, etc.
  return navigationConfig
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        if (role === "TEACHER") {
          // Teachers can access core dashboard, students view, academics view, teacher's own attendance & student attendance, profile, and teacher timetable
          return (
            item.route === "/dashboard" ||
            item.route === "/students" ||
            item.route.startsWith("/academics") ||
            item.route === "/attendance" ||
            item.route === "/attendance/students" ||
            item.route === "/attendance/leave" ||
            item.route === "/timetable" ||
            item.route === "/timetable/classes" ||
            item.route === "/timetable/teachers" ||
            item.route.startsWith("/academic-work") ||
            item.route === "/profile"
          );
        }
        if (role === "STAFF") {
          return (
            item.route === "/dashboard" ||
            item.route === "/attendance/leave" ||
            item.route === "/profile"
          );
        }
        return true;
      });

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);
}
