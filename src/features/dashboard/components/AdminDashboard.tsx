import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "../hooks/useDashboardData";
import { DashboardHeader } from "./DashboardHeader";
import { KeyMetricsSection } from "./KeyMetricsSection";
import { SetupStatusCard } from "./SetupStatusCard";
import { AdmissionOverviewCard } from "./AdmissionOverviewCard";
import { AttendanceOverviewCard } from "./AttendanceOverviewCard";
import { FeeOverviewCard } from "./FeeOverviewCard";
import { StudentDistributionCard } from "./StudentDistributionCard";
import { QuickActionsGrid } from "./QuickActionsGrid";
import { RecentActivityCard } from "./RecentActivityCard";
import { UpcomingEventsCard } from "./UpcomingEventsCard";
import { AlertsCard } from "./AlertsCard";
import { SchoolProfileCard } from "./SchoolProfileCard";
import { AccessRestricted } from "./AccessRestricted";
import { Button } from "@/components/ui/button";

export const AdminDashboard: React.FC = () => {
  const { canAccessAdminDashboard } = useAuth();
  const { metrics, setupProgress, activities, alerts, isLoading, isError, errorMessage, retry } =
    useDashboardData();

  if (!canAccessAdminDashboard) {
    return <AccessRestricted />;
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-foreground">Unable to load dashboard information</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{errorMessage}</p>
        <Button onClick={retry} variant="hero" size="sm" className="mt-5 rounded-xl text-xs">
          <RefreshCw className="size-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Dynamic Header */}
      <DashboardHeader />

      {/* SECTION 1: 8 Key Operational Metrics */}
      <KeyMetricsSection metrics={metrics} isLoading={isLoading} />

      {/* SECTION 2: School Setup Progress */}
      <SetupStatusCard setupProgress={setupProgress} isLoading={isLoading} />

      {/* SECTION 7: Quick Actions Grid */}
      <QuickActionsGrid />

      {/* Main Grid: Analytical Overviews & Sidebar Widgets */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left Column: Overviews & Activity */}
        <div className="space-y-6">
          {/* SECTIONS 3 & 4: Admission & Attendance Overviews */}
          <div className="grid gap-6 sm:grid-cols-2">
            <AdmissionOverviewCard />
            <AttendanceOverviewCard />
          </div>

          {/* SECTIONS 5 & 6: Fee & Student Distribution Overviews */}
          <div className="grid gap-6 sm:grid-cols-2">
            <FeeOverviewCard />
            <StudentDistributionCard />
          </div>

          {/* SECTION 8: Recent Audit Activity */}
          <RecentActivityCard activities={activities} />
        </div>

        {/* Right Column: Metadata & Schedule Widgets */}
        <div className="space-y-6">
          {/* SECTION 11: Compact School Information Card */}
          <SchoolProfileCard />

          {/* SECTION 10: Derived Attention Required Items */}
          <AlertsCard alerts={alerts} />

          {/* SECTION 9: Upcoming Events & Calendar */}
          <UpcomingEventsCard />
        </div>
      </div>
    </div>
  );
};
