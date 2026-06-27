# API Contracts — Mentor Allocation System

This document outlines the API contracts for the routes under `/api/v1/`. All endpoints require authentication (`get_current_user` dependency) and enforce Role-Based Access Control (RBAC) via `require_roles`.

---

## Route Prefix: `/api/v1/`

### 1. Students Module (`/api/v1/students`)
* **GET `/`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of student records.
* **POST `/import`**
  * **Role Restriction**: `admin`
  * **Request Body**: `StudentImportRequest` (List of students).
  * **Response**: `{ "success": bool, "imported": int, "updated": int, "total": int }`
* **DELETE `/`**
  * **Role Restriction**: `admin`
  * **Response**: `{ "success": bool, "message": str }` (Clears all student records and cascades to allocations/meetings/scores).

---

### 2. Scoring Module (`/api/v1/scoring`)
* **GET `/`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of student scores with breakdowns and risk bands.
* **GET `/risk-summary`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: Overall risk band counts (`Green`, `Amber`, `Coral`) and total count.
* **GET `/department-risk`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of risk summaries grouped by department (including average score).
* **GET `/{student_id}`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: Individual student score breakdown and risk band.
* **POST `/import`**
  * **Role Restriction**: `admin`
  * **Request Body**: `ScoreImportRequest` (List of student raw metrics).
  * **Response**: `{ "success": bool, "updated": int, "inserted": int, "total": int }`
* **DELETE `/`**
  * **Role Restriction**: `admin`
  * **Response**: `{ "success": bool, "message": str }`

---

### 3. Mentors Module (`/api/v1/mentors`)
* **GET `/`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of all mentors.
* **POST `/`**
  * **Role Restriction**: `admin`
  * **Request Body**: `MentorCreate`
  * **Response**: `MentorResponse` (Created mentor details).
* **PUT `/{mentor_id}`**
  * **Role Restriction**: `admin`
  * **Request Body**: `MentorBase`
  * **Response**: `MentorResponse` (Updated mentor details).
* **DELETE `/{mentor_id}`**
  * **Role Restriction**: `admin`
  * **Response**: `{ "success": bool, "message": str }`

---

### 4. Allocations Module (`/api/v1/allocations`)
* **GET `/`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of raw mappings `{ "student_id": str, "mentor_id": str }`.
* **POST `/run`**
  * **Role Restriction**: `admin`
  * **Behavior**: Runs the auto-allocation engine (Greedy Min-Heap priority queue matching by department-alignment and capacity constraint).
  * **Response**: `{ "success": bool, "allocated": int, "total_new": int }`
* **GET `/details`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: Detailed list of allocations (enriched with student and mentor names).
* **GET `/unallocated`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of students currently without an assigned mentor.
* **DELETE `/`**
  * **Role Restriction**: `admin`
  * **Response**: `{ "success": bool, "message": str }` (Clears all allocation mappings).

---

### 5. Meetings Module (`/api/v1/meetings`)
* **GET `/`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of all meetings with student and mentor names.
* **POST `/`**
  * **Role Restriction**: `mentor`, `admin`
  * **Request Body**: `MeetingCreate`
  * **Response**: `{ "success": bool, "meeting_id": str }`
* **PUT `/{meeting_id}`**
  * **Role Restriction**: `mentor`, `admin`
  * **Request Body**: `MeetingUpdate`
  * **Response**: `{ "success": bool }`
* **DELETE `/{meeting_id}`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: `{ "success": bool, "message": str }`
* **GET `/mentor/{mentor_id}`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of meetings scheduled for a specific mentor.

---

### 6. Dashboard Module (`/api/v1/dashboard`)
* **GET `/stats`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: High-level statistics (`totalStudents`, `totalMentors`, `allocated`, `pending`, and `byDepartment` allocation stats).
* **GET `/workload`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: Mentor workload details showing current mentee count, maximum capacity, and lists of allocated mentees.
* **GET `/risk-summary`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: Overall risk bands summary metrics.
* **GET `/upcoming-meetings`**
  * **Role Restriction**: `mentor`, `admin`
  * **Response**: List of the next 5 upcoming scheduled meetings (filtered by current datetime).
