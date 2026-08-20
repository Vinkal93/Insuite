import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  Building2,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getStaff,
  getStaffSalaryProfile,
  updateStaffSalaryProfile,
  listSalaryStructures,
} from "@/services/hrService";
import type { Staff, StaffSalaryProfile, SalaryComponent, SalaryStructure } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const StaffSalaryDetailView: React.FC = () => {
  const { staffId } = useParams({ from: "/hr/payroll/$staffId" });
  const { organization, firebaseUser, userProfile } = useAuth();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowances, setAllowances] = useState<SalaryComponent[]>([]);
  const [deductions, setDeductions] = useState<SalaryComponent[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!organization || !staffId) return;
      try {
        const [st, profile, structList] = await Promise.all([
          getStaff(organization.id, staffId),
          getStaffSalaryProfile(organization.id, staffId),
          listSalaryStructures(organization.id),
        ]);
        setStaff(st);
        setStructures(structList);

        if (profile) {
          setBasicSalary(profile.basicSalary);
          setAllowances(profile.allowances || []);
          setDeductions(profile.deductions || []);
        }
      } catch (err: any) {
        console.error("Load staff salary error:", err);
        setError(err.message || "Failed to load salary profile.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [organization, staffId]);

  const handleAddAllowance = () => {
    setAllowances((prev) => [
      ...prev,
      { id: `all_${Date.now()}`, name: "HRA / Allowance", type: "ALLOWANCE", amount: 0 },
    ]);
  };

  const handleAddDeduction = () => {
    setDeductions((prev) => [
      ...prev,
      { id: `ded_${Date.now()}`, name: "PF / Deduction", type: "DEDUCTION", amount: 0 },
    ]);
  };

  const handleRemoveAllowance = (id: string) => {
    setAllowances((prev) => prev.filter((a) => a.id !== id));
  };

  const handleRemoveDeduction = (id: string) => {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  };

  const totalAllowances = allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const grossSalary = basicSalary + totalAllowances;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !staffId) return;
    setError(null);
    setSuccess(false);

    setIsSubmitting(true);
    try {
      await updateStaffSalaryProfile(
        organization.id,
        staffId,
        {
          basicSalary,
          allowances,
          deductions,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to save salary configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error && !staff) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
        <Button variant="outline" size="sm" asChild className="mt-3 text-xs">
          <Link to="/hr/payroll">Return to Payroll</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/hr/payroll">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Compensation Profile: {staff?.fullName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {staff?.professional.designationName} • {staff?.professional.departmentName} (ID:{" "}
              {staff?.employeeId})
            </p>
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Salary profile saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Ribbon */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Base Pay</span>
          <p className="text-xl font-black text-foreground mt-1">
            ₹{basicSalary.toLocaleString()}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Gross Pay</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            ₹{grossSalary.toLocaleString()}
          </p>
          <span className="text-[10px] text-muted-foreground">+₹{totalAllowances} allowances</span>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Net Monthly Pay</span>
          <p className="text-xl font-black text-primary mt-1">₹{netSalary.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground">-₹{totalDeductions} deductions</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Salary */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Base Monthly Salary
          </h2>
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-foreground mb-1">
              Basic Salary (₹) *
            </label>
            <input
              type="number"
              min={0}
              required
              value={basicSalary}
              onChange={(e) => setBasicSalary(Number(e.target.value))}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Allowances */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Monthly Allowances</h2>
              <p className="text-xs text-muted-foreground">HRA, Travel, Medical, Special bonuses</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAllowance}
              className="rounded-xl text-xs h-8 font-semibold"
            >
              <Plus className="size-3.5 mr-1" /> Add Allowance
            </Button>
          </div>

          {allowances.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">No allowances added.</p>
          ) : (
            <div className="space-y-3">
              {allowances.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Allowance Title (e.g. HRA)"
                    value={a.name}
                    onChange={(e) => {
                      const updated = [...allowances];
                      updated[i].name = e.target.value;
                      setAllowances(updated);
                    }}
                    className="flex-1 rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <div className="w-36">
                    <input
                      type="number"
                      min={0}
                      placeholder="Amount"
                      value={a.amount}
                      onChange={(e) => {
                        const updated = [...allowances];
                        updated[i].amount = Number(e.target.value);
                        setAllowances(updated);
                      }}
                      className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAllowance(a.id)}
                    className="text-destructive h-8 px-2"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deductions */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Monthly Deductions</h2>
              <p className="text-xs text-muted-foreground">Provident Fund (PF), Income Tax, TDS, ESI</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddDeduction}
              className="rounded-xl text-xs h-8 font-semibold"
            >
              <Plus className="size-3.5 mr-1" /> Add Deduction
            </Button>
          </div>

          {deductions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">No deductions configured.</p>
          ) : (
            <div className="space-y-3">
              {deductions.map((d, i) => (
                <div key={d.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Deduction Title (e.g. PF)"
                    value={d.name}
                    onChange={(e) => {
                      const updated = [...deductions];
                      updated[i].name = e.target.value;
                      setDeductions(updated);
                    }}
                    className="flex-1 rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <div className="w-36">
                    <input
                      type="number"
                      min={0}
                      placeholder="Amount"
                      value={d.amount}
                      onChange={(e) => {
                        const updated = [...deductions];
                        updated[i].amount = Number(e.target.value);
                        setDeductions(updated);
                      }}
                      className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDeduction(d.id)}
                    className="text-destructive h-8 px-2"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/hr/payroll">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Saving..." : "Save Salary Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
};
