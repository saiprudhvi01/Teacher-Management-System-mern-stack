# Edu Track – Backend Architecture & MongoDB Integration Guide

Edu Track is engineered with a strict clean separation between the frontend presentation tier and the persistent data repository.

---

## 1. MERN Stack Architecture

- **Runtime**: Node.js v18+ / v20+ / v22+
- **Framework**: Express.js
- **Database**: MongoDB (Atlas or self-hosted) via Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with Argon2/bcrypt password hashing
- **Role-Based Access Control (RBAC)**: Middleware enforcing `student`, `faculty`, and `admin` permissions on route endpoints

---

## 2. Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/edutrack?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:3000
```

---

## 3. Database Models (`server/models/index.ts`)

- **User**: Authentication, email, name, role (`student` | `faculty` | `admin`), status.
- **Department**: Code (e.g. `CSE`, `ECE`), name, HOD details.
- **Subject**: Code (e.g. `CS301`), semester, credits, theory/practical, assigned faculty.
- **StudentProfile**: Roll number, department, semester, section, CGPA, attendance %.
- **FacultyProfile**: Employee ID, designation, office room, department.
- **ClassTimetable**: Day of week, start/end time, subject, room, cohort, assigned faculty. Conflict indexes prevent double-booking.
- **ExamSchedule**: Academic year, exam type, date, time slot, room, published toggle. Clash engine validates cohort/room availability.
- **AttendanceSession & Record**: Subject, date, section, faculty actor, per-student status (`present` | `absent` | `late`), audit timestamp.
- **Assignment & Submission**: Course tasks, deadlines, max marks, student attachments, faculty grades, and feedback.
- **Announcement**: Broadcast circulars with strict audience partitioning (`STUDENTS` vs `FACULTY`).

---

## 4. REST Endpoints Contract

### Authentication & Account Provisioning
- `POST /api/auth/login` – Authenticates user credentials and issues session token with role claim.
- `POST /api/auth/users` – Admin creates new student or faculty accounts.

### Academic Curriculum
- `GET /api/departments` / `POST /api/departments`
- `GET /api/subjects` / `POST /api/subjects`

### Students & Cohorts
- `GET /api/students` – List students (filterable by department, semester, section).
- `POST /api/students` – Enroll new student profile.
- `PUT /api/students/:id/transfer` – Transfer student between sections or departments with audit history.

### Timetables & Conflict Engine
- `GET /api/timetable/classes` – Query weekly periods.
- `POST /api/timetable/classes` – Create slot with conflict validation (room clash, faculty double-booking, student cohort clash).
- `GET /api/timetable/exams` – Query examination slots (respects `isPublished` filter for students).
- `POST /api/timetable/exams` – Schedule exam with room and cohort clash validation.

### Attendance & Submissions
- `POST /api/attendance/sessions` – Record attendance for class period with audit trail.
- `GET /api/assignments` / `POST /api/assignments` – Course task management.
- `POST /api/assignments/:id/submit` – Student submission upload.
- `PUT /api/submissions/:id/grade` – Faculty grading and qualitative feedback.

### Announcements
- `GET /api/announcements` – Retrieves circulars filtered strictly by audience (`STUDENTS` or `FACULTY`).
- `POST /api/announcements` – Admin broadcasts circular with priority flag.
