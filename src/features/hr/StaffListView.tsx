import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit2,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listStaff, listDepartments, listDesignations } from "@/services/hrService";
import type { Staff, Department, Designation } from "@/types/hr";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export const StaffListView: React.FC = () => {
  const { organization } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedDesignation, setSelectedDesignation] = useState("ALL");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStaffData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [staffData, deptData, desigData] = await Promise.all([
        listStaff(organization.id),
        listDepartments(organization.id),
        listDesignations(organization.id),
      ]);
      setStaffList(staffData);
      setDepartments(deptData);
      setDesignations(desigData);
    } catch (err: any) {
      console.error("fetchStaffData error:", err);
      setError(err.message || "Failed to load staff directory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [organization]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contact.mobile.includes(searchQuery) ||
        (s.contact.email && s.contact.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept =
        selectedDepartment === "ALL" || s.professional.departmentId === selectedDepartment;

      const matchesDesig =
        selectedDesignation === "ALL" || s.professional.designationId === selectedDesignation;

      const matchesType =
        selectedEmploymentType === "ALL" || s.professional.employmentType === selectedEmploymentType;

      const matchesStatus = selectedStatus === "ALL" || s.status === selectedStatus;

      return matchesSearch && matchesDept && matchesDesig && matchesType && matchesStatus;
    });
  }, [
    staffList,
    searchQuery,
    selectedDepartment,
    selectedDesignation,
    selectedEmploymentType,
    selectedStatus,
  ]);

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStaff.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStaff, currentPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Inactive":
        return "bg-muted text-muted-foreground border-border";
      case "On Leave":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Resigned":
      case "Terminated":
      case "Retired":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-secondary text-secondary-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Staff & Faculty Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage employee profiles, designations, contracts, and employment records.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/hr/staff/new">
            <Plus className="size-3.5 mr-1.5" /> Register New Staff
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Designation Filter */}
          <select
            value={selectedDesignation}
            onChange={(e) => {
              setSelectedDesignation(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Designations</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Employment Type Filter */}
          <select
            value={selectedEmploymentType}
            onChange={(e) => {
              setSelectedEmploymentType(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Employment Types</option>
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Intern">Intern</option>
            <option value="Other">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Directory Table / Cards */}
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
          <Button onClick={fetchStaffData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No staff members found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search criteria or register a new employee.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/hr/staff/new">
              <Plus className="size-3.5 mr-1" /> Add Staff Member
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                          {staff.personal.photoUrl ? (
                            <img src={staff.personal.photoUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="font-bold text-xs text-muted-foreground">
                              {staff.personal.firstName[0]}
                              {staff.personal.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{staff.fullName}</p>
                          {staff.professional.isTeachingStaff && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                              <GraduationCap className="size-3" /> Faculty
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {staff.employeeId}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {staff.professional.departmentName}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {staff.professional.designationName}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {staff.professional.employmentType}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {staff.professional.joiningDate}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <p>{staff.contact.mobile}</p>
                      {staff.contact.email && (
                        <p className="text-[10px] text-muted-foreground/80 truncate max-w-[140px]">
                          {staff.contact.email}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          staff.status
                        )}`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link to="/hr/staff/$staffId" params={{ staffId: staff.id }}>
                            <Eye className="size-3.5 mr-1" /> View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link to="/hr/staff/$staffId/edit" params={{ staffId: staff.id }}>
                            <Edit2 className="size-3.5 text-muted-foreground" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedStaff.map((staff) => (
              <div
                key={staff.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                      {staff.personal.photoUrl ? (
                        <img src={staff.personal.photoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="font-bold text-sm text-muted-foreground">
                          {staff.personal.firstName[0]}
                          {staff.personal.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{staff.fullName}</p>
                      <span className="font-mono text-xs font-bold text-primary">
                        {staff.employeeId}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                      staff.status
                    )}`}
                  >
                    {staff.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface/50 p-2.5 rounded-2xl border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Department</span>
                    <span className="font-semibold text-foreground">
                      {staff.professional.departmentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Designation</span>
                    <span className="font-semibold text-foreground">
                      {staff.professional.designationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Type</span>
                    <span className="font-semibold text-foreground">
                      {staff.professional.employmentType}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Mobile</span>
                    <span className="font-semibold text-foreground">{staff.contact.mobile}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/hr/staff/$staffId" params={{ staffId: staff.id }}>
                      View Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/hr/staff/$staffId/edit" params={{ staffId: staff.id }}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredStaff.length} staff members)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl text-xs h-8"
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl text-xs h-8"
                >
                  Next <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
