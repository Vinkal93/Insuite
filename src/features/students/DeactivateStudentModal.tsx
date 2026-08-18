import React, { useState } from "react";
import { UserX, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeactivateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentId: string;
  onConfirm: (status: "INACTIVE" | "TRANSFERRED" | "WITHDRAWN", reason: string) => Promise<void>;
}

export const DeactivateStudentModal: React.FC<DeactivateStudentModalProps> = ({
  isOpen,
  onClose,
  studentName,
  onConfirm,
}) => {
  const [status, setStatus] = useState<"INACTIVE" | "TRANSFERRED" | "WITHDRAWN">("TRANSFERRED");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(status, reason.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <UserX className="size-6" />
            </div>
            <DialogTitle className="text-center font-bold">Deactivate Student</DialogTitle>
            <DialogDescription className="text-center text-xs leading-relaxed">
              Are you sure you want to deactivate <strong className="text-foreground">{studentName}</strong>? Student historical records, transcripts, and fee ledgers will remain safely preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Deactivation Category *</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                <option value="TRANSFERRED">Transferred (TC Issued)</option>
                <option value="WITHDRAWN">Withdrawn by Guardian</option>
                <option value="INACTIVE">Inactive / Suspended</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason & Justification *</Label>
              <Textarea
                placeholder="Enter formal deactivation reason or TC reference number..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="rounded-xl border-border bg-surface text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isSubmitting || !reason.trim()}
              className="rounded-xl font-bold"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirm Deactivation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
