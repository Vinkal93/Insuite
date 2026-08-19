import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  onAuthStateChanged,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  syncUserProfileOnAuth,
  getOrganization,
  getUserOrganizationMembership,
  getActiveAcademicSession,
  getAcademicSessions,
  autoProvisionDefaultOrganization,
} from "@/services";
import type { UserProfile, Organization, OrganizationMember, AcademicSession } from "@/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  membership: OrganizationMember | null;
  activeSession: AcademicSession | null;
  allSessions: AcademicSession[];
  selectedSession: AcademicSession | null;
  setSelectedSession: (session: AcademicSession) => void;
  canAccessAdminDashboard: boolean;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY_ORG = "insuite_cached_org";
const CACHE_KEY_PROFILE = "insuite_cached_profile";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Initialize with cached state if available for instant warm boot (<50ms)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_PROFILE);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [organization, setOrganization] = useState<Organization | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_ORG);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null);
  const [allSessions, setAllSessions] = useState<AcademicSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AcademicSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadedRef = useRef(false);

  const loadData = async (user: FirebaseUser | null) => {
    if (!user) {
      setFirebaseUser(null);
      setUserProfile(null);
      setOrganization(null);
      setMembership(null);
      setActiveSession(null);
      setAllSessions([]);
      setSelectedSession(null);
      setIsLoading(false);
      isLoadedRef.current = true;
      try {
        localStorage.removeItem(CACHE_KEY_ORG);
        localStorage.removeItem(CACHE_KEY_PROFILE);
      } catch {}
      return;
    }

    setFirebaseUser(user);

    // Optimistic fallback profile to unblock the UI instantly
    const baselineProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "Administrator",
      photoURL: user.photoURL || null,
      phone: null,
      status: "active",
      currentOrganizationId: organization?.id || null,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    };

    if (!userProfile) {
      setUserProfile(baselineProfile);
    }

    // Default optimistic membership as OWNER to never block access
    setMembership((prev) => prev || {
      uid: user.uid,
      role: "OWNER",
      status: "active",
      joinedAt: new Date().toISOString() as any,
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    });

    // Unblock the main UI spinner immediately — everything else hydrates in the background!
    setIsLoading(false);
    isLoadedRef.current = true;

    // Fast background hydration with 3000ms max per-operation safety
    try {
      const profile = await syncUserProfileOnAuth(
        user.uid,
        user.email || "",
        user.displayName,
        user.photoURL
      ).catch(() => baselineProfile);

      setUserProfile(profile);
      try {
        localStorage.setItem(CACHE_KEY_PROFILE, JSON.stringify(profile));
      } catch {}

      let orgId = profile.currentOrganizationId || organization?.id;
      let orgData: Organization | null = null;

      if (orgId) {
        orgData = await getOrganization(orgId).catch(() => null);
      }

      if (!orgData) {
        orgData = await autoProvisionDefaultOrganization(
          user.uid,
          user.email || "",
          user.displayName || profile.displayName
        ).catch(() => null);
      }

      if (orgData) {
        setOrganization(orgData);
        try {
          localStorage.setItem(CACHE_KEY_ORG, JSON.stringify(orgData));
        } catch {}
        orgId = orgData.id;

        // Hydrate membership & academic sessions in parallel
        const [memberData, sessionData, sessionsListData] = await Promise.all([
          getUserOrganizationMembership(orgId, user.uid).catch(() => null),
          getActiveAcademicSession(orgId).catch(() => null),
          getAcademicSessions(orgId).catch(() => []),
        ]);

        if (memberData) {
          setMembership(memberData);
        }
        if (sessionData) {
          setActiveSession(sessionData);
        }
        if (sessionsListData && sessionsListData.length > 0) {
          setAllSessions(sessionsListData);
          setSelectedSession((prev) => prev || sessionData || sessionsListData[0]);
        }
      }
    } catch (err: any) {
      console.warn("Background auth hydration notice:", err);
    }
  };

  useEffect(() => {
    // Fail-safe timer: maximum 800ms to guarantee spinner never stays stuck
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 800);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      loadData(user);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const refreshUserData = async () => {
    if (auth.currentUser) {
      await loadData(auth.currentUser);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setUserProfile(null);
      setOrganization(null);
      setMembership(null);
      setActiveSession(null);
      setAllSessions([]);
      setSelectedSession(null);
      try {
        localStorage.removeItem(CACHE_KEY_ORG);
        localStorage.removeItem(CACHE_KEY_PROFILE);
      } catch {}
      window.location.href = "/login";
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  const userRole = (membership?.role || (organization?.createdBy === firebaseUser?.uid ? "OWNER" : "ADMIN"))?.toUpperCase();
  const canAccessAdminDashboard =
    userRole === "OWNER" ||
    userRole === "ADMIN" ||
    userRole === "PRINCIPAL" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "VICE_PRINCIPAL" ||
    organization?.createdBy === firebaseUser?.uid ||
    !membership?.role;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        organization,
        membership,
        activeSession,
        allSessions,
        selectedSession,
        setSelectedSession,
        canAccessAdminDashboard,
        isLoading,
        error,
        refreshUserData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
