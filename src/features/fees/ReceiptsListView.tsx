import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Search,
  Printer,
  Receipt,
  Calendar,
  CreditCard,
  Building2,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeePayment } from "@/types/fees";
import { listFeePayments } from "@/services/feeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ReceiptsListView: React.FC = () => {
  const { organization } = useAuth();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const list = await listFeePayments(organization.id, {
        searchQuery: searchQuery || undefined,
      });
      setPayments(list);
    } catch (err) {
      console.error("listFeePayments error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filteredReceipts = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      p.receiptNumber.toLowerCase().includes(term) ||
      p.studentName.toLowerCase().includes(term) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Fee Receipts Repository
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Search, view, reprint, and verify issued student payment vouchers.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt number, student name..."
            className="pl-8 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-lift space-y-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>

            {/* School Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                {organization?.logoUrl ? (
                  <img src={organization.logoUrl} alt="Logo" className="size-10 rounded-xl object-contain border" />
                ) : (
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">{organization?.name || "InSuite School"}</h3>
                  <p className="text-[10px] text-muted-foreground">{organization?.address || "School Campus"}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 uppercase">
                  Fee Receipt
                </span>
                <p className="font-mono text-xs font-bold text-foreground mt-1">{selectedReceipt.receiptNumber}</p>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Student Name</span>
                <p className="font-bold text-foreground">{selectedReceipt.studentName}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Invoice Reference</span>
                <p className="font-mono text-foreground">{selectedReceipt.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Date of Payment</span>
                <p className="text-foreground">{selectedReceipt.paymentDate}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Payment Method</span>
                <p className="font-semibold text-foreground">{selectedReceipt.method}</p>
              </div>
              {selectedReceipt.referenceNumber && (
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Transaction ID / Ref #</span>
                  <p className="font-mono text-foreground">{selectedReceipt.referenceNumber}</p>
                </div>
              )}
            </div>

            {/* Amount Banner */}
            <div className="flex items-center justify-between rounded-2xl bg-secondary/80 p-4 border border-border">
              <span className="text-xs font-bold text-foreground uppercase">Amount Received</span>
              <span className="font-mono text-xl font-black text-emerald-600">
                ₹{selectedReceipt.amount.toLocaleString()}
              </span>
            </div>

            {/* Footer / Signatures */}
            <div className="flex items-end justify-between pt-4 border-t border-border text-[11px] text-muted-foreground">
              <div>
                <p>Issued By: <strong className="text-foreground">{selectedReceipt.collectedByName}</strong></p>
                <p className="text-[10px]">Generated electronically via InSuite ERP</p>
              </div>
              <div className="text-center">
                <div className="w-24 border-b border-muted-foreground/40 mb-1" />
                <span className="text-[9px] uppercase font-bold">Authorized Signatory</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl text-xs">
                <Printer className="size-3.5 mr-1" /> Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/70" />
          ))}
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <FileText className="mx-auto size-8 text-muted-foreground opacity-50" />
          <p className="text-xs font-semibold text-muted-foreground">No fee receipts issued yet.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Receipt #</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Payment Date</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Cashier</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-foreground">{r.receiptNumber}</td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{r.studentName}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{r.paymentDate}</td>
                    <td className="px-4 py-3.5 font-medium">{r.method}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-600">₹{r.amount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{r.collectedByName}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReceipt(r)}
                        className="rounded-lg h-7 px-2 text-xs font-semibold"
                      >
                        <Printer className="size-3.5 mr-1 text-primary" /> View & Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
