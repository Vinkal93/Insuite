import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Search,
  Filter,
  Eye,
  GraduationCap,
  Loader2,
  Calendar,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listAdmissions } from "@/services/admissionService";
import type { AdmissionRecord } from "@/types/admission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AdmittedStudentsView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdmissions = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const list = await listAdmissions(organization.id, {
        sessionId: selectedSession?.id,
        searchQuery,
      });
      setAdmissions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedSession, searchQuery]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Finalized Admissions</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
              {admissions.length} Enrolled
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Directory of candidates converted to enrolled students with official admission numbers.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search Adm No, Student Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl border-border bg-card pl-9 text-xs"
        />
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : admissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <GraduationCap className="size-8 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-bold text-foreground">No finalized admissions yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              When applications are approved and converted, enrolled student records will appear here.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs font-bold">
              <Link to="/admissions/applications">Go to Applications</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Enrolled Student</th>
                  <th className="px-4 py-3">Class & Section</th>
                  <th className="px-4 py-3">Admission Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono font-bold text-primary">
                      {adm.admissionNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-foreground">{adm.studentName}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {adm.className} • {adm.sectionName || "Section A"}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{adm.admissionDate}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" asChild className="h-7 rounded-lg text-xs">
                          <Link to="/admissions/admitted/$admissionId" params={{ admissionId: adm.id }}>
                            <Eye className="size-3 mr-1" /> Admission Doc
                          </Link>
                        </Button>
                        <Button variant="hero" size="sm" asChild className="h-7 rounded-lg text-xs font-bold">
                          <Link to="/students/$studentId" params={{ studentId: adm.studentId }}>
                            <GraduationCap className="size-3 mr-1" /> Student File
                          </Link>
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
    </div>
  );
};
