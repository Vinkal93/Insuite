import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bed,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  LogOut,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostelAllocations,
  transferStudentBed,
  checkoutStudentAllocation,
  listHostels,
  listHostelRooms,
  getAvailableBeds,
} from "@/services/hostelService";
import type { HostelAllocation, Hostel, HostelRoom, HostelBed } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelAllocationsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Transfer Modal State
  const [transferringAlloc, setTransferringAlloc] = useState<HostelAllocation | null>(null);
  const [transferHostelId, setTransferHostelId] = useState("");
  const [transferRooms, setTransferRooms] = useState<HostelRoom[]>([]);
  const [transferRoomId, setTransferRoomId] = useState("");
  const [transferBeds, setTransferBeds] = useState<HostelBed[]>([]);
  const [transferBedId, setTransferBedId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [list, hList] = await Promise.all([
        listHostelAllocations(organization.id, { status: statusFilter || undefined }),
        listHostels(organization.id),
      ]);
      setHostels(hList);

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
      console.error("loadAllocations error:", err);
      setError(err.message || "Failed to load allocations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, statusFilter, search]);

  const openTransferModal = async (alloc: HostelAllocation) => {
    if (!organization) return;
    setTransferringAlloc(alloc);
    setTransferHostelId(alloc.hostelId);
    setTransferReason("");

    const rooms = await listHostelRooms(organization.id, { hostelId: alloc.hostelId });
    setTransferRooms(rooms);
    if (rooms.length > 0) {
      setTransferRoomId(rooms[0].id);
      const beds = await getAvailableBeds(organization.id, rooms[0].id);
      setTransferBeds(beds);
      if (beds.length > 0) setTransferBedId(beds[0].id);
    }
  };

  const handleTransferRoomChange = async (roomId: string) => {
    if (!organization) return;
    setTransferRoomId(roomId);
    const beds = await getAvailableBeds(organization.id, roomId);
    setTransferBeds(beds);
    if (beds.length > 0) setTransferBedId(beds[0].id);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !transferringAlloc || !transferBedId) return;

    const hostel = hostels.find((h) => h.id === transferHostelId);
    const room = transferRooms.find((r) => r.id === transferRoomId);
    const bed = transferBeds.find((b) => b.id === transferBedId);

    if (!hostel || !room || !bed) {
      alert("Invalid target room/bed selection.");
      return;
    }

    setIsTransferring(true);
    try {
      await transferStudentBed(
        organization.id,
        transferringAlloc.id,
        {
          hostelId: hostel.id,
          hostelName: hostel.name,
          buildingId: room.buildingId,
          floorId: room.floorId,
          roomId: room.id,
          roomNumber: room.roomNumber,
          bedId: bed.id,
          bedNumber: bed.bedNumber,
          reason: transferReason.trim() || "Administrative room reassignment",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      alert(`Student transferred to ${room.roomNumber} (${bed.bedNumber}) successfully.`);
      setTransferringAlloc(null);
      await loadData();
    } catch (err: any) {
      alert("Transfer failed: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCheckout = async (allocId: string, studentName: string) => {
    const reason = prompt(`Enter checkout reason for ${studentName}:`);
    if (reason === null || !organization || !firebaseUser) return;

    try {
      await checkoutStudentAllocation(
        organization.id,
        allocId,
        reason || "Student vacated hostel",
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      alert(`${studentName} checked out successfully. Bed is now available.`);
      await loadData();
    } catch (err: any) {
      alert("Checkout failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Bed Allocations
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage active room allotments, atomic bed transfers, and checkout clearances.
          </p>
        </div>

        <Link
          to="/hostel/allocations/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Allocate New Bed
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, admission number, hostel, or room..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active Allocations</option>
          <option value="Completed">Checked Out / Completed</option>
        </select>
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
          <Bed className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No allocations recorded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Assign students to hostel beds.</p>
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
                  <th className="py-3 px-4">Allocated Date</th>
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
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          a.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {a.status === "Active" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTransferModal(a)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5"
                          >
                            <ArrowRightLeft className="size-3 mr-1" /> Transfer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCheckout(a.id, a.studentName)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5 text-rose-600 hover:bg-rose-50"
                          >
                            <LogOut className="size-3 mr-1" /> Checkout
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bed Transfer Modal */}
      {transferringAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleExecuteTransfer}
            className="bg-card border border-border rounded-3xl p-6 shadow-soft w-full max-w-md space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground">
                Transfer Student Room / Bed
              </h3>
              <button
                type="button"
                onClick={() => setTransferringAlloc(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-surface/50 rounded-2xl border border-border space-y-1">
              <p className="font-bold text-foreground">{transferringAlloc.studentName}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                Current: {transferringAlloc.hostelName} • Rm {transferringAlloc.roomNumber} ({transferringAlloc.bedNumber})
              </p>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Target Room *</label>
              <select
                value={transferRoomId}
                onChange={(e) => handleTransferRoomChange(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {transferRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.roomType} • {r.capacity - (r.occupiedCount || 0)} free)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Target Available Bed *</label>
              {transferBeds.length === 0 ? (
                <p className="text-destructive font-bold text-[11px] p-2 bg-destructive/10 rounded-xl">
                  No beds available in selected room. Choose another room.
                </p>
              ) : (
                <select
                  value={transferBedId}
                  onChange={(e) => setTransferBedId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                >
                  {transferBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} (Vacant)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Reason for Transfer</label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Student requested single occupancy / Medical reason"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTransferringAlloc(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="hero"
                size="sm"
                disabled={isTransferring || !transferBedId || transferBeds.length === 0}
                className="rounded-xl text-xs font-bold"
              >
                {isTransferring ? "Transferring..." : "Confirm Transfer"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
