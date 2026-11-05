import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  UserModel,
  DepartmentModel,
  SectionModel,
  SubjectModel,
  TeachingAssignmentModel,
  StudentProfileModel,
  FacultyProfileModel,
  CourseEnrollmentModel,
  TimetableEntryModel,
  AttendanceSessionModel,
  AssignmentModel,
  SubmissionModel,
  InternalAssessmentModel,
  AssessmentMarkEntryModel,
  StudyMaterialModel,
  ExamScheduleModel,
  AnnouncementModel,
  AuditLogModel,
  OnlineExamModel,
  ExamAttemptModel
} from '../models/index';
import { isDbConnected } from '../db/connection';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const DB_FILE = path.join(DATA_DIR, 'edutrack_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoredData {
  users: any[];
  departments: any[];
  sections: any[];
  subjects: any[];
  teachingAssignments: any[];
  students: any[];
  faculty: any[];
  enrollments: any[];
  classTimetable: any[];
  examSchedules: any[];
  attendanceSessions: any[];
  studyMaterials: any[];
  assignments: any[];
  submissions: any[];
  internalAssessments: any[];
  assessmentMarks: any[];
  results: any[];
  announcements: any[];
  auditLogs: any[];
  onlineExams: any[];
  examAttempts: any[];
}

function getDefaultSeedData(): StoredData {
  const adminPassHash = bcrypt.hashSync('admin123', 10);
  const facultyPassHash = bcrypt.hashSync('faculty123', 10);
  const studentPassHash = bcrypt.hashSync('student123', 10);

  const users = [
    {
      id: 'usr_admin_01',
      name: 'Dr. Aris Thorne',
      email: 'admin@edutrack.edu',
      passwordHash: adminPassHash,
      role: 'admin',
      phone: '+1 (555) 019-2831',
      status: 'active',
      createdAt: '2026-01-10'
    },
    {
      id: 'usr_fac_01',
      name: 'Prof. Marcus Vance',
      email: 'faculty@edutrack.edu',
      passwordHash: facultyPassHash,
      role: 'faculty',
      phone: '+1 (555) 482-9901',
      status: 'active',
      createdAt: '2026-01-12'
    },
    {
      id: 'usr_std_01',
      name: 'Elena Rostova',
      email: 'student@edutrack.edu',
      passwordHash: studentPassHash,
      role: 'student',
      phone: '+1 (555) 773-1029',
      status: 'active',
      createdAt: '2026-02-01'
    }
  ];

  const departments = [
    {
      id: 'dept_cse',
      code: 'CSE',
      name: 'Computer Science & Engineering',
      hodName: 'Dr. Katherine Wells',
      hodEmail: 'k.wells@edutrack.edu',
      description: 'Department of Computing, Artificial Intelligence & Distributed Systems',
      totalStudents: 1,
      totalFaculty: 1,
      totalSemesters: 8
    },
    {
      id: 'dept_ece',
      code: 'ECE',
      name: 'Electronics & Communication',
      hodName: 'Dr. Ramesh Nair',
      hodEmail: 'r.nair@edutrack.edu',
      description: 'VLSI, Embedded Architecture & Signal Processing Systems',
      totalStudents: 0,
      totalFaculty: 0,
      totalSemesters: 8,
      numberOfSections: 2
    }
  ];

  const sections = [
    {
      id: 'sec_cse_a',
      name: 'CSE-A',
      sectionCode: 'A',
      departmentId: 'dept_cse',
      departmentCode: 'CSE',
      capacity: 60,
      enrollmentCount: 1,
      status: 'active',
      createdAt: '2026-01-10'
    },
    {
      id: 'sec_cse_b',
      name: 'CSE-B',
      sectionCode: 'B',
      departmentId: 'dept_cse',
      departmentCode: 'CSE',
      capacity: 60,
      enrollmentCount: 0,
      status: 'active',
      createdAt: '2026-01-10'
    },
    {
      id: 'sec_cse_c',
      name: 'CSE-C',
      sectionCode: 'C',
      departmentId: 'dept_cse',
      departmentCode: 'CSE',
      capacity: 60,
      enrollmentCount: 0,
      status: 'active',
      createdAt: '2026-01-10'
    },
    {
      id: 'sec_ece_a',
      name: 'ECE-A',
      sectionCode: 'A',
      departmentId: 'dept_ece',
      departmentCode: 'ECE',
      capacity: 60,
      enrollmentCount: 0,
      status: 'active',
      createdAt: '2026-01-10'
    },
    {
      id: 'sec_ece_b',
      name: 'ECE-B',
      sectionCode: 'B',
      departmentId: 'dept_ece',
      departmentCode: 'ECE',
      capacity: 60,
      enrollmentCount: 0,
      status: 'active',
      createdAt: '2026-01-10'
    }
  ];

  const subjects = [
    {
      id: 'sub_cs401',
      code: 'CS401',
      name: 'Distributed Systems & Cloud Computing',
      departmentId: 'dept_cse',
      semester: 6,
      credits: 4,
      type: 'Theory',
      theoryDuration: 1,
      labDuration: 0,
      academicYear: '2026-2027',
      status: 'active',
      syllabus: ['Consensus Protocols (Raft/Paxos)', 'Vector Clocks & Causality', 'Distributed Storage Engines', 'Microservice Architectures'],
      assignedFacultyId: 'usr_fac_01',
      assignedFacultyName: 'Prof. Marcus Vance'
    },
    {
      id: 'sub_cs402',
      code: 'CS402',
      name: 'Database Internals & Storage Engines',
      departmentId: 'dept_cse',
      semester: 6,
      credits: 4,
      type: 'Theory',
      theoryDuration: 1,
      labDuration: 0,
      academicYear: '2026-2027',
      status: 'active',
      syllabus: ['B-Tree vs LSM-Trees', 'WAL & ARIES Recovery Algorithm', 'ACID & Multi-Version Concurrency Control', 'Query Optimizer Graphs'],
      assignedFacultyId: 'usr_fac_01',
      assignedFacultyName: 'Prof. Marcus Vance'
    },
    {
      id: 'sub_cs403',
      code: 'CS403',
      name: 'Computer Networks & Security',
      departmentId: 'dept_cse',
      semester: 6,
      credits: 3,
      type: 'Theory',
      theoryDuration: 1,
      labDuration: 0,
      academicYear: '2026-2027',
      status: 'active',
      syllabus: ['Transport Layer Congestion Protocols', 'BGP Routing Mesh', 'TLS 1.3 Handshake Dynamics', 'Zero-Trust Architectures'],
      assignedFacultyId: 'usr_fac_01',
      assignedFacultyName: 'Prof. Marcus Vance'
    },
    {
      id: 'sub_cs501',
      code: 'CS501',
      name: 'Database Management Systems (DBMS)',
      departmentId: 'dept_cse',
      semester: 5,
      credits: 4,
      type: 'Theory',
      theoryDuration: 1,
      labDuration: 0,
      academicYear: '2026-2027',
      status: 'active',
      syllabus: ['Relational Database Design', 'SQL & Relational Algebra', 'Normalization (1NF-BCNF)', 'Query Processing & Optimization', 'Transactions & Concurrency'],
      assignedFacultyId: 'usr_fac_01',
      assignedFacultyName: 'Prof. Marcus Vance'
    },
    {
      id: 'sub_cs404L',
      code: 'CS404L',
      name: 'Cloud Infrastructure & DevOps Lab',
      departmentId: 'dept_cse',
      semester: 6,
      credits: 2,
      type: 'Lab only',
      theoryDuration: 0,
      labDuration: 2,
      academicYear: '2026-2027',
      status: 'active',
      syllabus: ['Kubernetes Cluster Orchestration', 'Terraform State Management', 'Prometheus & Grafana Telemetry', 'eBPF Kernel Tracing'],
      assignedFacultyId: 'usr_fac_01',
      assignedFacultyName: 'Prof. Marcus Vance'
    }
  ];

  const teachingAssignments = [
    {
      id: 'ta_01',
      facultyId: 'fac_01',
      facultyUserId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance',
      departmentId: 'dept_cse',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems & Cloud Computing',
      semester: 6,
      section: 'CSE-A',
      academicYear: '2026-2027',
      status: 'active'
    },
    {
      id: 'ta_02',
      facultyId: 'fac_01',
      facultyUserId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance',
      departmentId: 'dept_cse',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems & Cloud Computing',
      semester: 6,
      section: 'CSE-B',
      academicYear: '2026-2027',
      status: 'active'
    }
  ];

  const students = [
    {
      id: 'std_01',
      userId: 'usr_std_01',
      rollNumber: '990000001',
      registrationNumber: '990000001',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      currentSemester: 6,
      section: 'CSE-A',
      admissionYear: 2023,
      academicYear: '2026-2027',
      batch: '2023-2027',
      cgpa: 8.84,
      currentSgpa: 8.92,
      attendancePercentage: 86.4,
      mentorFacultyId: 'usr_fac_01'
    }
  ];

  const faculty = [
    {
      id: 'fac_01',
      userId: 'usr_fac_01',
      employeeId: 'FAC001',
      designation: 'Associate Professor',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      qualification: 'Ph.D. in Distributed Systems',
      specialization: 'Consensus & Cloud Systems',
      officeRoom: 'Tech Block 3, Room 412',
      totalClassesAssigned: 4,
      assignedSections: ['CSE-A', 'CSE-B'],
      assignedSubjectIds: ['sub_cs401', 'sub_cs402', 'sub_cs403', 'sub_cs404L'],
      isHOD: false
    }
  ];

  const enrollments = [
    {
      id: 'enr_01',
      studentId: 'std_01',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems & Cloud Computing',
      instructorName: 'Prof. Marcus Vance',
      credits: 4,
      attendedClasses: 22,
      totalClasses: 25,
      attendancePercentage: 88.0,
      semester: 6,
      academicYear: '2026-2027'
    },
    {
      id: 'enr_02',
      studentId: 'std_01',
      subjectId: 'sub_cs402',
      subjectCode: 'CS402',
      subjectName: 'Database Internals & Storage Engines',
      instructorName: 'Prof. Marcus Vance',
      credits: 4,
      attendedClasses: 20,
      totalClasses: 24,
      attendancePercentage: 83.3,
      semester: 6,
      academicYear: '2026-2027'
    },
    {
      id: 'enr_03',
      studentId: 'std_01',
      subjectId: 'sub_cs403',
      subjectCode: 'CS403',
      subjectName: 'Computer Networks & Security',
      instructorName: 'Prof. Marcus Vance',
      credits: 3,
      attendedClasses: 19,
      totalClasses: 22,
      attendancePercentage: 86.4,
      semester: 6,
      academicYear: '2026-2027'
    },
    {
      id: 'enr_04',
      studentId: 'std_01',
      subjectId: 'sub_cs404L',
      subjectCode: 'CS404L',
      subjectName: 'Cloud Infrastructure & DevOps Lab',
      instructorName: 'Prof. Marcus Vance',
      credits: 2,
      attendedClasses: 12,
      totalClasses: 13,
      attendancePercentage: 92.3,
      semester: 6,
      academicYear: '2026-2027'
    }
  ];

  const classTimetable = [
    {
      id: 'tt_01',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems & Cloud Computing',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      room: 'Lecture Hall 102',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance'
    },
    {
      id: 'tt_02',
      dayOfWeek: 'Monday',
      startTime: '10:15',
      endTime: '11:15',
      subjectId: 'sub_cs402',
      subjectCode: 'CS402',
      subjectName: 'Database Internals & Storage Engines',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      room: 'Lecture Hall 102',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance'
    },
    {
      id: 'tt_03',
      dayOfWeek: 'Wednesday',
      startTime: '11:30',
      endTime: '12:30',
      subjectId: 'sub_cs403',
      subjectCode: 'CS403',
      subjectName: 'Computer Networks & Security',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      room: 'Seminar Room 204',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance'
    },
    {
      id: 'tt_04',
      dayOfWeek: 'Thursday',
      startTime: '14:00',
      endTime: '16:00',
      subjectId: 'sub_cs404L',
      subjectCode: 'CS404L',
      subjectName: 'Cloud Infrastructure & DevOps Lab',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      room: 'Computing Lab 4',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance'
    }
  ];

  const examSchedules = [
    {
      id: 'exam_01',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      semester: 6,
      section: 'A',
      academicYear: '2026-2027',
      examType: 'End-Semester Final',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems & Cloud Computing',
      examDate: '2026-11-15',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      room: 'Auditorium Hall B',
      instructions: 'Calculators permitted. Closed book. Arrive 15 minutes prior to commencement.',
      isPublished: true
    },
    {
      id: 'exam_02',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      semester: 6,
      section: 'A',
      academicYear: '2026-2027',
      examType: 'End-Semester Final',
      subjectId: 'sub_cs402',
      subjectCode: 'CS402',
      subjectName: 'Database Internals & Storage Engines',
      examDate: '2026-11-18',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      room: 'Auditorium Hall B',
      instructions: 'No digital wearables allowed.',
      isPublished: true
    }
  ];

  const attendanceSessions = [
    {
      id: 'att_sess_01',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      date: '2026-10-24',
      timeSlot: '09:00 - 10:00',
      facultyId: 'usr_fac_01',
      records: [
        {
          studentId: 'std_01',
          studentName: 'Elena Rostova',
          rollNumber: 'CS2023-042',
          status: 'present',
          remarks: 'On time, active participation'
        }
      ],
      createdAt: '2026-10-24T10:05:00.000Z'
    }
  ];

  const studyMaterials = [
    {
      id: 'mat_01',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems & Cloud Computing',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance',
      title: 'Module 3: Raft Consensus Protocol & Leader Election Analysis',
      description: 'Comprehensive slides detailing log replication invariants, randomized split-vote timers, and safety proofs.',
      type: 'pdf',
      fileSize: '4.8 MB',
      url: 'https://arxiv.org/abs/1405.0218',
      downloadCount: 38,
      uploadDate: '2026-10-18',
      semester: 6,
      section: 'A'
    },
    {
      id: 'mat_02',
      subjectId: 'sub_cs402',
      subjectCode: 'CS402',
      subjectName: 'Database Internals & Storage Engines',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance',
      title: 'ARIES Recovery & Write-Ahead Logging Specification Notes',
      description: 'Detailed analysis of steal/no-force buffer management, compensation log records (CLRs), and checkpointing.',
      type: 'notes',
      fileSize: '2.1 MB',
      url: '#',
      downloadCount: 45,
      uploadDate: '2026-10-20',
      semester: 6,
      section: 'A'
    }
  ];

  const assignments = [
    {
      id: 'asg_01',
      title: 'Assignment 4: Raft State Machine Replicated KV Store Implementation',
      subjectId: 'sub_cs401',
      subjectCode: 'CS401',
      subjectName: 'Distributed Systems & Cloud Computing',
      facultyId: 'usr_fac_01',
      facultyName: 'Prof. Marcus Vance',
      semester: 6,
      section: 'A',
      instructions: 'Implement election timer backoff, appendEntries RPC handler, and state machine commit index progression in Go or TypeScript.',
      attachmentName: 'raft_spec_handout_v2.pdf',
      attachmentSize: '1.2 MB',
      dueDate: '2026-11-04',
      maxMarks: 100,
      topicTag: 'Raft Consensus Protocols',
      createdAt: '2026-10-20'
    }
  ];

  const submissions = [
    {
      id: 'sub_sub_01',
      assignmentId: 'asg_01',
      studentId: 'std_01',
      studentName: 'Elena Rostova',
      rollNumber: 'CS2023-042',
      submittedAt: '2026-10-23 17:42',
      fileName: 'CS2023-042_RaftKV_Submission.zip',
      fileSize: '3.4 MB',
      notes: 'Included automated 200-node cluster unit tests and testbed harness.',
      status: 'graded',
      marksAwarded: 96,
      facultyFeedback: 'Exemplary log compaction and snapshotting logic. Thorough unit tests passed all fault injection edge cases.',
      gradedAt: '2026-10-25 14:10'
    }
  ];

  const internalAssessments: any[] = [];
  const assessmentMarks: any[] = [];

  const results = [
    {
      id: 'res_01',
      studentId: 'std_01',
      semester: 5,
      sgpa: 8.92,
      cgpa: 8.84,
      totalCredits: 22,
      termName: 'Spring 2026 (Semester 5)',
      grades: [
        {
          id: 'grd_01',
          studentId: 'std_01',
          subjectId: 'sub_cs501',
          subjectCode: 'CS501',
          subjectName: 'Operating System Kernels',
          semester: 5,
          credits: 4,
          internalMarks: 38,
          externalMarks: 54,
          totalMarks: 92,
          grade: 'O',
          gradePoint: 10,
          status: 'Pass'
        },
        {
          id: 'grd_02',
          studentId: 'std_01',
          subjectId: 'sub_cs502',
          subjectCode: 'CS502',
          subjectName: 'Formal Language & Automata',
          semester: 5,
          credits: 4,
          internalMarks: 36,
          externalMarks: 49,
          totalMarks: 85,
          grade: 'A+',
          gradePoint: 9,
          status: 'Pass'
        }
      ]
    }
  ];

  const announcements = [
    {
      id: 'ann_01',
      title: 'Fall 2026 End-Semester Examination Schedule Published',
      message: 'The institutional examination board has ratified and published the final datesheet. Students must verify timetable timings and reporting halls.',
      audience: 'STUDENTS',
      departmentId: 'dept_cse',
      semester: 6,
      section: 'A',
      publishedBy: 'Dr. Aris Thorne (Academic Dean)',
      publishedAt: '2026-10-22',
      priority: 'urgent'
    },
    {
      id: 'ann_02',
      title: 'Continuous Internal Assessment (CIA-2) Submission Window',
      message: 'Faculty members are reminded to finalize CIA-2 rubric evaluations and publish provisional marks before Friday 17:00 IST.',
      audience: 'FACULTY',
      publishedBy: 'Dr. Aris Thorne (Academic Dean)',
      publishedAt: '2026-10-25',
      priority: 'academic'
    }
  ];

  const auditLogs = [
    {
      id: 'audit_01',
      action: 'System Initialization',
      performedBy: 'System Bootstrap',
      role: 'admin',
      targetEntity: 'EduTrack Database',
      details: 'Initialized full-stack persistent relational repository.',
      timestamp: new Date().toISOString()
    }
  ];

  return {
    users,
    departments,
    sections,
    subjects,
    teachingAssignments,
    students,
    faculty,
    enrollments,
    classTimetable,
    examSchedules,
    attendanceSessions,
    studyMaterials,
    assignments,
    submissions,
    internalAssessments,
    assessmentMarks,
    results,
    announcements,
    auditLogs,
    onlineExams: [],
    examAttempts: []
  };
}

class StorageEngine {
  private data: StoredData;

  constructor() {
    this.data = this.load();
  }

  private load(): StoredData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: StoredData = JSON.parse(raw);

        // Ensure new collections exist
        if (!parsed.sections || parsed.sections.length === 0) {
          parsed.sections = [
            { id: 'sec_cse_a', name: 'CSE-A', sectionCode: 'A', departmentId: 'dept_cse', departmentCode: 'CSE', capacity: 60, enrollmentCount: 1, status: 'active', createdAt: '2026-01-10' },
            { id: 'sec_cse_b', name: 'CSE-B', sectionCode: 'B', departmentId: 'dept_cse', departmentCode: 'CSE', capacity: 60, enrollmentCount: 0, status: 'active', createdAt: '2026-01-10' },
            { id: 'sec_cse_c', name: 'CSE-C', sectionCode: 'C', departmentId: 'dept_cse', departmentCode: 'CSE', capacity: 60, enrollmentCount: 0, status: 'active', createdAt: '2026-01-10' },
            { id: 'sec_ece_a', name: 'ECE-A', sectionCode: 'A', departmentId: 'dept_ece', departmentCode: 'ECE', capacity: 60, enrollmentCount: 0, status: 'active', createdAt: '2026-01-10' },
            { id: 'sec_ece_b', name: 'ECE-B', sectionCode: 'B', departmentId: 'dept_ece', departmentCode: 'ECE', capacity: 60, enrollmentCount: 0, status: 'active', createdAt: '2026-01-10' }
          ];
        }
        if (!parsed.teachingAssignments) {
          parsed.teachingAssignments = [
            { id: 'ta_01', facultyId: 'fac_01', facultyUserId: 'usr_fac_01', facultyName: 'Prof. Marcus Vance', departmentId: 'dept_cse', subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems & Cloud Computing', semester: 6, section: 'CSE-A', academicYear: '2026-2027', status: 'active' },
            { id: 'ta_02', facultyId: 'fac_01', facultyUserId: 'usr_fac_01', facultyName: 'Prof. Marcus Vance', departmentId: 'dept_cse', subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems & Cloud Computing', semester: 6, section: 'CSE-B', academicYear: '2026-2027', status: 'active' }
          ];
        }

        // Migrate any non-99 student roll numbers
        let nextSeq = 990000001;
        for (const s of (parsed.students || [])) {
          if (!s.rollNumber || !s.rollNumber.startsWith('99')) {
            s.rollNumber = String(nextSeq++);
            s.registrationNumber = s.rollNumber;
          } else {
            const num = parseInt(s.rollNumber, 10);
            if (!isNaN(num) && num >= nextSeq) nextSeq = num + 1;
          }
          if (!s.section || s.section === 'A') {
            s.section = 'CSE-A';
          }
          if (!s.batch) s.batch = '2023-2027';
          if (!s.academicYear) s.academicYear = '2026-2027';
        }

        // Auto-provision StudentProfile and course enrollments for all student accounts
        if (!parsed.students) parsed.students = [];
        if (!parsed.enrollments) parsed.enrollments = [];
        if (!parsed.onlineExams) parsed.onlineExams = [];
        if (!parsed.examAttempts) parsed.examAttempts = [];

        for (const u of (parsed.users || [])) {
          if (u.role === 'student') {
            let stdProfile = parsed.students.find(s => s.userId === u.id);
            if (!stdProfile) {
              const rollStr = String(nextSeq++);
              stdProfile = {
                id: `std_${u.id.replace('usr_', '')}`,
                userId: u.id,
                rollNumber: rollStr,
                registrationNumber: rollStr,
                departmentId: 'dept_cse',
                departmentName: 'Computer Science & Engineering',
                currentSemester: 6,
                section: 'CSE-A',
                admissionYear: 2023,
                academicYear: '2026-2027',
                batch: '2023-2027',
                cgpa: 8.5,
                currentSgpa: 8.5,
                attendancePercentage: 85.0,
                mentorFacultyId: 'usr_fac_01',
                academicStatus: 'Good Standing'
              };
              parsed.students.push(stdProfile);
            }

            // Ensure enrollments exist for this student
            const deptSubs = (parsed.subjects || []).filter(s => s.departmentId === stdProfile!.departmentId && s.semester === (stdProfile!.currentSemester || 6));
            deptSubs.forEach(sub => {
              const existingEnr = parsed.enrollments.find(e => e.studentId === stdProfile!.id && (e.subjectId === sub.id || e.subjectCode === sub.code));
              if (!existingEnr) {
                parsed.enrollments.push({
                  id: `enr_${stdProfile!.id}_${sub.id}`,
                  studentId: stdProfile!.id,
                  subjectId: sub.id,
                  subjectCode: sub.code,
                  subjectName: sub.name,
                  instructorName: sub.assignedFacultyName || 'Prof. Marcus Vance',
                  credits: sub.credits || 3,
                  attendedClasses: 12,
                  totalClasses: 14,
                  attendancePercentage: 85.7,
                  semester: sub.semester,
                  academicYear: '2026-2027',
                  gradePoints: 8.5,
                  status: 'Enrolled'
                });
              }
            });
          }
        }

        for (const f of (parsed.faculty || [])) {
          if (!f.assignedSections || f.assignedSections.length === 0) {
            f.assignedSections = ['CSE-A', 'CSE-B'];
          }
          if (!f.assignedSubjectIds) {
            f.assignedSubjectIds = ['sub_cs401', 'sub_cs402', 'sub_cs403', 'sub_cs404L'];
          }
        }

        this.saveDirect(parsed);
        return parsed;
      }
    } catch (err) {
      console.error('[StorageEngine] Error reading DB file, reinitializing default:', err);
    }
    const defaults = getDefaultSeedData();
    this.saveDirect(defaults);
    return defaults;
  }

  private saveDirect(d: StoredData): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2), 'utf-8');
    } catch (err) {
      console.error('[StorageEngine] Failed to write DB file:', err);
    }
  }

  public save(): void {
    this.recalculateSectionCounts();
    this.saveDirect(this.data);
    if (isDbConnected()) {
      this.syncToMongoDB().catch((err) => {
        console.warn('[StorageEngine] Background MongoDB write note:', err?.message || err);
      });
    }
  }

  public async syncToMongoDB(): Promise<boolean> {
    if (!isDbConnected()) return false;
    try {
      // 1. Users
      if (this.data.users?.length) {
        for (const u of this.data.users) {
          await UserModel.findOneAndUpdate(
            { email: u.email.toLowerCase() },
            {
              name: u.name,
              email: u.email.toLowerCase(),
              passwordHash: u.passwordHash,
              role: u.role,
              phone: u.phone,
              avatar: u.avatar,
              status: u.status || 'active',
              createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 2. Departments
      if (this.data.departments?.length) {
        for (const d of this.data.departments) {
          await DepartmentModel.findOneAndUpdate(
            { code: d.code.toUpperCase() },
            {
              code: d.code.toUpperCase(),
              name: d.name,
              hodName: d.hodName || '',
              hodEmail: d.hodEmail || '',
              description: d.description || '',
              totalStudents: d.totalStudents || 0,
              totalFaculty: d.totalFaculty || 0,
              totalSemesters: d.totalSemesters || 8,
              numberOfSections: d.numberOfSections || 3
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 3. Sections
      if (this.data.sections?.length) {
        for (const s of this.data.sections) {
          await SectionModel.findOneAndUpdate(
            { departmentId: s.departmentId, name: s.name },
            {
              name: s.name,
              sectionCode: s.sectionCode || s.name.replace(/.*-/, '') || 'A',
              departmentId: s.departmentId,
              departmentCode: s.departmentCode || '',
              capacity: Number(s.capacity) || 60,
              enrollmentCount: Number(s.enrollmentCount) || 0,
              status: s.status || 'active',
              createdAt: s.createdAt ? new Date(s.createdAt) : new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 4. Subjects
      if (this.data.subjects?.length) {
        for (const s of this.data.subjects) {
          await SubjectModel.findOneAndUpdate(
            { code: s.code.toUpperCase() },
            {
              code: s.code.toUpperCase(),
              name: s.name,
              departmentId: s.departmentId,
              semester: Number(s.semester) || 1,
              academicYear: s.academicYear || '2026-2027',
              credits: Number(s.credits) || 3,
              type: s.type || 'Theory',
              theoryDuration: Number(s.theoryDuration) || 1,
              labDuration: Number(s.labDuration) || 0,
              syllabus: Array.isArray(s.syllabus) ? s.syllabus : [],
              assignedFacultyId: s.assignedFacultyId,
              assignedFacultyName: s.assignedFacultyName,
              status: s.status || 'active'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 5. Teaching Assignments
      if (this.data.teachingAssignments?.length) {
        for (const ta of this.data.teachingAssignments) {
          await TeachingAssignmentModel.findOneAndUpdate(
            { facultyId: ta.facultyId, subjectId: ta.subjectId, section: ta.section },
            {
              facultyId: ta.facultyId,
              facultyUserId: ta.facultyUserId || ta.facultyId,
              facultyName: ta.facultyName,
              departmentId: ta.departmentId,
              subjectId: ta.subjectId,
              subjectCode: ta.subjectCode,
              subjectName: ta.subjectName,
              semester: Number(ta.semester) || 1,
              section: ta.section,
              academicYear: ta.academicYear || '2026-2027'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 6. Student Profiles
      if (this.data.students?.length) {
        for (const st of this.data.students) {
          await StudentProfileModel.findOneAndUpdate(
            { rollNumber: st.rollNumber },
            {
              userId: st.userId,
              rollNumber: st.rollNumber,
              registrationNumber: st.registrationNumber || st.rollNumber,
              departmentId: st.departmentId,
              currentSemester: Number(st.currentSemester) || 1,
              section: st.section || 'A',
              batch: st.batch || '2023-2027',
              admissionYear: Number(st.admissionYear) || 2023,
              bloodGroup: st.bloodGroup,
              dateOfBirth: st.dateOfBirth,
              guardianName: st.guardianName,
              guardianPhone: st.guardianPhone,
              address: st.address,
              cgpa: Number(st.cgpa) || 0,
              currentSgpa: Number(st.currentSgpa) || 0,
              totalCreditsEarned: Number(st.totalCreditsEarned) || 0,
              attendancePercentage: Number(st.attendancePercentage) || 0,
              academicStatus: st.academicStatus || 'Good Standing'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 7. Faculty Profiles
      if (this.data.faculty?.length) {
        for (const f of this.data.faculty) {
          await FacultyProfileModel.findOneAndUpdate(
            { employeeId: f.employeeId },
            {
              userId: f.userId,
              employeeId: f.employeeId,
              departmentId: f.departmentId,
              designation: f.designation,
              highestQualification: f.highestQualification,
              specialization: f.specialization,
              assignedSections: f.assignedSections || ['CSE-A'],
              assignedSubjectIds: f.assignedSubjectIds || [],
              officeRoom: f.officeRoom,
              joiningDate: f.joiningDate,
              status: f.status || 'active'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 8. Enrollments
      if (this.data.enrollments?.length) {
        for (const enr of this.data.enrollments) {
          await CourseEnrollmentModel.findOneAndUpdate(
            { studentId: enr.studentId, subjectId: enr.subjectId },
            {
              studentId: enr.studentId,
              subjectId: enr.subjectId,
              subjectCode: enr.subjectCode,
              subjectName: enr.subjectName,
              semester: Number(enr.semester) || 1,
              credits: Number(enr.credits) || 3,
              grade: enr.grade,
              gradePoints: Number(enr.gradePoints) || 0,
              attendancePercentage: Number(enr.attendancePercentage) || 0,
              status: enr.status || 'Enrolled',
              totalClasses: Number(enr.totalClasses) || 0,
              attendedClasses: Number(enr.attendedClasses) || 0
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 9. Timetable
      if (this.data.classTimetable?.length) {
        for (const t of this.data.classTimetable) {
          await TimetableEntryModel.findOneAndUpdate(
            { departmentId: t.departmentId, semester: t.semester, section: t.section, dayOfWeek: t.dayOfWeek, period: t.period },
            t,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 10. Attendance Sessions
      if (this.data.attendanceSessions?.length) {
        for (const att of this.data.attendanceSessions) {
          await AttendanceSessionModel.findOneAndUpdate(
            { date: att.date, subjectId: att.subjectId, section: att.section, period: att.period },
            att,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 11. Assignments
      if (this.data.assignments?.length) {
        for (const asg of this.data.assignments) {
          await AssignmentModel.findOneAndUpdate(
            { title: asg.title, subjectId: asg.subjectId, dueDate: asg.dueDate },
            asg,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 12. Submissions
      if (this.data.submissions?.length) {
        for (const sub of this.data.submissions) {
          await SubmissionModel.findOneAndUpdate(
            { assignmentId: sub.assignmentId, studentId: sub.studentId },
            sub,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 13. Internal Assessments
      if (this.data.internalAssessments?.length) {
        for (const cia of this.data.internalAssessments) {
          const ciaDoc = { ...cia };
          delete (ciaDoc as any)._id;
          await InternalAssessmentModel.findOneAndUpdate(
            { id: cia.id },
            ciaDoc,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 14. Assessment Marks
      if (this.data.assessmentMarks?.length) {
        for (const m of this.data.assessmentMarks) {
          await AssessmentMarkEntryModel.findOneAndUpdate(
            { assessmentId: m.assessmentId, studentId: m.studentId },
            m,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 15. Study Materials
      if (this.data.studyMaterials?.length) {
        for (const mat of this.data.studyMaterials) {
          await StudyMaterialModel.findOneAndUpdate(
            { subjectId: mat.subjectId, title: mat.title },
            mat,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 16. Exam Schedules
      if (this.data.examSchedules?.length) {
        for (const ex of this.data.examSchedules) {
          await ExamScheduleModel.findOneAndUpdate(
            { departmentId: ex.departmentId, subjectId: ex.subjectId, examDate: ex.examDate, examType: ex.examType },
            ex,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 17. Announcements
      if (this.data.announcements?.length) {
        for (const ann of this.data.announcements) {
          await AnnouncementModel.findOneAndUpdate(
            { title: ann.title, publishedAt: ann.publishedAt },
            ann,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 18. Audit Logs
      if (this.data.auditLogs?.length) {
        for (const log of this.data.auditLogs.slice(0, 30)) {
          await AuditLogModel.findOneAndUpdate(
            { action: log.action, timestamp: log.timestamp, performedBy: log.performedBy },
            log,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 19. Online Exams
      if (this.data.onlineExams?.length) {
        for (const ox of this.data.onlineExams) {
          const examDoc = { ...ox, updatedAt: new Date() };
          delete (examDoc as any)._id;
          await OnlineExamModel.findOneAndUpdate(
            { id: ox.id },
            examDoc,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      // 20. Exam Attempts
      if (this.data.examAttempts?.length) {
        for (const att of this.data.examAttempts) {
          const attDoc = { ...att };
          delete (attDoc as any)._id;
          await ExamAttemptModel.findOneAndUpdate(
            { examId: att.examId, studentId: att.studentId, attemptNumber: att.attemptNumber || 1 },
            attDoc,
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).catch(() => {});
        }
      }

      return true;
    } catch (err: any) {
      console.warn('[StorageEngine] MongoDB background sync notice:', err?.message || err);
      return false;
    }
  }

  public getData(): StoredData {
    return this.data;
  }

  public resetToDefault(): void {
    this.data = getDefaultSeedData();
    this.save();
  }

  public logAudit(action: string, performedBy: string, role: 'student' | 'faculty' | 'admin', targetEntity: string, details: string) {
    this.data.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      performedBy,
      role,
      targetEntity,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  // --- Sequential Register Number Generator Starting with 99 ---
  public getNextRegisterNumber(): string {
    let maxVal = 990000000;
    if (this.data.students && Array.isArray(this.data.students)) {
      for (const s of this.data.students) {
        if (s.rollNumber && typeof s.rollNumber === 'string') {
          const trimmed = s.rollNumber.trim();
          if (/^99\d{7}$/.test(trimmed)) {
            const val = parseInt(trimmed, 10);
            if (!isNaN(val) && val > maxVal) {
              maxVal = val;
            }
          }
        }
      }
    }
    return String(maxVal + 1);
  }

  // --- Section Capacity & Validation Engine ---
  public checkSectionCapacity(departmentId: string, sectionName: string): { allowed: boolean; current: number; capacity: number; sectionName: string; error?: string } {
    const normSec = (sectionName || '').trim();
    const sec = (this.data.sections || []).find((s: any) => 
      s.departmentId === departmentId && (s.name.toUpperCase() === normSec.toUpperCase() || s.sectionCode.toUpperCase() === normSec.toUpperCase())
    );
    
    const enrolledStudents = (this.data.students || []).filter((st: any) => 
      st.departmentId === departmentId && (
        st.section.toUpperCase() === normSec.toUpperCase() ||
        (sec && (st.section.toUpperCase() === sec.name.toUpperCase() || st.section.toUpperCase() === sec.sectionCode.toUpperCase()))
      )
    );

    const enrolledCount = enrolledStudents.length;
    const capacity = sec ? (Number(sec.capacity) || 60) : 60;

    if (enrolledCount >= capacity) {
      return {
        allowed: false,
        current: enrolledCount,
        capacity,
        sectionName: normSec,
        error: `Section ${normSec} has reached maximum capacity of ${capacity} students (${enrolledCount}/${capacity} enrolled).`
      };
    }

    return {
      allowed: true,
      current: enrolledCount,
      capacity,
      sectionName: normSec
    };
  }

  public recalculateSectionCounts(): void {
    if (!this.data.sections) return;
    for (const sec of this.data.sections) {
      const count = (this.data.students || []).filter((st: any) => 
        st.departmentId === sec.departmentId && (
          st.section.toUpperCase() === sec.name.toUpperCase() ||
          st.section.toUpperCase() === sec.sectionCode.toUpperCase()
        )
      ).length;
      sec.enrollmentCount = count;
    }
  }

  // Attendance Recalculation Engine
  public recalculateAttendance(studentId: string): void {
    const sessions = this.data.attendanceSessions;
    let totalAll = 0;
    let attendedAll = 0;

    this.data.enrollments.forEach(enr => {
      if (enr.studentId === studentId) {
        const subSessions = sessions.filter(s => s.subjectId === enr.subjectId || s.subjectCode === enr.subjectCode);
        let attended = 0;
        let total = 0;

        subSessions.forEach(sess => {
          const rec = sess.records.find((r: any) => r.studentId === studentId);
          if (rec) {
            total++;
            if (rec.status === 'present' || rec.status === 'late') {
              attended++;
            }
          }
        });

        if (total > 0) {
          enr.totalClasses = total;
          enr.attendedClasses = attended;
          enr.attendancePercentage = Math.round((attended / total) * 1000) / 10;
        }

        totalAll += enr.totalClasses;
        attendedAll += enr.attendedClasses;
      }
    });

    const studentProfile = this.data.students.find(s => s.id === studentId);
    if (studentProfile) {
      studentProfile.attendancePercentage = totalAll > 0
        ? Math.round((attendedAll / totalAll) * 1000) / 10
        : 0;
    }
    this.saveDirect(this.data);
  }

  public getNextRollNumber(): string {
    const list = this.data.students || [];
    let max = 990000000;
    list.forEach(s => {
      if (s.rollNumber && s.rollNumber.startsWith('99')) {
        const num = parseInt(s.rollNumber, 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
    return String(max + 1);
  }
}

export const dbStore = new StorageEngine();
