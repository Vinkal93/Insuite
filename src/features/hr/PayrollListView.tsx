import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CreditCard,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Building2,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listPayrollRecords,
  listStaff,
  processPayroll,
  approvePayroll,
  markPayrollPaid,
} from "@/services/hrService";
import type { PayrollRecord, Staff, PayrollStatus } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const PayrollListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Process Modal State
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mark Paid Modal State
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const loadPayroll = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [records, staff] = await Promise.all([
        listPayrollRecords(organization.id, currentMonth, currentYear),
        listStaff(organization.id, { status: "Active" }),
      ]);
      setPayrollRecords(records);
      setStaffList(staff);
    } catch (err: any) {
      console.error("Load payroll error:", err);
      setError(err.message || "Failed to load payroll records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [organization, currentMonth, currentYear]);

  const handleOpenProcess = () => {
    setSelectedStaffIds(staffList.map((s) => s.id));
    setShowProcessModal(true);
  };

  const handleRunProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || selectedStaffIds.length === 0) return;

    setIsProcessing(true);
    try {
      await processPayroll(
        organization.id,
        {
          month: currentMonth,
          year: currentYear,
          staffIds: selectedStaffIds,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowProcessModal(false);
      await loadPayroll();
    } catch (err: any) {
      alert("Payroll processing failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (payrollId: string) => {
    if (!organization || !firebaseUser) return;
    try {
      await approvePayroll(organization.id, payrollId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadPayroll();
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    }
  };

  const handleOpenMarkPaid = (payrollId: string) => {
    setSelectedPayrollId(payrollId);
    setPaymentMethod("Bank Transfer");
    setTransactionRef("");
    setShowPaidModal(true);
  };

  const handleConfirmPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !selectedPayrollId) return;

    setIsPaying(true);
    try {
      await markPayrollPaid(
        organization.id,
        selectedPayrollId,
        paymentMethod,
        transactionRef.trim() || null,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowPaidModal(false);
      await loadPayroll();
    } catch (err: any) {
      alert("Payment confirmation failed: " + err.message);
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusBadge = (status: PayrollStatus) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Approved":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Processed":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const totalGross = payrollRecords.reduce((sum, r) => sum + r.gross, 0);
  const totalNet = payrollRecords.reduce((sum, r) => sum + r.net, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Staff Compensation & Payroll
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Process monthly salary runs, manage allowances, deductions, and payment authorizations.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={handleOpenProcess}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Play className="size-3.5 mr-1.5" /> Process Monthly Payroll
        </Button>
      </div>

      {/* Period Selector & Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Month Selector */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft flex items-center justify-between">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">
              Payroll Period
            </label>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-foreground font-semibold"
              >
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-foreground font-semibold"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Total Gross */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Total Gross Payout
          </span>
          <p className="text-xl font-black text-foreground mt-1">₹{totalGross.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {payrollRecords.length} Employee Slips
          </p>
        </div>

        {/* Total Net */}
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">
            Total Net Disbursable
          </span>
          <p className="text-xl font-black text-primary mt-1">₹{totalNet.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {payrollRecords.filter((r) => r.status === "Paid").length} Disbursed
          </p>
        </div>
      </div>

      {/* Table */}
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
          <Button onClick={loadPayroll} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : payrollRecords.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <CreditCard className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">
            No payroll generated for this period
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Click "Process Monthly Payroll" to calculate salary slips for active staff.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenProcess}
            className="mt-4 rounded-xl text-xs"
          >
            <Play className="size-3.5 mr-1" /> Run Payroll Calculation
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Basic Pay</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payrollRecords.map((record) => (
                <tr key={record.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{record.staffName}</p>
                    <span className="font-mono text-[10px] text-primary font-bold">
                      {record.employeeId}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{record.departmentName}</td>
                  <td className="py-3 px-4 text-foreground font-medium">
                    ₹{record.basic.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">
                    +₹{record.totalAllowances.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-destructive font-semibold">
                    -₹{record.totalDeductions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-black text-foreground text-sm">
                    ₹{record.net.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                        record.status
                      )}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link to="/hr/payroll/$staffId" params={{ staffId: record.staffId }}>
                          Salary Profile
                        </Link>
                      </Button>

                      {record.status === "Processed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(record.id)}
                          className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-500/10 font-bold"
                        >
                          Approve
                        </Button>
                      )}

                      {record.status === "Approved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMarkPaid(record.id)}
                          className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10 font-bold"
                        >
                          Mark Paid
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

      {/* Process Payroll Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              Process Payroll ({currentMonth}/{currentYear})
            </h3>
            <p className="text-xs text-muted-foreground">
              Calculate gross and net salaries for selected active staff members.
            </p>

            <form onSubmit={handleRunProcess} className="space-y-4">
              <div className="max-h-56 overflow-y-auto space-y-2 border border-border rounded-2xl p-3 bg-surface">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-bold">
                  <span>Staff Member</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStaffIds.length === staffList.length) {
                        setSelectedStaffIds([]);
                      } else {
                        setSelectedStaffIds(staffList.map((s) => s.id));
                      }
                    }}
                    className="text-primary hover:underline text-[11px]"
                  >
                    {selectedStaffIds.length === staffList.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                {staffList.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-card p-1.5 rounded-xl"
                  >
                    <span className="font-medium text-foreground">
                      {s.fullName} ({s.professional.departmentName})
                    </span>
                    <input
                      type="checkbox"
                      checked={selectedStaffIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStaffIds((prev) => [...prev, s.id]);
                        } else {
                          setSelectedStaffIds((prev) => prev.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded text-primary"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProcessModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isProcessing || selectedStaffIds.length === 0}
                  className="rounded-xl text-xs font-bold"
                >
                  {isProcessing
                    ? "Calculating..."
                    : `Process for ${selectedStaffIds.length} Staff`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {showPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Confirm Salary Disbursement</h3>
            <form onSubmit={handleConfirmPaid} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UTR1234567890"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaidModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isPaying}
                  className="rounded-xl text-xs font-bold"
                >
                  {isPaying ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
