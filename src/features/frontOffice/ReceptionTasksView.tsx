import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listFrontOfficeTasks,
  createFrontOfficeTask,
  completeFrontOfficeTask,
} from "@/services/frontOfficeService";
import type { FrontOfficeTask, TaskPriority, TaskStatus } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const ReceptionTasksView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [tasks, setTasks] = useState<FrontOfficeTask[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New task form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Normal");
  const todayStr = new Date().toISOString().split("T")[0];
  const [dueDate, setDueDate] = useState(todayStr);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTasks = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listFrontOfficeTasks(organization.id);
      const filtered = statusFilter ? list.filter((t) => t.status === statusFilter) : list;
      setTasks(filtered);
    } catch (err: any) {
      console.error("loadTasks error:", err);
      setError(err.message || "Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [organization, statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await createFrontOfficeTask(
        organization.id,
        {
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate,
          status: "Open",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Receptionist" }
      );
      setTitle("");
      setDescription("");
      setIsCreating(false);
      await loadTasks();
    } catch (err: any) {
      alert("Failed to create task: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    const note = prompt("Enter task completion note (optional):") ?? "";
    if (!organization || !firebaseUser) return;

    try {
      await completeFrontOfficeTask(organization.id, taskId, note, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Receptionist",
      });
      await loadTasks();
    } catch (err: any) {
      alert("Failed to complete task: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Front Desk Tasks & Action Items
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational reminders, visitor passes reconciliation, visitor follow-ups, and parcel deliveries.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" />
          {isCreating ? "Cancel" : "Add Reception Task"}
        </Button>
      </div>

      {/* Task Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-soft space-y-4 text-xs"
        >
          <h3 className="font-extrabold text-sm text-foreground">New Task Assignment</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-foreground mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Follow up with courier regarding Olympiad parcels"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Details / Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions or contact person..."
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !title.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Creating..." : "Save Task"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Open", "Completed"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? `${st} Tasks` : "All Tasks"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadTasks} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <CheckSquare className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No tasks found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Add reception operational tasks to stay organized.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      t.priority === "Urgent"
                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        : t.priority === "High"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t.priority}
                  </span>
                  <span
                    className={`font-bold text-sm ${
                      t.status === "Completed" ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {t.title}
                  </span>
                </div>

                {t.description && (
                  <p className="text-muted-foreground text-[11px]">{t.description}</p>
                )}

                <p className="text-[10px] text-muted-foreground font-mono">
                  Due: {t.dueDate} • Created by: {t.createdBy}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {t.status === "Open" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleComplete(t.id)}
                    className="rounded-xl text-[11px] font-bold h-7 px-3 text-emerald-600 hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="size-3 mr-1" /> Mark Complete
                  </Button>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    ✓ Completed {t.completedBy ? `by ${t.completedBy}` : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
