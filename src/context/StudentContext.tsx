import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStudentByAuthUserId } from "@/services/studentPortalService";
import type { Student } from "@/types/student";

interface StudentContextType {
  student: Student | null;
  isLoading: boolean;
  error: string | null;
  refreshStudentData: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudentProfile = async () => {
    if (!organization || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const s = await getStudentByAuthUserId(
        organization.id,
        firebaseUser.uid,
        userProfile?.email,
        userProfile?.phone
      );
      setStudent(s);
    } catch (err: any) {
      console.error("loadStudentProfile error:", err);
      setError(err.message || "Failed to load student profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentProfile();
  }, [organization, firebaseUser]);

  return (
    <StudentContext.Provider
      value={{
        student,
        isLoading,
        error,
        refreshStudentData: loadStudentProfile,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
};
