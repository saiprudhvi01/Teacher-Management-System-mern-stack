/**
 * Edu Track - Academic Management System
 * Core Data Models & Schema Contracts
 */

export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  rollNumber: string; // Register number starting with 99
  registrationNumber: string; // Register number starting with 99
  departmentId: string;
  departmentName: string;
  currentSemester: number;
  section: string; // e.g. "CSE-A"
  admissionYear: number;
  academicYear?: string;
  batch?: string; // e.g. "2023-2027"
  cgpa: number;
  currentSgpa: number;
  attendancePercentage: number;
  mentorFacultyId?: string;
  academicStatus?: string;
}

export interface FacultyProfile {
  id: string;
  userId: string;
  employeeId: string;
  designation: string; // e.g., "Associate Professor", "Head of Department"
  departmentId: string;
  departmentName: string;
  qualification: string;
  specialization: string;
  officeRoom: string;
  totalClassesAssigned: number;
  assignedSections?: string[];
  assignedSubjectIds?: string[];
  isHOD?: boolean;
  hodDepartmentId?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hodName: string;
  hodEmail: string;
  totalStudents: number;
  totalFaculty: number;
  totalSemesters: number;
  description: string;
  numberOfSections?: number;
}

export interface Section {
  id: string;
  name: string; // e.g. "CSE-A"
  sectionCode: string; // "A"
  departmentId: string;
  departmentCode: string;
  capacity: number;
  enrollmentCount: number;
  status: 'active' | 'inactive';
}

export interface Subject {
  id: string;
  code: string; // e.g. "CS401"
  name: string;
  departmentId: string;
  semester: number;
  credits: number;
  type: 'Theory' | 'Theory + Lab' | 'Lab only' | 'Practical' | 'Elective';
  academicYear?: string;
  theoryDuration?: number; // 1 hr
  labDuration?: number; // 2 hrs
  status?: 'active' | 'inactive';
  description?: string;
  syllabus: string[];
  assignedFacultyId?: string;
  assignedFacultyName?: string;
}

export interface CourseEnrollment {
  id: string;
  studentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  instructorName: string;
  credits: number;
  attendedClasses: number;
  totalClasses: number;
  attendancePercentage: number;
  semester: number;
  academicYear: string;
  grade?: string;
  gradePoints?: number;
  status?: string;
}

export interface TeachingAssignment {
  id: string;
  facultyId: string;
  facultyUserId?: string;
  facultyName?: string;
  departmentId?: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  semester: number;
  section: string;
  classStrength?: number;
  academicYear?: string;
  status?: 'active' | 'inactive';
}

export interface AcademicTerm {
  id: string;
  name: string; // e.g., "Fall 2026 - Odd Semester"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  totalTeachingWeeks: number;
}

export interface TimetableEntry {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  departmentId: string;
  semester: number;
  section: string;
  room: string;
  facultyId: string;
  facultyName: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface AttendanceSession {
  id: string;
  subjectId: string;
  subjectCode: string;
  departmentId: string;
  semester: number;
  section: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  facultyId: string;
  records: AttendanceRecord[];
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface StudyMaterial {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  title: string;
  description: string;
  type: 'pdf' | 'notes' | 'presentation' | 'link';
  fileSize?: string;
  url: string;
  downloadCount: number;
  uploadDate: string;
  semester: number;
  section?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  semester: number;
  section: string;
  instructions: string;
  attachmentName?: string;
  attachmentSize?: string;
  dueDate: string;
  maxMarks: number;
  createdAt: string;
  topicTag?: string; // For weak-concept detection correlation
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: string;
  fileName: string;
  fileSize: string;
  notes?: string;
  status: 'submitted' | 'graded' | 'late';
  marksAwarded?: number;
  facultyFeedback?: string;
  gradedAt?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  credits: number;
  internalMarks: number; // Max 40
  externalMarks: number; // Max 60
  totalMarks: number;    // Max 100
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';
  gradePoint: number;    // 10, 9, 8, 7, 6, 5, 0
  status: 'Pass' | 'Fail';
}

export interface AssessmentResult {
  id: string;
  studentId: string;
  semester: number;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  termName: string;
  grades: GradeRecord[];
}

export interface ExamSchedule {
  id: string;
  departmentId: string;
  departmentName: string;
  semester: number;
  section: string;
  academicYear: string;
  examType: 'Mid-Term Exam' | 'End-Semester Final' | 'Practical / Lab Viva';
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // "10:00 AM"
  endTime: string;   // "01:00 PM"
  room: string;
  instructions: string;
  isPublished: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'STUDENTS' | 'FACULTY';
  departmentId?: string; // empty means all departments
  semester?: number;
  section?: string;
  publishedBy: string; // Admin Name
  publishedAt: string;
  scheduledFor?: string;
  isScheduled?: boolean;
  priority: 'normal' | 'urgent' | 'academic';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  audience: 'STUDENTS' | 'FACULTY';
  type: 'announcement' | 'system_alert';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  urgent?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  role: UserRole;
  targetEntity: string;
  details: string;
  timestamp: string;
}

export interface InternalAssessment {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  departmentId: string;
  semester: number;
  section: string;
  title: string;
  type: 'Quiz' | 'Unit Test' | 'Mid-Term CIA' | 'Lab Viva';
  date: string;
  maxMarks: number;
  topicTag?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface AssessmentMarkEntry {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  maxMarks: number;
  feedback?: string;
  updatedAt: string;
}

export interface ConceptPerformance {
  conceptId: string;
  conceptName: string;
  subjectCode: string;
  subjectName: string;
  averageScorePercentage: number;
  benchmarkPercentage: number;
  studentsBelowThreshold: number;
  totalEvaluated: number;
  isWeak: boolean;
  reason: string;
  recommendedIntervention: string;
}

export interface ExamQuestionOption {
  key: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  questionNumber?: number;
  questionText: string;
  options: ExamQuestionOption[] | { A: string; B: string; C: string; D: string } | any;
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | string;
  marks: number;
  negativeMarks?: number;
  explanation?: string;
}

export interface OnlineExam {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  departmentId: string;
  departmentName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  section: string;
  facultyId: string;
  facultyName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  negativeMarking: boolean;
  negativeMarksPerQuestion?: number;
  maxAttempts: number;
  resultPublication: 'MANUAL_RELEASE' | 'IMMEDIATE';
  resultsReleased: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  questions: ExamQuestion[];
  createdAt: string;
  updatedAt?: string;
  attemptCount?: number;
  userAttempt?: ExamAttempt;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  departmentId: string;
  semester: number;
  section: string;
  attemptNumber: number;
  startTime: string;
  submitTime?: string;
  timeSpentSeconds?: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  answers: Record<string, string>;
  markedForReview: string[];
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  remainingSeconds?: number;
  questionEvaluations?: Array<{
    questionId: string;
    selectedOption?: string;
    correctOption?: string;
    isCorrect: boolean;
    marksAwarded: number;
    explanation?: string;
  }>;
}

export interface ExamResultsAnalytics {
  exam: OnlineExam;
  totalEligibleStudents: number;
  attendedCount: number;
  notAttendedCount: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  questionAnalytics: Array<{
    questionId: string;
    questionText: string;
    marks: number;
    correctRate: number;
    attemptCount: number;
  }>;
  submissions: ExamAttempt[];
}
