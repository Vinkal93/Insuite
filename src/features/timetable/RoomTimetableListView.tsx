import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { roomSchema, type RoomInput } from "@/schemas";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getPeriods,
  getRoomTimetable,
  getTimetableSettings,
} from "@/services";
import type {
  Room,
  Period,
  TimetableEntry,
  DayOfWeek,
  TimetableSettingsConfig,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const RoomTimetableListView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [periodsList, setPeriodsList] = useState<Period[]>([]);
  const [settings, setSettings] = useState<TimetableSettingsConfig | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [roomSchedule, setRoomSchedule] = useState<TimetableEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      roomNumber: "",
      type: "Classroom",
      capacity: 40,
      floor: "Ground Floor",
      building: "Main Building",
      status: "Available",
    },
  });

  const loadInitialData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [rooms, periods, sett] = await Promise.all([
        getRooms(organization.id),
        getPeriods(organization.id),
        getTimetableSettings(organization.id),
      ]);
      setRoomsList(rooms);
      setPeriodsList(periods);
      setSettings(sett);

      if (rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(rooms[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load rooms.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [organization]);

  const loadSchedule = useCallback(async () => {
    if (!organization || !selectedRoomId) return;
    setIsLoadingSchedule(true);
    setError(null);
    try {
      const schedule = await getRoomTimetable(organization.id, selectedRoomId);
      setRoomSchedule(schedule);
    } catch (err: any) {
      setError(err.message || "Unable to load room schedule.");
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [organization, selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId) {
      loadSchedule();
    }
  }, [selectedRoomId, loadSchedule]);

  const handleOpenCreateModal = () => {
    setEditingRoom(null);
    form.reset({
      name: "",
      roomNumber: "",
      type: "Classroom",
      capacity: 40,
      floor: "Ground Floor",
      building: "Main Building",
      status: "Available",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    form.reset({
      name: room.name,
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: room.capacity,
      floor: room.floor,
      building: room.building,
      status: room.status,
    });
    setIsModalOpen(true);
  };

  const onSaveSubmit = async (data: RoomInput) => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingRoom) {
        await updateRoom(organization.id, editingRoom.id, data, firebaseUser.uid);
        setSuccessMsg(`Room "${data.name}" updated successfully.`);
      } else {
        await createRoom(organization.id, data, firebaseUser.uid);
        setSuccessMsg(`Room "${data.name}" created successfully.`);
      }
      setIsModalOpen(false);
      await loadInitialData();
    } catch (err: any) {
      setError(err.message || "Unable to save room changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!organization) return;
    if (!confirm(`Delete room "${room.name}" (${room.roomNumber})?`)) return;

    setIsDeletingId(room.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await deleteRoom(organization.id, room.id);
      setSuccessMsg(`Room "${room.name}" deleted.`);
      await loadInitialData();
    } catch (err: any) {
      setError(err.message || "Unable to delete room.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const selectedRoom = roomsList.find((r) => r.id === selectedRoomId);

  const workingDays: DayOfWeek[] = settings?.workingDays || [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getEntry = (day: DayOfWeek, periodId: string) => {
    return roomSchedule.find((e) => e.dayOfWeek === day && e.periodId === periodId);
  };

  const filteredRooms = roomsList.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Room Management & Occupancy
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Classroom, laboratory, and facility configurations and weekly occupancy schedules.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={handleOpenCreateModal}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1" /> Add New Room
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Room Directory List */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Registered Rooms & Laboratories
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by room name, number..."
              className="pl-9 rounded-xl border-border bg-surface text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading rooms...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No rooms configured yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreateModal}
              className="mt-4 rounded-xl text-xs"
            >
              + Create First Room
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const isSelected = room.id === selectedRoomId;

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-soft ring-1 ring-primary"
                      : "border-border bg-surface hover:bg-secondary/40"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-foreground text-sm">{room.name}</span>
                      <span className="font-mono font-bold text-xs bg-card border border-border px-2 py-0.5 rounded-lg text-primary">
                        #{room.roomNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {room.type} • Cap: {room.capacity} • {room.building} ({room.floor})
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase ${
                        room.status === "Available" ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {room.status}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(room)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDeletingId === room.id}
                        onClick={() => handleDeleteRoom(room)}
                        className="size-7 rounded-lg text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Room Occupancy Timetable */}
      {selectedRoom && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Weekly Occupancy: {selectedRoom.name} (#{selectedRoom.roomNumber})
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Double-booking prevention view showing scheduled class sessions in this room.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              {roomSchedule.length} Booked Periods
            </span>
          </div>

          {isLoadingSchedule ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="mx-auto size-6 animate-spin text-primary" />
              <p className="mt-2 text-xs font-semibold">Loading room occupancy...</p>
            </div>
          ) : periodsList.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No periods configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/60">
                    <th className="p-3 font-bold text-muted-foreground uppercase text-[10px] w-28 shrink-0">
                      Period / Time
                    </th>
                    {workingDays.map((day) => (
                      <th
                        key={day}
                        className="p-3 font-extrabold text-foreground uppercase text-[11px] tracking-wider text-center border-l border-border"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {periodsList.map((period) => (
                    <tr key={period.id} className="hover:bg-surface/30 transition-colors">
                      <td className="p-3 bg-surface/30 font-bold border-r border-border">
                        <p className="font-extrabold text-foreground">{period.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {period.startTime} - {period.endTime}
                        </p>
                      </td>

                      {workingDays.map((day) => {
                        const entry = getEntry(day, period.id);

                        return (
                          <td
                            key={day}
                            className="p-2 border-l border-border align-top h-20 min-w-[130px]"
                          >
                            {entry ? (
                              <div className="flex flex-col justify-between h-full rounded-2xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs">
                                <p className="font-extrabold text-amber-600 text-xs leading-tight">
                                  {entry.subjectName}
                                </p>
                                <p className="text-[10px] font-semibold text-foreground">
                                  {entry.className} ({entry.sectionName})
                                </p>
                                <p className="text-[10px] text-muted-foreground">{entry.teacherName}</p>
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/40 p-1 text-center">
                                <span className="text-[10px] font-bold text-emerald-600/70">
                                  Available
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              {editingRoom ? "Edit Room Details" : "Create New Room / Lab"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Configure room capacities and locations for timetable scheduling.
            </p>

            <form onSubmit={form.handleSubmit(onSaveSubmit)} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Room Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Physics Lab"
                    {...form.register("name")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.name && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="roomNumber" className="text-xs font-semibold">Room Number *</Label>
                  <Input
                    id="roomNumber"
                    placeholder="e.g. 104"
                    {...form.register("roomNumber")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.roomNumber && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.roomNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-semibold">Room Type</Label>
                  <select
                    id="type"
                    {...form.register("type")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Library">Library</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="capacity" className="text-xs font-semibold">Student Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    {...form.register("capacity")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="building" className="text-xs font-semibold">Building</Label>
                  <Input
                    id="building"
                    placeholder="e.g. Science Block"
                    {...form.register("building")}
                    className="rounded-xl border-border bg-surface text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="floor" className="text-xs font-semibold">Floor</Label>
                  <Input
                    id="floor"
                    placeholder="e.g. 2nd Floor"
                    {...form.register("floor")}
                    className="rounded-xl border-border bg-surface text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
                <select
                  id="status"
                  {...form.register("status")}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Available">Available for Classes</option>
                  <option value="Unavailable">Unavailable / Under Maintenance</option>
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSaving}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {editingRoom ? "Save Changes" : "Create Room"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
