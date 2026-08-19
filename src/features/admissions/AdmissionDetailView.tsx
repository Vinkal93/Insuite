import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Loader2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AdmissionRecord } from "@/types/admission";
import { Button } from "@/components/ui/button";

interface AdmissionDetailViewProps {
  admissionId: string;
}

export const AdmissionDetailView: React.FC<AdmissionDetailViewProps> = ({ admissionId }) => {
  const { organization } = useAuth();
  const [admission, setAdmission] = useState<AdmissionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecord = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const ref = doc(db, "organizations", organization.id, "admissions", admissionId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setAdmission(snap.data() as AdmissionRecord);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, admissionId]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-6">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="mt-3 text-lg font-bold">Admission Record Not Found</h2>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/admissions/admitted">Back to Admissions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
            <Link to="/admissions/admitted">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{admission.studentName}</h1>
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {admission.admissionNumber}
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                {admission.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Class <strong className="text-foreground">{admission.className}</strong> • Section: {admission.sectionName || "Section A"}
            </p>
          </div>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
          <Link to="/students/$studentId" params={{ studentId: admission.studentId }}>
            <GraduationCap className="size-3.5 mr-1.5" /> View Active Student Profile
          </Link>
        </Button>
      </div>

      {/* Details Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-2">
          Admission Credentials & Placement
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><span className="text-muted-foreground">Admission Reference:</span> <p className="font-mono font-bold text-primary">{admission.admissionNumber}</p></div>
          <div><span className="text-muted-foreground">Admission Date:</span> <p className="font-mono text-foreground">{admission.admissionDate}</p></div>
          <div><span className="text-muted-foreground">Enrolled By:</span> <p className="text-foreground">{admission.createdByName || "Admin"}</p></div>
          <div><span className="text-muted-foreground">Academic Class:</span> <p className="font-bold text-foreground">{admission.className}</p></div>
          <div><span className="text-muted-foreground">Assigned Section:</span> <p className="font-medium text-foreground">{admission.sectionName || "Section A"}</p></div>
          <div><span className="text-muted-foreground">Academic Session:</span> <p className="text-foreground">{admission.sessionName || "2026-27"}</p></div>
        </div>
      </div>
    </div>
  );
};
