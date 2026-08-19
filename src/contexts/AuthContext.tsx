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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
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
      return;
    }

    try {
      setFirebaseUser(user);

      // Timeout wrapper to guarantee authorization check never hangs
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth loading timeout")), 8000)
      );

      const authDataPromise = (async () => {
        const profile = await syncUserProfileOnAuth(
          user.uid,
          user.email || "",
          user.displayName,
          user.photoURL
        );
        setUserProfile(profile);

        let orgId = profile.currentOrganizationId;
        let orgData: Organization | null = null;

        if (orgId) {
          orgData = await getOrganization(orgId).catch(() => null);
        }

        if (!orgData) {
          orgData = await autoProvisionDefaultOrganization(
            user.uid,
            user.email || "",
            user.displayName || profile.displayName
          );
          orgId = orgData.id;
        }

        setOrganization(orgData);

        // Load membership and active session in parallel
        const [memberData, sessionData, sessionsListData] = await Promise.all([
          getUserOrganizationMembership(orgId, user.uid).catch(() => null),
          getActiveAcademicSession(orgId).catch(() => null),
          getAcademicSessions(orgId).catch(() => []),
        ]);

        setMembership(
          memberData || {
            uid: user.uid,
            role: "OWNER",
            status: "active",
            joinedAt: new Date().toISOString() as any,
            createdAt: new Date().toISOString() as any,
            updatedAt: new Date().toISOString() as any,
          }
        );
        setActiveSession(sessionData);
        setAllSessions(sessionsListData);
        setSelectedSession(sessionData || sessionsListData[0] || null);
      })();

      await Promise.race([authDataPromise, timeoutPromise]);
    } catch (err: any) {
      console.warn("AuthContext initialization fallback:", err);
      // Fallback: Ensure user is still usable even if a sub-query was delayed
      if (user && !organization) {
        setUserProfile((prev) => prev || {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || user.email?.split("@")[0] || "Admin",
          photoURL: user.photoURL || null,
          phone: null,
          status: "active",
          currentOrganizationId: null,
          createdAt: new Date().toISOString() as any,
          updatedAt: new Date().toISOString() as any,
        });
      }
    } finally {
      setIsLoading(false);
      isLoadedRef.current = true;
    }
  };

  useEffect(() => {
    // Safety timer to prevent any infinite spinner
    const safetyTimer = setTimeout(() => {
      if (!isLoadedRef.current) {
        console.warn("Safety timer triggered: forcing isLoading = false");
        setIsLoading(false);
      }
    }, 4000);

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
      window.location.href = "/login";
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  const userRole = membership?.role?.toUpperCase();
  const canAccessAdminDashboard =
    userRole === "OWNER" ||
    userRole === "ADMIN" ||
    userRole === "PRINCIPAL" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "VICE_PRINCIPAL";

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
