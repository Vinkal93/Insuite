import React, { useState, useEffect } from "react";
import { useSearch, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  User,
  Calendar,
  Layers,
  ArrowLeft,
  Printer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Student, FeeInvoice, FeePayment } from "@/types";
import { collectFeeSchema, type CollectFeeInput } from "@/schemas/fees";
import { listStudents } from "@/services/studentService";
import { listFeeInvoices, collectFeePayment } from "@/services/feeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CollectFeesView: React.FC = () => {
  const searchParams = useSearch({ strict: false }) as { studentId?: string; invoiceId?: string };
  const { organization, firebaseUser } = useAuth();

  const [studentSearch, setStudentSearch] = useState("");
  const [matchingStudents, setMatchingStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentInvoices, setStudentInvoices] = useState<FeeInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPayment, setSuccessPayment] = useState<FeePayment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<CollectFeeInput>({
    resolver: zodResolver(collectFeeSchema),
    defaultValues: {
      studentId: "",
      invoiceId: "",
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      method: "Cash",
      referenceNumber: "",
      notes: "",
    },
  });

  // Preload student or invoice if passed in URL
  useEffect(() => {
    if (!organization) return;
    if (searchParams.studentId) {
      listStudents(organization.id).then((students) => {
        const found = students.find((s) => s.id === searchParams.studentId);
        if (found) handleSelectStudent(found);
      });
    }
  }, [organization, searchParams.studentId]);

  const handleStudentSearch = async (queryStr: string) => {
    setStudentSearch(queryStr);
    if (!organization || queryStr.trim().length < 2) {
      setMatchingStudents([]);
      return;
    }
    const students = await listStudents(organization.id, { searchQuery: queryStr });
    setMatchingStudents(students);
  };

  const handleSelectStudent = async (student: Student) => {
    if (!organization) return;
    setSelectedStudent(student);
    setMatchingStudents([]);
    setStudentSearch("");
    form.setValue("studentId", student.id);

    const invs = await listFeeInvoices(organization.id, { studentId: student.id });
    const pendingInvs = invs.filter((i) => i.balanceAmount > 0 && i.status !== "CANCELLED");
    setStudentInvoices(pendingInvs);

    if (pendingInvs.length > 0) {
      const target = searchParams.invoiceId
        ? pendingInvs.find((i) => i.id === searchParams.invoiceId) || pendingInvs[0]
        : pendingInvs[0];
      handleSelectInvoice(target);
    } else {
      setSelectedInvoice(null);
    }
  };

  const handleSelectInvoice = (inv: FeeInvoice) => {
    setSelectedInvoice(inv);
    form.setValue("invoiceId", inv.id);
    form.setValue("amount", inv.balanceAmount);
  };

  const onSubmit = async (data: CollectFeeInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payment = await collectFeePayment(organization.id, data, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "Admin",
      });
      setSuccessPayment(payment);
    } catch (err: any) {
      setErrorMsg(err.message || "Payment collection failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setSuccessPayment(null);
    if (selectedStudent) {
      handleSelectStudent(selectedStudent);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl size-9">
          <Link to="/fees">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Collect Fee Payment
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Accept fee installments, record payments, and generate official institutional receipts.
          </p>
        </div>
      </div>

      {successPayment ? (
        <div className="rounded-3xl border border-success/30 bg-card p-8 shadow-lift text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-foreground">Payment Collected Successfully!</h2>
            <p className="text-xs text-muted-foreground font-mono">
              Receipt Reference: <strong className="text-foreground">{successPayment.receiptNumber}</strong>
            </p>
          </div>

          {/* Receipt Summary Card */}
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-5 text-left text-xs space-y-3">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Student Name:</span>
              <strong className="font-bold text-foreground">{successPayment.studentName}</strong>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Invoice Reference:</span>
              <span className="font-mono font-semibold">{successPayment.invoiceNumber}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-semibold">{successPayment.method}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Payment Date:</span>
              <span>{successPayment.paymentDate}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-bold text-foreground">Amount Paid:</span>
              <span className="font-mono text-base font-black text-emerald-600">
                ₹{successPayment.amount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl text-xs font-semibold">
              <Printer className="size-3.5 mr-1.5" /> Print Receipt
            </Button>
            <Button variant="hero" size="sm" onClick={handleResetForNext} className="rounded-xl text-xs font-bold">
              Collect Another Payment
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Search & Select Student */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              1. Select Student
            </h2>

            {!selectedStudent ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Search Student by Name or ID</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={studentSearch}
                    onChange={(e) => handleStudentSearch(e.target.value)}
                    placeholder="Type student name or ID..."
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>

                {matchingStudents.length > 0 && (
                  <div className="divide-y divide-border rounded-2xl border border-border bg-surface overflow-hidden max-h-48 overflow-y-auto">
                    {matchingStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary transition-colors text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">{s.fullName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.academic.className} • ID: {s.studentId}
                          </p>
                        </div>
                        <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                    {selectedStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{selectedStudent.fullName}</h3>
                    <p className="text-muted-foreground text-[11px]">
                      {selectedStudent.academic.className} ({selectedStudent.academic.sectionName}) • ID: {selectedStudent.studentId}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSelectedInvoice(null);
                    setStudentInvoices([]);
                  }}
                  className="rounded-xl text-xs h-7"
                >
                  Change Student
                </Button>
              </div>
            )}
          </div>

          {/* Section 2: Invoice Selection & Breakdown */}
          {selectedStudent && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
                2. Select Pending Invoice
              </h2>

              {studentInvoices.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto size-7 text-emerald-600 mb-1" />
                  <p className="font-bold text-foreground">All settled!</p>
                  <p>This student currently has zero outstanding fee dues.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {studentInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => handleSelectInvoice(inv)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          selectedInvoice?.id === inv.id
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border hover:border-border/80 bg-surface"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-xs text-foreground">{inv.feeStructureName}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">Inv: {inv.invoiceNumber}</p>
                          </div>
                          <span className="font-mono text-xs font-bold text-rose-500">
                            ₹{inv.balanceAmount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">Due Date: {inv.dueDate}</p>
                      </div>
                    ))}
                  </div>

                  {selectedInvoice && (
                    <div className="rounded-2xl bg-secondary/60 p-4 border border-border space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice Subtotal:</span>
                        <span className="font-mono font-semibold">₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Already Paid:</span>
                        <span className="font-mono text-emerald-600 font-semibold">₹{selectedInvoice.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1 font-bold">
                        <span>Remaining Outstanding Balance:</span>
                        <span className="font-mono text-rose-500">₹{selectedInvoice.balanceAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Payment Form */}
          {selectedInvoice && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
                3. Payment Details
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Amount (₹) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedInvoice.balanceAmount}
                    {...form.register("amount")}
                    className="rounded-xl text-xs font-mono font-bold"
                  />
                  {form.formState.errors.amount && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Date *</Label>
                  <Input
                    type="date"
                    {...form.register("paymentDate")}
                    className="rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Method *</Label>
                  <select
                    {...form.register("method")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Transaction / Cheque Reference #</Label>
                  <Input
                    {...form.register("referenceNumber")}
                    placeholder="e.g., UPI-TXN-129031"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Notes / Remarks</Label>
                  <Input
                    {...form.register("notes")}
                    placeholder="Optional cashier notes or fee concession remarks..."
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="size-3.5 mr-1.5" />
                  )}
                  Collect & Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
