import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  RotateCcw,
  Eye,
  Edit,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  GraduationCap,
  Calendar,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listStudents, deactivateStudent } from "@/services/studentService";
import type { Student, StudentStatus, Gender } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeactivateStudentModal } from "./DeactivateStudentModal";

const CLASSES_LIST = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const SECTIONS_LIST = ["Section A", "Section B", "Section C", "Section D"];

export const StudentListView: React.FC = () => {
  const { organization, selectedSession, allSessions, firebaseUser, userProfile } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>(selectedSession?.id || "");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<Gender | "">("");
  const [selectedStatus, setSelectedStatus] = useState<StudentStatus | "">("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Deactivate modal state
  const [deactivatingStudent, setDeactivatingStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listStudents(organization.id, {
        sessionId: selectedSessionId || undefined,
        classId: selectedClass || undefined,
        sectionId: selectedSection || undefined,
        gender: selectedGender,
        status: selectedStatus,
        searchQuery,
      });
      setStudents(data);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError("Unable to load students. Please retry.");
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedSessionId, selectedClass, selectedSection, selectedGender, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSessionId(selectedSession?.id || "");
    setSelectedClass("");
    setSelectedSection("");
    setSelectedGender("");
    setSelectedStatus("");
  };

  const handleDeactivateConfirm = async (
    status: "INACTIVE" | "TRANSFERRED" | "WITHDRAWN",
    reason: string
  ) => {
    if (!organization || !deactivatingStudent || !firebaseUser) return;
    await deactivateStudent(
      organization.id,
      deactivatingStudent.id,
      status,
      reason,
      { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
    );
    await fetchStudents();
  };

  // Paginated records
  const totalPages = Math.ceil(students.length / PAGE_SIZE) || 1;
  const paginatedStudents = students.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case "ACTIVE":
        return <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">Active</span>;
      case "TRANSFERRED":
        return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Transferred</span>;
      case "WITHDRAWN":
        return <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">Withdrawn</span>;
      default:
        return <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">Inactive</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Student Directory</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {students.length} Total
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage student enrollment records, profiles, and institutional credentials.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl font-bold">
          <Link to="/students/new">
            <UserPlus className="size-4 mr-1.5" /> Enroll New Student
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Name, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border-border bg-surface pl-9 text-xs"
            />
          </div>

          {/* Academic Session Filter */}
          <div>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Sessions</option>
              {allSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Classes</option>
              {CLASSES_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Sections</option>
              {SECTIONS_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5 mr-1" /> Reset Filters
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStudents} className="rounded-xl text-xs">
            <Filter className="size-3.5 mr-1 text-primary" /> Apply Filters
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Users className="size-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-foreground">No students found</h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {searchQuery || selectedClass || selectedStatus
                ? "No students match your active filter criteria. Try resetting filters."
                : "No students enrolled in this session yet. Click Enroll New Student to add one."}
            </p>
            <Button variant="hero" size="sm" asChild className="mt-4 rounded-xl text-xs font-bold">
              <Link to="/students/new">
                <UserPlus className="size-3.5 mr-1" /> Enroll Student
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/70 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Class & Section</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Admission Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedStudents.map((student) => (
                    <tr key={student.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="size-full object-cover" />
                            ) : (
                              <span className="font-bold text-[10px] text-muted-foreground">
                                {student.firstName[0]}{student.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{student.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Adm: {student.admissionNumber || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-primary">
                        {student.studentId}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {student.academic.className} {student.academic.sectionName && `• ${student.academic.sectionName}`}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {student.gender.toLowerCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground font-mono">{student.contact.mobile || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {student.academic.admissionDate}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild className="size-7 rounded-lg">
                            <Link to="/students/$studentId" params={{ studentId: student.id }}>
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild className="size-7 rounded-lg">
                            <Link to="/students/$studentId/edit" params={{ studentId: student.id }}>
                              <Edit className="size-3.5" />
                            </Link>
                          </Button>
                          {student.status === "ACTIVE" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeactivatingStudent(student)}
                              className="size-7 rounded-lg text-destructive hover:bg-destructive/10"
                            >
                              <UserX className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Cards View */}
            <div className="grid gap-3 p-4 lg:hidden">
              {paginatedStudents.map((student) => (
                <div key={student.id} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="font-bold text-xs text-muted-foreground">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{student.fullName}</p>
                        <p className="font-mono text-xs font-semibold text-primary">{student.studentId}</p>
                      </div>
                    </div>
                    {getStatusBadge(student.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Class:</span> {student.academic.className}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Mobile:</span> {student.contact.mobile || "—"}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border pt-2">
                    <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
                      <Link to="/students/$studentId" params={{ studentId: student.id }}>
                        <Eye className="size-3.5 mr-1" /> View Profile
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
                      <Link to="/students/$studentId/edit" params={{ studentId: student.id }}>
                        <Edit className="size-3.5 mr-1" /> Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(currentPage * PAGE_SIZE, students.length)} of {students.length} students
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="size-7 rounded-lg"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-2 font-semibold text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="size-7 rounded-lg"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Deactivate Student Dialog */}
      {deactivatingStudent && (
        <DeactivateStudentModal
          isOpen={!!deactivatingStudent}
          onClose={() => setDeactivatingStudent(null)}
          studentName={deactivatingStudent.fullName}
          studentId={deactivatingStudent.id}
          onConfirm={handleDeactivateConfirm}
        />
      )}
    </div>
  );
};
