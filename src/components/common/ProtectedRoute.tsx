import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSetupComplete?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSetupComplete = true,
}) => {
  const { firebaseUser, organization, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking authorization..." />;
  }

  if (!firebaseUser) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  if (requireSetupComplete && (!organization || !organization.setupCompleted)) {
    if (typeof window !== "undefined") {
      window.location.href = "/setup";
    }
    return null;
  }

  return <>{children}</>;
};
