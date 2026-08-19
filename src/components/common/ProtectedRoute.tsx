import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSetupComplete?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSetupComplete = false,
}) => {
  const { firebaseUser, organization, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !firebaseUser) {
      navigate({ to: "/login" });
    }
  }, [isLoading, firebaseUser, navigate]);

  if (isLoading) {
    return <LoadingScreen message="Checking authorization..." />;
  }

  if (!firebaseUser) {
    return null;
  }

  return <>{children}</>;
};
