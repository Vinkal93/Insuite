import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchDashboard2KPIs,
  fetchTodayAtSchool,
  fetchAttendanceOverview,
  fetchAdmissionsFunnel,
  fetchStudentDistribution,
  fetchTodayTimetable,
  fetchAttentionRequired,
  fetchRecentActivities,
  fetchSetupProgress,
} from "../services/dashboardService";
import type {
  Dashboard2KPIs,
  TodayAtSchoolData,
  AttendanceOverviewData,
  AdmissionsFunnelData,
  FeeSnapshotData,
  ClassDistributionItem,
  TodayTimetableItem,
  AttentionItem,
  UpcomingEventItem,
  SetupProgressData,
  ActivityItem,
} from "../types";

import { DashboardHeader } from "./DashboardHeader";
import { SchoolStatusStrip } from "./SchoolStatusStrip";
import { KeyMetricsSection } from "./KeyMetricsSection";
import { SetupStatusCard } from "./SetupStatusCard";
import { TodayAtSchoolWidget } from "./TodayAtSchoolWidget";
import { AttendanceOverviewWidget } from "./AttendanceOverviewWidget";
import { AdmissionFunnelWidget } from "./AdmissionFunnelWidget";
import { FeeSnapshotWidget } from "./FeeSnapshotWidget";
import { StudentDistributionWidget } from "./StudentDistributionWidget";
import { AcademicWorkWidget } from "./AcademicWorkWidget";
import { TodayTimetableWidget } from "./TodayTimetableWidget";
import { AttentionRequiredWidget } from "./AttentionRequiredWidget";
import { RecentActivityWidget } from "./RecentActivityWidget";
import { UpcomingEventsWidget } from "./UpcomingEventsWidget";
import { SchoolProfileCard } from "./SchoolProfileCard";

export const AdminDashboard: React.FC = () => {
  const { organization, selectedSession } = useAuth();

  const [kpis, setKpis] = useState<Dashboard2KPIs | null>(null);
  const [todayAtSchool, setTodayAtSchool] = useState<TodayAtSchoolData | null>(null);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverviewData | null>(null);
  const [admissionsFunnel, setAdmissionsFunnel] = useState<AdmissionsFunnelData | null>(null);
  const [studentDistribution, setStudentDistribution] = useState<ClassDistributionItem[]>([]);
  const [todayTimetable, setTodayTimetable] = useState<TodayTimetableItem[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [setupProgress, setSetupProgress] = useState<SetupProgressData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Progressive asynchronous loading
  useEffect(() => {
    if (!organization) return;
    setIsLoading(true);

    // 1. Critical KPIs
    fetchDashboard2KPIs(organization.id, selectedSession?.id).then((kpiData) => {
      setKpis(kpiData);
      setIsLoading(false);

      // 2. Operational Today at School data
      fetchTodayAtSchool(
        organization.id,
        kpiData.totalStudents.value,
        kpiData.totalTeachers.value
      ).then(setTodayAtSchool);
    });

    // 3. Attendance Overview & Admissions Funnel
    fetchAttendanceOverview(organization.id).then(setAttendanceOverview);
    fetchAdmissionsFunnel(organization.id, selectedSession?.id).then(setAdmissionsFunnel);

    // 4. Class Distribution & Timetable
    fetchStudentDistribution(organization.id, selectedSession?.id).then(setStudentDistribution);
    fetchTodayTimetable(organization.id).then(setTodayTimetable);

    // 5. Attention Required, Activities & Setup Progress
    fetchAttentionRequired(organization.id, selectedSession?.id).then(setAttentionItems);
    fetchRecentActivities(organization.id).then(setActivities);
    fetchSetupProgress(organization.id, organization).then(setSetupProgress);
  }, [organization, selectedSession]);

  const feeSnapshotData: FeeSnapshotData = {
    isConfigured: false,
    totalExpected: "₹0",
    collected: "₹0",
    pending: "₹0",
    overdue: "₹0",
    percentageCollected: 0,
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header with greeting, session picker & top actions */}
      <DashboardHeader />

      {/* 2. School Status Strip */}
      <SchoolStatusStrip setupProgress={setupProgress} />

      {/* 3. 8-KPI Key Metrics Grid */}
      <KeyMetricsSection kpis={kpis} isLoading={isLoading} />

      {/* 4. Complete Setup Checklist (hidden once 100% complete) */}
      <SetupStatusCard setupProgress={setupProgress} isLoading={isLoading} />

      {/* 5. Row 1: Today at School & Attendance Overview & Admissions Funnel */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 flex flex-col">
          <TodayAtSchoolWidget data={todayAtSchool} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <AttendanceOverviewWidget data={attendanceOverview} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <AdmissionFunnelWidget data={admissionsFunnel} isLoading={isLoading} />
        </div>
      </div>

      {/* 6. Row 2: Fee Snapshot, Students by Class, Academic Work */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 flex flex-col">
          <FeeSnapshotWidget data={feeSnapshotData} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <StudentDistributionWidget distribution={studentDistribution} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <AcademicWorkWidget kpis={kpis} isLoading={isLoading} />
        </div>
      </div>

      {/* 7. Row 3: Today's Timetable Schedule */}
      <TodayTimetableWidget timetable={todayTimetable} isLoading={isLoading} />

      {/* 8. Row 4: Attention Required, Recent Activity, Upcoming, School Profile */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AttentionRequiredWidget items={attentionItems} isLoading={isLoading} />
        <RecentActivityWidget activities={activities} isLoading={isLoading} />
        <UpcomingEventsWidget events={[]} isLoading={isLoading} />
        <SchoolProfileCard />
      </div>
    </div>
  );
};
