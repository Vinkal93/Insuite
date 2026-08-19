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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentUser = firebaseUser || (typeof window !== "undefined" ? auth.currentUser : null);

  useEffect(() => {
    if (isMounted && !isLoading && !currentUser) {
      navigate({ to: "/login" });
    }
  }, [isMounted, isLoading, currentUser, navigate]);

  // Ensure SSR and initial client hydration HTML match identically
  if (!isMounted) {
    return <LoadingScreen message="Checking authorization..." />;
  }

  if (isLoading && !currentUser) {
    return <LoadingScreen message="Checking authorization..." />;
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
};
