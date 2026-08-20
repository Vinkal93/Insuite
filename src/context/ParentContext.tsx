import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getParentByAuthUserId, getParentChildren } from "@/services/parentService";
import type { Parent } from "@/types/parent";
import type { Student } from "@/types/student";

interface ParentContextType {
  parent: Parent | null;
  children: Student[];
  selectedChildId: string | null;
  selectedChild: Student | null;
  setSelectedChildId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  refreshParentData: () => Promise<void>;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

export const ParentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [parent, setParent] = useState<Parent | null>(null);
  const [childrenList, setChildrenList] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParentProfile = async () => {
    if (!organization || !firebaseUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const p = await getParentByAuthUserId(
        organization.id,
        firebaseUser.uid,
        userProfile?.email,
        userProfile?.phone
      );

      setParent(p);
      if (p) {
        const kids = await getParentChildren(organization.id, p);
        setChildrenList(kids);
        if (kids.length > 0) {
          // Default to first child if not selected or current selection is invalid
          setSelectedChildId((prev) => {
            if (prev && kids.some((k) => k.id === prev)) return prev;
            return kids[0].id;
          });
        }
      }
    } catch (err: any) {
      console.error("loadParentProfile error:", err);
      setError(err.message || "Failed to load parent profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParentProfile();
  }, [organization, firebaseUser]);

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) || null;

  return (
    <ParentContext.Provider
      value={{
        parent,
        children: childrenList,
        selectedChildId,
        selectedChild,
        setSelectedChildId,
        isLoading,
        error,
        refreshParentData: loadParentProfile,
      }}
    >
      {children}
    </ParentContext.Provider>
  );
};

export const useParent = () => {
  const context = useContext(ParentContext);
  if (!context) {
    throw new Error("useParent must be used within a ParentProvider");
  }
  return context;
};
