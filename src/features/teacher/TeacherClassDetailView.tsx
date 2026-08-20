import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { Users, ArrowLeft, Search, CalendarCheck, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getClassStudents } from "@/services/academicService";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";

export const TeacherClassDetailView: React.FC = () => {
  const { classId } = useParams({ strict: false }) as { classId: string };
  const { organization } = useAuth();
  const { allocations } = useTeacher();

  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const matchedClass = allocations.classes.find((c) => c.classId === classId);

  const loadStudents = async () => {
    if (!organization || !classId) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await getClassStudents(organization.id, classId);
      setStudents(list);
    } catch (err: any) {
      console.error("loadClassStudents error:", err);
      setError(err.message || "Failed to load enrolled students.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [organization, classId]);

  const filtered = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.academic.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/classes"
            className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              Class {matchedClass?.className || "Roster"} Students
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enrolled students list and individual academic dossiers.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-3 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadStudents} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No students found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {searchTerm ? "No students matching your search criteria." : "No active students enrolled."}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                          ) : (
                            s.firstName.charAt(0)
                          )}
                        </div>
                        <span className="font-bold text-foreground">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {s.academic.rollNumber || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {s.admissionNumber}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{s.gender}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/teacher/students/${s.id}`}
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px]"
                      >
                        View Profile →
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
