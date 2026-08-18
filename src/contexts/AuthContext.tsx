import React, { createContext, useContext, useEffect, useState } from "react";
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
  getUserOrganizations,
} from "@/services";
import type { UserProfile, Organization, OrganizationMember, AcademicSession } from "@/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  membership: OrganizationMember | null;
  activeSession: AcademicSession | null;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (user: FirebaseUser | null) => {
    setIsLoading(true);
    setError(null);

    if (!user) {
      setFirebaseUser(null);
      setUserProfile(null);
      setOrganization(null);
      setMembership(null);
      setActiveSession(null);
      setIsLoading(false);
      return;
    }

    try {
      setFirebaseUser(user);
      const profile = await syncUserProfileOnAuth(
        user.uid,
        user.email || "",
        user.displayName,
        user.photoURL
      );
      setUserProfile(profile);

      let orgId = profile.currentOrganizationId;

      // If user has no currentOrganizationId, check if they belong to any organization
      if (!orgId) {
        const userOrgs = await getUserOrganizations(user.uid);
        if (userOrgs.length > 0) {
          orgId = userOrgs[0].id;
        }
      }

      if (orgId) {
        const [orgData, memberData, sessionData] = await Promise.all([
          getOrganization(orgId),
          getUserOrganizationMembership(orgId, user.uid),
          getActiveAcademicSession(orgId),
        ]);
        setOrganization(orgData);
        setMembership(memberData);
        setActiveSession(sessionData);
      } else {
        setOrganization(null);
        setMembership(null);
        setActiveSession(null);
      }
    } catch (err: any) {
      console.error("AuthContext loadData error:", err);
      setError(err.message || "Failed to load authentication state");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      loadData(user);
    });
    return () => unsubscribe();
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
      window.location.href = "/login";
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        organization,
        membership,
        activeSession,
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
