import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit2,
  AlertCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  listStaff,
} from "@/services/hrService";
import type { Department, Staff } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const DepartmentsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [headStaffId, setHeadStaffId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [deptData, staffData] = await Promise.all([
        listDepartments(organization.id),
        listStaff(organization.id),
      ]);

      // Calculate active staff count for each department
      const updatedDepts = deptData.map((dept) => {
        const count = staffData.filter(
          (s) => s.professional.departmentId === dept.id && s.status === "Active"
        ).length;
        return { ...dept, staffCount: count };
      });

      setDepartments(updatedDepts);
      setStaffList(staffData.filter((s) => s.status === "Active"));
    } catch (err: any) {
      console.error("loadData error:", err);
      setError(err.message || "Failed to load departments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setName("");
    setCode("");
    setHeadStaffId("");
    setDescription("");
    setShowModal(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setHeadStaffId(dept.headStaffId || "");
    setDescription(dept.description || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    if (!name.trim() || !code.trim()) {
      alert("Department name and code are required.");
      return;
    }

    const headObj = staffList.find((s) => s.id === headStaffId);

    setIsSubmitting(true);
    try {
      if (editingDept) {
        await updateDepartment(
          organization.id,
          editingDept.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            headStaffId: headStaffId || null,
            headStaffName: headObj?.fullName || null,
            description: description.trim() || null,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      } else {
        await createDepartment(
          organization.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            headStaffId: headStaffId || null,
            headStaffName: headObj?.fullName || null,
            description: description.trim() || null,
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

  const handleDeactivate = async (dept: Department) => {
    if (!organization || !firebaseUser) return;
    if (dept.staffCount > 0) {
      alert(
        `Cannot deactivate "${dept.name}" because it currently has ${dept.staffCount} active staff member(s). Reassign them first.`
      );
      return;
    }
    if (!confirm(`Are you sure you want to deactivate department "${dept.name}"?`)) return;

    try {
      await deactivateDepartment(organization.id, dept.id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Deactivation failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Departments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure academic branches, operational units, and departmental heads.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleOpenCreate}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add Department
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
      ) : departments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Building2 className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No departments registered</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create departments (e.g. Science, Mathematics, Administration) to organize your staff.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCreate}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Create Department
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department Head</th>
                <th className="py-3 px-4">Staff Count</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{dept.name}</p>
                    {dept.description && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                        {dept.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">{dept.code}</td>
                  <td className="py-3 px-4 text-foreground font-medium">
                    {dept.headStaffName || "—"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {dept.staffCount} Active
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        dept.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {dept.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(dept)}
                        className="h-7 px-2 text-xs"
                      >
                        <Edit2 className="size-3.5 mr-1" /> Edit
                      </Button>
                      {dept.status === "Active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(dept)}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
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
              {editingDept ? "Edit Department" : "Create New Department"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Science & Technology"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Department Code * (Unique)
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. SCI"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Department Head (Optional)
                </label>
                <select
                  value={headStaffId}
                  onChange={(e) => setHeadStaffId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">None Appointed</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.professional.designationName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional details about this department's scope"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
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
                  {isSubmitting ? "Saving..." : editingDept ? "Save Changes" : "Create Department"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
