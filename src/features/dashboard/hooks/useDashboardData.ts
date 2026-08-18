import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboardMetrics,
  calculateSetupProgress,
  getRecentActivities,
  getDerivedAlerts,
} from "../services/dashboardService";
import type {
  DashboardMetrics,
  SetupProgressData,
  ActivityItem,
  DashboardAlertItem,
} from "../types";

export const useDashboardData = () => {
  const { organization, selectedSession, activeSession } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgressData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const currentSession = selectedSession || activeSession;
      const [fetchedMetrics, fetchedActivities] = await Promise.all([
        getDashboardMetrics(organization.id, currentSession?.id),
        getRecentActivities(organization),
      ]);

      const progress = calculateSetupProgress(organization, currentSession);
      const derivedAlerts = getDerivedAlerts(organization, currentSession);

      setMetrics(fetchedMetrics);
      setSetupProgress(progress);
      setActivities(fetchedActivities);
      setAlerts(derivedAlerts);
    } catch (err: any) {
      console.error("[InSuite Dashboard Error]:", err);
      setIsError(true);
      setErrorMessage("Unable to load school operational metrics. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedSession, activeSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    metrics,
    setupProgress,
    activities,
    alerts,
    isLoading,
    isError,
    errorMessage,
    retry: loadData,
  };
};
