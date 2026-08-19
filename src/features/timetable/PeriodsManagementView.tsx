import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { periodSchema, type PeriodInput } from "@/schemas";
import {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from "@/services";
import type { Period, PeriodType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PeriodsManagementView: React.FC = () => {
  const { organization } = useAuth();
  const [periodsList, setPeriodsList] = useState<Period[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const form = useForm<PeriodInput>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      name: "",
      number: 1,
      startTime: "09:00",
      endTime: "09:45",
      type: "Regular",
      status: "active",
    },
  });

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const periods = await getPeriods(organization.id);
      setPeriodsList(periods);
    } catch (err: any) {
      setError(err.message || "Unable to load periods.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleOpenCreateModal = () => {
    setEditingPeriod(null);
    const nextNumber = periodsList.length > 0 ? Math.max(...periodsList.map((p) => p.number)) + 1 : 1;
    form.reset({
      name: `Period ${nextNumber}`,
      number: nextNumber,
      startTime: "09:00",
      endTime: "09:45",
      type: "Regular",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (period: Period) => {
    setEditingPeriod(period);
    form.reset({
      name: period.name,
      number: period.number,
      startTime: period.startTime,
      endTime: period.endTime,
      type: period.type,
      status: period.status,
    });
    setIsModalOpen(true);
  };

  const onSaveSubmit = async (data: PeriodInput) => {
    if (!organization) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingPeriod) {
        await updatePeriod(organization.id, editingPeriod.id, data);
        setSuccessMsg(`Period "${data.name}" updated successfully.`);
      } else {
        await createPeriod(organization.id, data);
        setSuccessMsg(`Period "${data.name}" created successfully.`);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("Save period error:", err);
      setError(err.message || "Unable to save period.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePeriod = async (period: Period) => {
    if (!organization) return;
    if (!confirm(`Delete period "${period.name}" (${period.startTime} - ${period.endTime})?`)) {
      return;
    }

    setIsDeletingId(period.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await deletePeriod(organization.id, period.id);
      setSuccessMsg(`Period "${period.name}" deleted.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to delete period.");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            School Periods & Bell Timings
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure daily teaching sessions, lunch and recess intervals, and period durations with overlap protection.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={handleOpenCreateModal}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1" /> Add Period
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Periods Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading periods...</p>
          </div>
        ) : periodsList.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Clock className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No periods configured yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreateModal}
              className="mt-4 rounded-xl text-xs"
            >
              + Create First Period
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Order #</th>
                  <th className="px-4 py-3.5 font-bold">Period Name</th>
                  <th className="px-4 py-3.5 font-bold">Time Window</th>
                  <th className="px-4 py-3.5 font-bold">Type</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {periodsList.map((period) => (
                  <tr key={period.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary text-sm">
                      #{period.number}
                    </td>
                    <td className="px-4 py-4 font-extrabold text-foreground">
                      {period.name}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-foreground">
                      {period.startTime} – {period.endTime}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          period.type === "Regular"
                            ? "bg-primary/15 text-primary"
                            : period.type === "Lunch"
                            ? "bg-amber-500/15 text-amber-500"
                            : period.type === "Break"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {period.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          period.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {period.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(period)}
                          className="size-8 rounded-xl text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeletingId === period.id}
                          onClick={() => handleDeletePeriod(period)}
                          className="size-8 rounded-xl text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              {editingPeriod ? "Edit Period" : "Create School Period"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter schedule timing. Non-regular periods (Break/Lunch) disable subject assignments.
            </p>

            <form onSubmit={form.handleSubmit(onSaveSubmit)} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Period Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Period 1"
                    {...form.register("name")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.name && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="number" className="text-xs font-semibold">Sequence Number *</Label>
                  <Input
                    id="number"
                    type="number"
                    min={1}
                    {...form.register("number")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.number && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime" className="text-xs font-semibold">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...form.register("startTime")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.startTime && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.startTime.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endTime" className="text-xs font-semibold">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...form.register("endTime")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.endTime && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-semibold">Period Type</Label>
                  <select
                    id="type"
                    {...form.register("type")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Regular">Regular Class</option>
                    <option value="Break">Short Break / Recess</option>
                    <option value="Lunch">Lunch Break</option>
                    <option value="Assembly">Morning Assembly</option>
                    <option value="Other">Special Activity</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
                  <select
                    id="status"
                    {...form.register("status")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSaving}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {editingPeriod ? "Save Changes" : "Create Period"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
