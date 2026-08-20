import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Bed, User, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostels,
  listHostelRooms,
  getAvailableBeds,
  allocateStudentBed,
} from "@/services/hostelService";
import { listStudents } from "@/services/studentService";
import type { Hostel, HostelRoom, HostelBed } from "@/types/hostel";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";

export const CreateHostelAllocationView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");

  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [beds, setBeds] = useState<HostelBed[]>([]);
  const [selectedBedId, setSelectedBedId] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [allocationDate, setAllocationDate] = useState(todayStr);
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      if (!organization) return;
      try {
        const [sList, hList] = await Promise.all([
          listStudents(organization.id),
          listHostels(organization.id),
        ]);
        setStudents(sList);
        setHostels(hList);

        if (sList.length > 0) setSelectedStudentId(sList[0].id);
        if (hList.length > 0) {
          setSelectedHostelId(hList[0].id);
          const rList = await listHostelRooms(organization.id, { hostelId: hList[0].id });
          setRooms(rList);
          if (rList.length > 0) {
            setSelectedRoomId(rList[0].id);
            const bList = await getAvailableBeds(organization.id, rList[0].id);
            setBeds(bList);
            if (bList.length > 0) setSelectedBedId(bList[0].id);
          }
        }
      } catch (err: any) {
        console.error("loadInitial error:", err);
      }
    };
    loadInitial();
  }, [organization]);

  const handleHostelChange = async (hostelId: string) => {
    if (!organization) return;
    setSelectedHostelId(hostelId);
    const rList = await listHostelRooms(organization.id, { hostelId });
    setRooms(rList);
    if (rList.length > 0) {
      setSelectedRoomId(rList[0].id);
      const bList = await getAvailableBeds(organization.id, rList[0].id);
      setBeds(bList);
      if (bList.length > 0) setSelectedBedId(bList[0].id);
      else setSelectedBedId("");
    } else {
      setSelectedRoomId("");
      setBeds([]);
      setSelectedBedId("");
    }
  };

  const handleRoomChange = async (roomId: string) => {
    if (!organization) return;
    setSelectedRoomId(roomId);
    const bList = await getAvailableBeds(organization.id, roomId);
    setBeds(bList);
    if (bList.length > 0) setSelectedBedId(bList[0].id);
    else setSelectedBedId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !selectedStudentId || !selectedBedId) return;

    const student = students.find((s) => s.id === selectedStudentId);
    const hostel = hostels.find((h) => h.id === selectedHostelId);
    const room = rooms.find((r) => r.id === selectedRoomId);
    const bed = beds.find((b) => b.id === selectedBedId);

    if (!student || !hostel || !room || !bed) {
      setError("Invalid selection details.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await allocateStudentBed(
        organization.id,
        {
          studentId: student.id,
          studentName: student.fullName,
          admissionNumber: student.admissionNumber,
          className: student.currentClass,
          hostelId: hostel.id,
          hostelName: hostel.name,
          buildingId: room.buildingId,
          floorId: room.floorId,
          roomId: room.id,
          roomNumber: room.roomNumber,
          bedId: bed.id,
          bedNumber: bed.bedNumber,
          allocationDate,
          expectedCheckoutDate: expectedCheckoutDate || undefined,
          notes: notes.trim(),
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      alert(`Bed ${bed.bedNumber} allocated to ${student.fullName} successfully.`);
      navigate({ to: "/hostel/allocations" });
    } catch (err: any) {
      setError(err.message || "Failed to allocate bed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/hostel/allocations"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Allocate Hostel Bed</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign boarding student to an available room and bed with atomic collision protection.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 text-xs text-destructive font-bold flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-foreground mb-1">Select Student *</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.admissionNumber || "No Adm"} • Class: {s.currentClass || "N/A"})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Hostel *</label>
            <select
              value={selectedHostelId}
              onChange={(e) => handleHostelChange(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Room *</label>
            <select
              value={selectedRoomId}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.roomType} • {r.capacity - (r.occupiedCount || 0)} vacant)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Available Bed *</label>
          {beds.length === 0 ? (
            <p className="text-destructive font-bold text-[11px] p-3 bg-destructive/10 rounded-2xl">
              No beds available in selected room. Please select a different room or hostel.
            </p>
          ) : (
            <select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {beds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bedNumber} (Available)
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Allocation Date *</label>
            <input
              type="date"
              required
              value={allocationDate}
              onChange={(e) => setAllocationDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Expected Checkout Date</label>
            <input
              type="date"
              value={expectedCheckoutDate}
              onChange={(e) => setExpectedCheckoutDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Allocation Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special dietary considerations, medical conditions, or parent instructions..."
            className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !selectedBedId || beds.length === 0}
            className="rounded-xl text-xs font-bold"
          >
            <Bed className="size-3.5 mr-1.5" />
            {isSubmitting ? "Allocating..." : "Confirm Bed Allocation"}
          </Button>
        </div>
      </form>
    </div>
  );
};
