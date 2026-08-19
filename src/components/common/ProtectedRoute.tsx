import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSetupComplete?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  const { firebaseUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [safetyTimeout, setSafetyTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSafetyTimeout(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const currentUser = firebaseUser || auth.currentUser;

  useEffect(() => {
    if (!isLoading && !currentUser && safetyTimeout) {
      navigate({ to: "/login" });
    }
  }, [isLoading, currentUser, safetyTimeout, navigate]);

  if (isLoading && !currentUser && !safetyTimeout) {
    return <LoadingScreen message="Checking authorization..." />;
  }

  if (!currentUser && safetyTimeout) {
    return null;
  }

  return <>{children}</>;
};
