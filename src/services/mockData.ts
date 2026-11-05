import {
  User,
  StudentProfile,
  FacultyProfile,
  Department,
  Subject,
  CourseEnrollment,
  TimetableEntry,
  StudyMaterial,
  Assignment,
  Submission,
  AssessmentResult,
  ExamSchedule,
  Announcement,
  ConceptPerformance,
  AuditLog,
  InternalAssessment,
  AssessmentMarkEntry
} from '../types';

/**
 * System Initial Administrator Account
 * Real initial configuration — NO dummy students or academic data.
 */
export const DEFAULT_ADMIN_USER: User = {
  id: 'usr_admin_default',
  name: 'System Administrator',
  email: 'admin@edutrack.edu',
  role: 'admin',
  phone: '+1 (555) 019-2830',
  status: 'active',
  createdAt: '2026-10-09'
};

// All initial academic tables are 100% EMPTY on setup as required
export const INITIAL_USERS: User[] = [DEFAULT_ADMIN_USER];
export const INITIAL_STUDENTS: StudentProfile[] = [];
export const INITIAL_FACULTY: FacultyProfile[] = [];
export const INITIAL_DEPARTMENTS: Department[] = [];
export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_ENROLLMENTS: CourseEnrollment[] = [];
export const INITIAL_TIMETABLE: TimetableEntry[] = [];
export const INITIAL_STUDY_MATERIALS: StudyMaterial[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_SUBMISSIONS: Submission[] = [];
export const INITIAL_SEMESTER_RESULTS: AssessmentResult[] = [];
export const INITIAL_EXAM_SCHEDULES: ExamSchedule[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_CONCEPT_PERFORMANCE: ConceptPerformance[] = [];
export const INITIAL_ASSESSMENTS: InternalAssessment[] = [];
export const INITIAL_ASSESSMENT_MARKS: AssessmentMarkEntry[] = [];
export const INITIAL_ONLINE_EXAMS: any[] = [];
export const INITIAL_EXAM_ATTEMPTS: any[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_init',
    action: 'Database Initialized',
    performedBy: 'System Administrator',
    role: 'admin',
    targetEntity: 'Edu Track Core',
    details: 'Academic management system initialized with clean empty state.',
    timestamp: '2026-10-09 00:00 AM'
  }
];
