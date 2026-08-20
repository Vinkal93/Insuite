import {
  collection,
  doc,
  getDocs,
  query,
  where,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Teacher, ClassTeacherAssignment, SubjectTeacherAssignment } from "@/types/academic";
import type { Staff } from "@/types/staff";
import { getTeachers, getTeacherAssignments } from "./academicService";
import { listStaff } from "./hrService";
import { getTeacherTimetable } from "./timetableService";
import { getAssignments, getSubmissionsForAssignment } from "./academicWorkService";
import { listExams } from "./examService";

export interface TeacherPortalProfile {
  id: string; // Teacher or Staff ID
  staffId?: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  photoUrl?: string;
  status: string;
}

export interface TeacherAllocations {
  classes: {
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    isClassTeacher: boolean;
  }[];
  subjects: {
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    subjectId: string;
    subjectName: string;
    periodsPerWeek?: number;
  }[];
}

// ----------------------------------------------------
// AUTHENTICATED TEACHER LOOKUP
// ----------------------------------------------------

export const getTeacherByAuthUserId = async (
  orgId: string,
  authUid: string,
  userEmail?: string | null,
  userPhone?: string | null
): Promise<TeacherPortalProfile | null> => {
  // 1. Try matching in 'teachers' collection
  const teachersCol = collection(db, "organizations", orgId, "teachers");
  
  if (userEmail) {
    const emailQ = query(teachersCol, where("email", "==", userEmail), firestoreLimit(1));
    const snap = await getDocs(emailQ);
    if (!snap.empty) {
      const t = snap.docs[0].data() as Teacher;
      return {
        id: t.id,
        employeeId: t.employeeId,
        fullName: `${t.firstName} ${t.lastName}`,
        email: t.email,
        phone: t.phone,
        designation: t.designation || "Faculty",
        department: t.department,
        photoUrl: t.photoUrl,
        status: t.status,
      };
    }
  }

  // 2. Try matching in 'staff' collection
  const staffList = await listStaff(orgId, { status: "ACTIVE" });
  if (userEmail) {
    const foundStaff = staffList.find((s) => s.email?.toLowerCase() === userEmail.toLowerCase());
    if (foundStaff) {
      return {
        id: foundStaff.id,
        staffId: foundStaff.id,
        employeeId: foundStaff.employeeId,
        fullName: `${foundStaff.firstName} ${foundStaff.lastName}`,
        email: foundStaff.email,
        phone: foundStaff.phone,
        designation: foundStaff.designation,
        department: foundStaff.department,
        photoUrl: foundStaff.avatarUrl,
        status: foundStaff.status,
      };
    }
  }

  // 3. Fallback for administrator / developer preview: retrieve first teacher or staff
  const allTeachers = await getTeachers(orgId);
  if (allTeachers.length > 0) {
    const t = allTeachers[0];
    return {
      id: t.id,
      employeeId: t.employeeId,
      fullName: `${t.firstName} ${t.lastName}`,
      email: t.email,
      phone: t.phone,
      designation: t.designation || "Faculty",
      department: t.department,
      photoUrl: t.photoUrl,
      status: t.status,
    };
  }

  if (staffList.length > 0) {
    const s = staffList[0];
    return {
      id: s.id,
      staffId: s.id,
      employeeId: s.employeeId,
      fullName: `${s.firstName} ${s.lastName}`,
      email: s.email,
      phone: s.phone,
      designation: s.designation,
      department: s.department,
      photoUrl: s.avatarUrl,
      status: s.status,
    };
  }

  return null;
};

// ----------------------------------------------------
// TEACHER CLASS & SUBJECT ALLOCATIONS
// ----------------------------------------------------

export const getTeacherAllocations = async (
  orgId: string,
  teacherId: string
): Promise<TeacherAllocations> => {
  try {
    const assignments = await getTeacherAssignments(orgId, teacherId);
    
    const classes = assignments.classTeacherAssignments
      .filter((c) => c.status === "ACTIVE")
      .map((c) => ({
        classId: c.classId,
        className: c.className,
        sectionId: c.sectionId,
        sectionName: c.sectionName,
        isClassTeacher: true,
      }));

    const subjects = assignments.subjectTeacherAssignments
      .filter((s) => s.status === "ACTIVE")
      .map((s) => ({
        classId: s.classId,
        className: s.className,
        sectionId: s.sectionId,
        sectionName: s.sectionName,
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        periodsPerWeek: s.periodsPerWeek,
      }));

    // If teacher has subject assignments in a class, also add to classes if not already there
    subjects.forEach((s) => {
      const exists = classes.some(
        (c) => c.classId === s.classId && c.sectionId === s.sectionId
      );
      if (!exists) {
        classes.push({
          classId: s.classId,
          className: s.className,
          sectionId: s.sectionId,
          sectionName: s.sectionName,
          isClassTeacher: false,
        });
      }
    });

    return { classes, subjects };
  } catch (err) {
    console.error("getTeacherAllocations error:", err);
    return { classes: [], subjects: [] };
  }
};
