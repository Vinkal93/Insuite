# InSuite — School Management Platform Blueprint (V1)

> **Positioning:** *InSuite — Complete School Management, Simplified.*  
> **Core Vision:** An all-in-one unified cloud platform powering admissions, academics, fee operations, exams, student lifecycles, parent communication, staff HR, and multi-branch operations.

---

## 1. Product Core Vision & Architecture

InSuite replaces fragmented software, Excel sheets, and manual paperwork with a single multi-tenant system:

```
InSuite Platform (SaaS Layer)
│
├── Organization (School A)
│   ├── Branch 1 (Main Campus)
│   │   ├── Academic Sessions (2025-26, 2026-27, 2027-28)
│   │   ├── Roles & Custom RBAC (Principal, Teacher, Accountant, Coordinator...)
│   │   ├── Classes & Sections
│   │   ├── Students & Multi-Child Parents
│   │   └── Staff & HR
│   └── Branch 2 (City Campus)
│
└── Organization (School B)
```

Every document and database record strictly enforces tenant isolation:
- `organizationId`: Unique school organization ID
- `branchId`: Branch/campus identifier for multi-campus support
- `sessionId`: Academic year session (data is immutable across sessions)

---

## 2. The 16 Core V1 Modules

1. **Dashboard:** Real-time, actionable KPI dashboard with instant action buttons (defaulters, leaves, exam marks entry).
2. **Admission & Enquiry:** Lead capture, inquiry management, document verification, enrollment workflow.
3. **Student Management:** 360-degree student profiles, academic history, parent linkage, certificates, and ID cards.
4. **Academic Management:** Curriculum planning, subject allocations, course outlines, and grade scale configurations.
5. **Class & Section:** Class hierarchies, section capacity, class teacher assignments, and classroom allocations.
6. **Teacher Management:** Faculty profiles, subject mapping, lecture schedules, and workload analytics.
7. **Attendance:** Multi-state marking (Present, Absent, Late, Leave), automated SMS/WhatsApp alerts for absentees.
8. **Timetable:** Interactive period scheduler, teacher clash detection, room allocations, and substitute assignments.
9. **Homework & Assignments:** Digital submissions, teacher feedback, attachment sharing, and parent visibility.
10. **Examination & Results:** Exam scheduling, marks entry, auto-grading, report card generation, and rank lists.
11. **Fee Management:** Flexible fee structures, installments, online/offline payments, discounts, and defaulter tracking.
12. **Parent Management:** Dedicated parent portal with seamless multi-child switcher (e.g. Rahul - Class 5, Anjali - Class 8).
13. **Communication:** Broadcast announcements, circulars, SMS/WhatsApp notifications, and parent-teacher messaging.
14. **Staff & HR:** Staff directories, biometric/digital attendance, leave management, and payroll records.
15. **Documents & Certificates:** Transfer certificates (TC), character certificates, bona fide certificates, and ID generation.
16. **Reports & Analytics:** Comprehensive exportable reports across collections, attendance trends, and academic performance.

---

## 3. Supporting Infrastructure Systems

- **RBAC & Dynamic Permission Engine:** Granular permission toggles for every action.
- **10-Step School Onboarding Wizard:** Seamless 10-step guided onboarding for new institutions.
- **Audit Logging & Activity History:** Full event tracking for critical administrative and financial actions.
- **Academic Session Archival:** Session switching (`2025-26` -> `2026-27`) without historical data overwrite.
- **Multi-Tenant Security & Encryption:** Data isolation per organization with encrypted communications.
