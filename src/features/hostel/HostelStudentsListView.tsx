import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Users, Search, Plus, Bed, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listHostelAllocations } from "@/services/hostelService";
import type { HostelAllocation } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelStudentsListView: React.FC = () => {
  const { organization } = useAuth();
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listHostelAllocations(organization.id, { status: "Active" });
      const filtered = search
        ? list.filter(
            (a) =>
              a.studentName.toLowerCase().includes(search.toLowerCase()) ||
              (a.admissionNumber && a.admissionNumber.toLowerCase().includes(search.toLowerCase())) ||
              a.hostelName.toLowerCase().includes(search.toLowerCase()) ||
              a.roomNumber.toLowerCase().includes(search.toLowerCase())
          )
        : list;
      setAllocations(filtered);
    } catch (err: any) {
      console.error("loadHostelStudents error:", err);
      setError(err.message || "Failed to load hostel students.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Boarding Students
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active residential students currently residing in campus boarding houses.
          </p>
        </div>

        <Link
          to="/hostel/allocations/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Allocate Bed to Student
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, admission number, hostel, or room..."
          className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
        />
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
      ) : allocations.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No boarding students found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Assign students to hostel beds using the Allocate Bed action.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Room & Bed</th>
                  <th className="py-3 px-4">Allocation Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{a.studentName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Adm: {a.admissionNumber || "N/A"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-foreground">{a.hostelName}</td>

                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      Rm {a.roomNumber} • {a.bedNumber}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">{a.allocationDate}</td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/hostel/allocations"
                        className="font-bold text-primary hover:underline text-[11px]"
                      >
                        Manage Allocation →
                      </Link>
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
