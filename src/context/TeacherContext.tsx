import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTeacherByAuthUserId,
  getTeacherAllocations,
  type TeacherPortalProfile,
  type TeacherAllocations,
} from "@/services/teacherPortalService";

interface TeacherContextType {
  teacher: TeacherPortalProfile | null;
  allocations: TeacherAllocations;
  isLoading: boolean;
  error: string | null;
  refreshTeacherData: () => Promise<void>;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

export const TeacherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [teacher, setTeacher] = useState<TeacherPortalProfile | null>(null);
  const [allocations, setAllocations] = useState<TeacherAllocations>({ classes: [], subjects: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeacher = async () => {
    if (!organization || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const t = await getTeacherByAuthUserId(
        organization.id,
        firebaseUser.uid,
        userProfile?.email,
        userProfile?.phone
      );
      setTeacher(t);

      if (t) {
        const allocs = await getTeacherAllocations(organization.id, t.id);
        setAllocations(allocs);
      }
    } catch (err: any) {
      console.error("loadTeacher error:", err);
      setError(err.message || "Failed to load teacher workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeacher();
  }, [organization, firebaseUser]);

  return (
    <TeacherContext.Provider
      value={{
        teacher,
        allocations,
        isLoading,
        error,
        refreshTeacherData: loadTeacher,
      }}
    >
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error("useTeacher must be used within a TeacherProvider");
  }
  return context;
};
