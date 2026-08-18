import React, { useState } from "react";
import { UserPlus, UserCheck, Calendar, Building2, Sparkles, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const DashboardHeader: React.FC = () => {
  const { userProfile, organization, selectedSession, activeSession } = useAuth();
  const [modalInfo, setModalInfo] = useState<{ title: string; desc: string } | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const currentSessionName = selectedSession?.name || activeSession?.name || "2026-27";
  const firstName = userProfile?.displayName?.split(" ")[0] || "Administrator";

  return (
    <>
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {getGreeting()}, {firstName}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-bold text-primary">
              <Sparkles className="size-3" /> Admin Portal
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Here's what's happening at{" "}
            <strong className="font-semibold text-foreground">{organization?.name || "your school"}</strong>{" "}
            today.
          </p>
        </div>

        {/* Quick Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setModalInfo({
                title: "Student Enrollment Module",
                desc: "Student profiles, roll number generation, and classroom allocation will be active in the upcoming Student Management phase.",
              })
            }
            className="rounded-xl text-xs font-semibold"
          >
            <UserPlus className="size-3.5 mr-1.5 text-primary" /> + Add Student
          </Button>

          <Button
            variant="hero"
            size="sm"
            onClick={() =>
              setModalInfo({
                title: "Admissions & Enquiries",
                desc: "Online inquiry forms, counseling pipeline, and enrollment verification will be available in the Admission module.",
              })
            }
            className="rounded-xl text-xs font-bold"
          >
            <UserCheck className="size-3.5 mr-1.5" /> + New Admission
          </Button>
        </div>
      </div>

      {/* Info Modal for future modules */}
      <Dialog open={!!modalInfo} onOpenChange={(open) => !open && setModalInfo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Info className="size-6" />
            </div>
            <DialogTitle className="text-center font-bold">{modalInfo?.title}</DialogTitle>
            <DialogDescription className="text-center text-xs leading-relaxed">
              {modalInfo?.desc}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            <Button variant="hero" size="sm" onClick={() => setModalInfo(null)} className="rounded-xl">
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
