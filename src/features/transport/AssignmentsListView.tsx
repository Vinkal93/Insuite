import React, { useState, useEffect, useMemo } from "react";
import {
  Navigation,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Route as RouteIcon,
  MapPin,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listStudentAssignments,
  assignStudentTransport,
  cancelStudentTransportAssignment,
  listRoutes,
  getRoute,
} from "@/services/transportService";
import { listStudents } from "@/services/studentService";
import { getAcademicSessions } from "@/services/sessionService";
import type {
  StudentTransportAssignment,
  TransportRoute,
  PickupDropOption,
} from "@/types/transport";
import type { Student } from "@/types/student";
import type { AcademicSession } from "@/types/academic";
import { Button } from "@/components/ui/button";

export const AssignmentsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [routeFilter, setRouteFilter] = useState("ALL");

  // Assign Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedStopId, setSelectedStopId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [pickupDrop, setPickupDrop] = useState<PickupDropOption>("Both");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [aList, rList, sList, sessList] = await Promise.all([
        listStudentAssignments(organization.id),
        listRoutes(organization.id, { status: "Active" }),
        listStudents(organization.id),
        getAcademicSessions(organization.id),
      ]);
      setAssignments(aList);
      setRoutes(rList);
      setStudents(sList.filter((s) => s.status === "active"));
      setSessions(sessList);

      if (rList.length > 0) {
        setSelectedRouteId(rList[0].id);
        if ((rList[0].stops || []).length > 0) {
          setSelectedStopId(rList[0].stops[0].stopId);
        }
      }
      if (sessList.length > 0) setSelectedSessionId(sessList[0].id);
    } catch (err: any) {
      console.error("loadAssignments error:", err);
      setError(err.message || "Failed to load transport allocations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const selectedRouteObj = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || null;
  }, [routes, selectedRouteId]);

  const handleRouteChange = (rId: string) => {
    setSelectedRouteId(rId);
    const r = routes.find((route) => route.id === rId);
    if (r && (r.stops || []).length > 0) {
      setSelectedStopId(r.stops[0].stopId);
    } else {
      setSelectedStopId("");
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!selectedStudentId || !selectedRouteId || !selectedStopId || !selectedSessionId) {
      setModalError("Please select a student, route, designated stop, and academic session.");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignStudentTransport(
        organization.id,
        {
          studentId: selectedStudentId,
          academicSessionId: selectedSessionId,
          routeId: selectedRouteId,
          stopId: selectedStopId,
          pickupDrop,
          effectiveFrom,
          status: "Active",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowModal(false);
      setSelectedStudentId("");
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to assign student to transport.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAssignment = async (assignId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to cancel this transport assignment?")) return;

    try {
      await cancelStudentTransportAssignment(organization.id, assignId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to cancel assignment: " + err.message);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.stopName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRoute = routeFilter === "ALL" || a.routeId === routeFilter;
      return matchesSearch && matchesRoute;
    });
  }, [assignments, searchQuery, routeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Student Transport Allocations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign students to routes and stops, verify vehicle seating capacities, and manage commutes.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => {
            setModalError(null);
            setShowModal(true);
          }}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Assign Student
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-xl">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student, admission number, stop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Navigation className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No transport assignments found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign students to designated routes and pickup stops.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Assign Student
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Stop</th>
                <th className="py-3 px-4">Pickup / Drop</th>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssignments.map((a) => (
                <tr key={a.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{a.studentName}</p>
                    <p className="font-mono text-[10px] text-primary">{a.admissionNumber}</p>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {a.className} - {a.sectionName}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{a.routeName}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-foreground">{a.stopName}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Pick: {a.pickupTime} • Drop: {a.dropTime}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{a.pickupDrop}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {a.vehicleNumber ? `${a.vehicleNumber} (${a.driverName || "Driver"})` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        a.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {a.status === "Active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelAssignment(a.id)}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5 mr-1" /> Unassign
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-foreground">Assign Student to Transport</h3>

            {modalError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="" disabled>
                    Choose Student
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.personal.firstName} {s.personal.lastName} (Adm: {s.admissionNumber || s.id})
                      — {s.academic.className}-{s.academic.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Academic Session *
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {sessions.map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Transit Route *
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code}) — {r.totalStudentsAssigned} Students Assigned
                    </option>
                  ))}
                </select>
              </div>

              {selectedRouteObj && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Designated Stop *
                  </label>
                  {(selectedRouteObj.stops || []).length === 0 ? (
                    <p className="text-xs text-destructive">
                      This route has no designated stops. Please add stops to the route first.
                    </p>
                  ) : (
                    <select
                      value={selectedStopId}
                      onChange={(e) => setSelectedStopId(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {selectedRouteObj.stops.map((stop) => (
                        <option key={stop.stopId} value={stop.stopId}>
                          #{stop.sequence} — {stop.stopName} (Pick: {stop.pickupTime}, Drop:{" "}
                          {stop.dropTime})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Transit Option
                  </label>
                  <select
                    value={pickupDrop}
                    onChange={(e) => setPickupDrop(e.target.value as any)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Both">Both (Pickup & Drop)</option>
                    <option value="Pickup Only">Pickup Only (Morning)</option>
                    <option value="Drop Only">Drop Only (Afternoon)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
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
                  {isSubmitting ? "Allocating..." : "Confirm Allocation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
