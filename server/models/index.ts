import mongoose, { Schema, Document, Model } from 'mongoose';

// ================= USER MODEL =================
export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'faculty' | 'admin';
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
  phone: { type: String },
  avatar: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// ================= DEPARTMENT MODEL =================
export interface IDepartment extends Document {
  code: string;
  name: string;
  hodName: string;
  hodEmail: string;
  description: string;
  totalStudents: number;
  totalFaculty: number;
  totalSemesters: number;
  numberOfSections?: number;
}

export const DepartmentSchema = new Schema<IDepartment>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true },
  hodName: { type: String, default: '' },
  hodEmail: { type: String, default: '' },
  description: { type: String, default: '' },
  totalStudents: { type: Number, default: 0 },
  totalFaculty: { type: Number, default: 0 },
  totalSemesters: { type: Number, default: 8 },
  numberOfSections: { type: Number, default: 3 }
});

// ================= SECTION MODEL =================
export interface ISection extends Document {
  name: string; // e.g. "CSE-A"
  sectionCode: string; // "A"
  departmentId: string;
  departmentCode: string;
  capacity: number; // default 60
  enrollmentCount: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export const SectionSchema = new Schema<ISection>({
  name: { type: String, required: true, trim: true },
  sectionCode: { type: String, required: true, uppercase: true, trim: true },
  departmentId: { type: String, required: true, index: true },
  departmentCode: { type: String, required: true, uppercase: true, trim: true },
  capacity: { type: Number, required: true, default: 60, min: 1 },
  enrollmentCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

SectionSchema.index({ departmentId: 1, name: 1 }, { unique: true });

// ================= SUBJECT MODEL =================
export interface ISubject extends Document {
  code: string;
  name: string;
  departmentId: string;
  semester: number; // 1 to 8 (B.Tech 4 Years)
  academicYear: string; // e.g. "2026-2027"
  credits: number;
  type: 'Theory' | 'Theory + Lab' | 'Lab only';
  theoryDuration: number; // 1 hour default
  labDuration: number; // 2 hours default for lab
  syllabus: string[];
  status: 'active' | 'inactive';
  assignedFacultyId?: string;
  assignedFacultyName?: string;
}

export const SubjectSchema = new Schema<ISubject>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true },
  departmentId: { type: String, required: true, index: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  academicYear: { type: String, default: '2026-2027' },
  credits: { type: Number, required: true },
  type: { type: String, enum: ['Theory', 'Theory + Lab', 'Lab only'], default: 'Theory' },
  theoryDuration: { type: Number, default: 1 },
  labDuration: { type: Number, default: 0 },
  syllabus: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  assignedFacultyId: { type: String },
  assignedFacultyName: { type: String }
});

// ================= TEACHING ASSIGNMENT MODEL =================
export interface ITeachingAssignment extends Document {
  facultyId: string;
  facultyUserId: string;
  facultyName: string;
  departmentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  section: string; // e.g. "CSE-A"
  academicYear: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export const TeachingAssignmentSchema = new Schema<ITeachingAssignment>({
  facultyId: { type: String, required: true, index: true },
  facultyUserId: { type: String, required: true },
  facultyName: { type: String, required: true },
  departmentId: { type: String, required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  academicYear: { type: String, default: '2026-2027' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// ================= STUDENT PROFILE MODEL =================
export interface IStudentProfile extends Document {
  userId: string;
  rollNumber: string; // Register number starting with 99
  registrationNumber: string; // Register number starting with 99
  departmentId: string;
  departmentName: string;
  currentSemester: number; // 1 to 8
  section: string; // e.g. "CSE-A"
  admissionYear: number;
  academicYear: string;
  batch: string; // e.g. "2023-2027"
  cgpa: number;
  currentSgpa: number;
  attendancePercentage: number;
  mentorFacultyId?: string;
}

export const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  rollNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  departmentId: { type: String, required: true, index: true },
  departmentName: { type: String, required: true },
  currentSemester: { type: Number, required: true, min: 1, max: 8 },
  section: { type: String, required: true, default: 'CSE-A' },
  admissionYear: { type: Number, required: true },
  academicYear: { type: String, default: '2026-2027' },
  batch: { type: String, default: '2023-2027' },
  cgpa: { type: Number, default: 0 },
  currentSgpa: { type: Number, default: 0 },
  attendancePercentage: { type: Number, default: 0 },
  mentorFacultyId: { type: String }
});

// ================= FACULTY PROFILE MODEL =================
export interface IFacultyProfile extends Document {
  userId: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  qualification: string;
  specialization: string;
  officeRoom: string;
  totalClassesAssigned: number;
  assignedSections: string[];
  assignedSubjectIds: string[];
  isHOD: boolean;
  hodDepartmentId?: string;
}

export const FacultyProfileSchema = new Schema<IFacultyProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  designation: { type: String, required: true },
  departmentId: { type: String, required: true, index: true },
  departmentName: { type: String, required: true },
  qualification: { type: String, default: 'M.Tech / Ph.D.' },
  specialization: { type: String, default: 'Computer Science' },
  officeRoom: { type: String, required: true },
  totalClassesAssigned: { type: Number, default: 0 },
  assignedSections: [{ type: String }],
  assignedSubjectIds: [{ type: String }],
  isHOD: { type: Boolean, default: false },
  hodDepartmentId: { type: String }
});

// ================= COURSE ENROLLMENT MODEL =================
export interface ICourseEnrollment extends Document {
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
}

export const CourseEnrollmentSchema = new Schema<ICourseEnrollment>({
  studentId: { type: String, required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  instructorName: { type: String, default: 'Unassigned' },
  credits: { type: Number, required: true },
  attendedClasses: { type: Number, default: 0 },
  totalClasses: { type: Number, default: 0 },
  attendancePercentage: { type: Number, default: 0 },
  semester: { type: Number, required: true },
  academicYear: { type: String, default: '2026-2027' }
});

// ================= TIMETABLE ENTRY MODEL =================
export interface ITimetableEntry extends Document {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
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

export const TimetableEntrySchema = new Schema<ITimetableEntry>({
  dayOfWeek: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subjectId: { type: String, required: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  departmentId: { type: String, required: true, index: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  room: { type: String, required: true },
  facultyId: { type: String, required: true, index: true },
  facultyName: { type: String, required: true }
});

// ================= ATTENDANCE SESSION MODEL =================
export interface IAttendanceRecord {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface IAttendanceSession extends Document {
  subjectId: string;
  subjectCode: string;
  departmentId: string;
  semester: number;
  section: string;
  date: string;
  timeSlot: string;
  facultyId: string;
  records: IAttendanceRecord[];
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

export const AttendanceSessionSchema = new Schema<IAttendanceSession>({
  subjectId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  departmentId: { type: String, required: true, index: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  date: { type: String, required: true, index: true },
  timeSlot: { type: String, required: true },
  facultyId: { type: String, required: true },
  records: [{
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    remarks: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  updatedBy: { type: String }
});

// ================= ASSIGNMENT & SUBMISSION MODEL =================
export interface IAssignment extends Document {
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
  topicTag?: string;
  createdAt: Date;
}

export const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  subjectId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  facultyId: { type: String, required: true, index: true },
  facultyName: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  instructions: { type: String, required: true },
  attachmentName: { type: String },
  attachmentSize: { type: String },
  dueDate: { type: String, required: true },
  maxMarks: { type: Number, default: 100 },
  topicTag: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export interface ISubmission extends Document {
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

export const SubmissionSchema = new Schema<ISubmission>({
  assignmentId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  submittedAt: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' },
  marksAwarded: { type: Number },
  facultyFeedback: { type: String },
  gradedAt: { type: String }
});

// ================= INTERNAL ASSESSMENT & MARKS MODEL =================
export interface IInternalAssessment extends Document {
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
  createdAt: Date;
}

export const InternalAssessmentSchema = new Schema<IInternalAssessment>({
  id: { type: String, required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  facultyId: { type: String, required: true },
  facultyName: { type: String, required: true },
  departmentId: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['Quiz', 'Unit Test', 'Mid-Term CIA', 'Lab Viva'], required: true },
  date: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  topicTag: { type: String },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export interface IAssessmentMarkEntry extends Document {
  assessmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  maxMarks: number;
  feedback?: string;
  updatedAt: string;
}

export const AssessmentMarkEntrySchema = new Schema<IAssessmentMarkEntry>({
  assessmentId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  feedback: { type: String },
  updatedAt: { type: String, required: true }
});

// ================= STUDY MATERIAL MODEL =================
export interface IStudyMaterial extends Document {
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

export const StudyMaterialSchema = new Schema<IStudyMaterial>({
  subjectId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  facultyId: { type: String, required: true },
  facultyName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['pdf', 'notes', 'presentation', 'link'], default: 'pdf' },
  fileSize: { type: String },
  url: { type: String, required: true },
  downloadCount: { type: Number, default: 0 },
  uploadDate: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String }
});

// ================= EXAM SCHEDULE MODEL =================
export interface IExamSchedule extends Document {
  departmentId: string;
  departmentName: string;
  semester: number;
  section: string;
  academicYear: string;
  examType: 'Mid-Term Exam' | 'End-Semester Final' | 'Practical / Lab Viva';
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
  instructions: string;
  isPublished: boolean;
}

export const ExamScheduleSchema = new Schema<IExamSchedule>({
  departmentId: { type: String, required: true, index: true },
  departmentName: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  academicYear: { type: String, default: '2026-2027' },
  examType: { type: String, enum: ['Mid-Term Exam', 'End-Semester Final', 'Practical / Lab Viva'], required: true },
  subjectId: { type: String, required: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  examDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, required: true },
  instructions: { type: String, default: '' },
  isPublished: { type: Boolean, default: false }
});

// ================= ANNOUNCEMENT MODEL =================
export interface IAnnouncement extends Document {
  title: string;
  message: string;
  audience: 'STUDENTS' | 'FACULTY';
  departmentId?: string;
  semester?: number;
  section?: string;
  publishedBy: string;
  publishedAt: string;
  priority: 'normal' | 'urgent' | 'academic';
}

export const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  audience: { type: String, enum: ['STUDENTS', 'FACULTY'], required: true },
  departmentId: { type: String },
  semester: { type: Number },
  section: { type: String },
  publishedBy: { type: String, required: true },
  publishedAt: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'urgent', 'academic'], default: 'normal' }
});

// ================= AUDIT LOG MODEL =================
export interface IAuditLog extends Document {
  action: string;
  performedBy: string;
  role: 'student' | 'faculty' | 'admin';
  targetEntity: string;
  details: string;
  timestamp: string;
}

export const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'admin'], required: true },
  targetEntity: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: String, required: true }
});

// ================= ONLINE EXAMINATION MODEL =================
export interface IExamQuestion {
  id: string;
  questionNumber?: number;
  questionText: string;
  options: any; // Normalized array of { key: string, text: string } or object { A, B, C, D }
  correctAnswer: 'A' | 'B' | 'C' | 'D' | string;
  marks: number;
  negativeMarks?: number;
  explanation?: string;
}

export interface IOnlineExam extends Document {
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
  section: string; // e.g. "CSE-A" or "All"
  facultyId: string;
  facultyName: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  negativeMarking: boolean;
  negativeMarksPerQuestion?: number;
  maxAttempts: number;
  resultPublication: 'MANUAL_RELEASE' | 'IMMEDIATE';
  resultsReleased: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  questions: IExamQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export const OnlineExamSchema = new Schema<IOnlineExam>({
  id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },
  departmentId: { type: String, required: true, index: true },
  departmentName: { type: String, required: true },
  subjectId: { type: String, required: true, index: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  semester: { type: Number, required: true, index: true },
  section: { type: String, required: true, index: true },
  facultyId: { type: String, required: true, index: true },
  facultyName: { type: String, required: true },
  examDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true, default: 30 },
  totalMarks: { type: Number, required: true, default: 50 },
  passMarks: { type: Number, required: true, default: 20 },
  negativeMarking: { type: Boolean, default: false },
  negativeMarksPerQuestion: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 1 },
  resultPublication: { type: String, enum: ['MANUAL_RELEASE', 'IMMEDIATE'], default: 'MANUAL_RELEASE' },
  resultsReleased: { type: Boolean, default: false },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'COMPLETED'], default: 'DRAFT', index: true },
  questions: [{
    id: { type: String, required: true },
    questionNumber: { type: Number },
    questionText: { type: String, required: true },
    options: { type: Schema.Types.Mixed, required: true },
    correctAnswer: { type: String, required: true },
    marks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    explanation: { type: String, default: '' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ================= EXAM ATTEMPT MODEL =================
export interface IExamAttempt extends Document {
  examId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  departmentId: string;
  semester: number;
  section: string;
  attemptNumber: number;
  startTime: Date;
  submitTime?: Date;
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
  questionEvaluations?: Array<{
    questionId: string;
    selectedOption?: string;
    correctOption?: string;
    isCorrect: boolean;
    marksAwarded: number;
    explanation?: string;
  }>;
}

export const ExamAttemptSchema = new Schema<IExamAttempt>({
  examId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  departmentId: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  attemptNumber: { type: Number, default: 1 },
  startTime: { type: Date, required: true, default: Date.now },
  submitTime: { type: Date },
  timeSpentSeconds: { type: Number, default: 0 },
  status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED'], default: 'IN_PROGRESS', index: true },
  answers: { type: Map, of: String, default: {} },
  markedForReview: [{ type: String }],
  score: { type: Number },
  totalMarks: { type: Number },
  percentage: { type: Number },
  passed: { type: Boolean },
  correctCount: { type: Number },
  incorrectCount: { type: Number },
  unansweredCount: { type: Number },
  questionEvaluations: [{
    questionId: { type: String, required: true },
    selectedOption: { type: String },
    correctOption: { type: String },
    isCorrect: { type: Boolean, required: true },
    marksAwarded: { type: Number, required: true },
    explanation: { type: String }
  }]
});

ExamAttemptSchema.index({ examId: 1, studentId: 1, attemptNumber: 1 });

// Export Mongoose Models
export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const DepartmentModel: Model<IDepartment> = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
export const SectionModel: Model<ISection> = mongoose.models.Section || mongoose.model<ISection>('Section', SectionSchema);
export const SubjectModel: Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export const TeachingAssignmentModel: Model<ITeachingAssignment> = mongoose.models.TeachingAssignment || mongoose.model<ITeachingAssignment>('TeachingAssignment', TeachingAssignmentSchema);
export const StudentProfileModel: Model<IStudentProfile> = mongoose.models.StudentProfile || mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
export const FacultyProfileModel: Model<IFacultyProfile> = mongoose.models.FacultyProfile || mongoose.model<IFacultyProfile>('FacultyProfile', FacultyProfileSchema);
export const CourseEnrollmentModel: Model<ICourseEnrollment> = mongoose.models.CourseEnrollment || mongoose.model<ICourseEnrollment>('CourseEnrollment', CourseEnrollmentSchema);
export const TimetableEntryModel: Model<ITimetableEntry> = mongoose.models.TimetableEntry || mongoose.model<ITimetableEntry>('TimetableEntry', TimetableEntrySchema);
export const AttendanceSessionModel: Model<IAttendanceSession> = mongoose.models.AttendanceSession || mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);
export const AssignmentModel: Model<IAssignment> = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export const SubmissionModel: Model<ISubmission> = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export const InternalAssessmentModel: Model<IInternalAssessment> = mongoose.models.InternalAssessment || mongoose.model<IInternalAssessment>('InternalAssessment', InternalAssessmentSchema);
export const AssessmentMarkEntryModel: Model<IAssessmentMarkEntry> = mongoose.models.AssessmentMarkEntry || mongoose.model<IAssessmentMarkEntry>('AssessmentMarkEntry', AssessmentMarkEntrySchema);
export const StudyMaterialModel: Model<IStudyMaterial> = mongoose.models.StudyMaterial || mongoose.model<IStudyMaterial>('StudyMaterial', StudyMaterialSchema);
export const ExamScheduleModel: Model<IExamSchedule> = mongoose.models.ExamSchedule || mongoose.model<IExamSchedule>('ExamSchedule', ExamScheduleSchema);
export const AnnouncementModel: Model<IAnnouncement> = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
export const AuditLogModel: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const OnlineExamModel: Model<IOnlineExam> = mongoose.models.OnlineExam || mongoose.model<IOnlineExam>('OnlineExam', OnlineExamSchema);
export const ExamAttemptModel: Model<IExamAttempt> = mongoose.models.ExamAttempt || mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
