import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Edit2,
  AlertCircle,
  RefreshCw,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listDesignations,
  listDepartments,
  createDesignation,
  updateDesignation,
  listStaff,
} from "@/services/hrService";
import type { Designation, Department, Staff } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const DesignationsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [desigData, deptData, staffData] = await Promise.all([
        listDesignations(organization.id),
        listDepartments(organization.id),
        listStaff(organization.id),
      ]);

      const updatedDesigs = desigData.map((d) => {
        const count = staffData.filter(
          (s) => s.professional.designationId === d.id && s.status === "Active"
        ).length;
        return { ...d, staffCount: count };
      });

      setDesignations(updatedDesigs);
      setDepartments(deptData);
    } catch (err: any) {
      console.error("Designations load error:", err);
      setError(err.message || "Failed to load designations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleOpenCreate = () => {
    setEditingDesig(null);
    setName("");
    setDepartmentId("");
    setShowModal(true);
  };

  const handleOpenEdit = (desig: Designation) => {
    setEditingDesig(desig);
    setName(desig.name);
    setDepartmentId(desig.departmentId || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    if (!name.trim()) {
      alert("Designation name is required.");
      return;
    }

    const deptObj = departments.find((d) => d.id === departmentId);

    setIsSubmitting(true);
    try {
      if (editingDesig) {
        await updateDesignation(
          organization.id,
          editingDesig.id,
          {
            name: name.trim(),
            departmentId: departmentId || null,
            departmentName: deptObj?.name || null,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      } else {
        await createDesignation(
          organization.id,
          {
            name: name.trim(),
            departmentId: departmentId || null,
            departmentName: deptObj?.name || null,
            status: "Active",
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert("Operation failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Designations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define organizational roles, hierarchies, and job titles.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleOpenCreate}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add Designation
        </Button>
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : designations.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Briefcase className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No designations defined</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create designations (e.g. Principal, Senior Teacher, Lab Assistant, Accountant).
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreate}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Create Designation
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Designation Name</th>
                <th className="py-3 px-4">Associated Department</th>
                <th className="py-3 px-4">Staff Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {designations.map((desig) => (
                <tr key={desig.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{desig.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {desig.departmentName || "All Departments / General"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {desig.staffCount} Active Staff
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        desig.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {desig.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(desig)}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit2 className="size-3.5 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              {editingDesig ? "Edit Designation" : "Create New Designation"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Designation Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Faculty / Accountant"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Department (Optional)
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">General (Any Department)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : editingDesig ? "Save Changes" : "Create Designation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
