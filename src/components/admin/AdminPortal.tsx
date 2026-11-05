import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CalendarClock,
  Megaphone,
  TrendingUp,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Upload,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Send,
  History,
  FileSpreadsheet,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  User,
  StudentProfile,
  FacultyProfile,
  Department,
  Section,
  Subject,
  TeachingAssignment,
  ExamSchedule,
  Announcement,
  AuditLog,
  TimetableEntry
} from '../../types';
import { EduTrackApi, isMatchingSection } from '../../services/apiService';
import { Card3D } from '../common/Card3D';

interface AdminPortalProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  searchQuery: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  currentPage,
  onNavigate,
  searchQuery
}) => {
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    return EduTrackApi.subscribe(() => {
      setRefreshKey(k => k + 1);
    });
  }, []);

  const departments = EduTrackApi.getDepartments();
  const allSections = EduTrackApi.getSections();
  const allUsers = EduTrackApi.getUsers();
  const allStudents = EduTrackApi.getAllStudents();
  const allFaculty = EduTrackApi.getAllFaculty();
  const allSubjects = EduTrackApi.getSubjects();
  const allClassTimetables = EduTrackApi.getClassTimetables();
  const allExams = EduTrackApi.getExamSchedules(undefined, undefined, false);
  const announcements = EduTrackApi.getAnnouncements();
  const auditLogs = EduTrackApi.getAuditLogs();

  // Manage Users state
  const [userTab, setUserTab] = useState<'students' | 'faculty'>('students');
  const [userSearch, setUserSearch] = useState('');
  const [userDeptFilter, setUserDeptFilter] = useState('all');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [transferStudentModal, setTransferStudentModal] = useState<StudentProfile | null>(null);

  // New Student Form state
  const [newStdName, setNewStdName] = useState('');
  const [newStdEmail, setNewStdEmail] = useState('');
  const [newStdRoll, setNewStdRoll] = useState('');
  const [newStdDept, setNewStdDept] = useState(departments[0]?.id || '');
  const [newStdSem, setNewStdSem] = useState(1);
  const [newStdSection, setNewStdSection] = useState('CSE-A');

  // New Faculty Form state
  const [newFacName, setNewFacName] = useState('');
  const [newFacEmail, setNewFacEmail] = useState('');
  const [newFacEmpId, setNewFacEmpId] = useState('');
  const [newFacDept, setNewFacDept] = useState(departments[0]?.id || '');
  const [newFacDesignation, setNewFacDesignation] = useState('Assistant Professor');
  const [newFacRoom, setNewFacRoom] = useState('Academic Block Room 101');
  const [newFacSections, setNewFacSections] = useState<string[]>([]);
  const [newFacSubjectId, setNewFacSubjectId] = useState<string>('');
  const [newFacIsHOD, setNewFacIsHOD] = useState<boolean>(false);

  // Transfer Student state
  const [transferNewDept, setTransferNewDept] = useState('');
  const [transferNewSection, setTransferNewSection] = useState('CSE-A');
  const [transferNewSem, setTransferNewSem] = useState(1);

  // Departments & Subjects state
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
  const activeDept = departments.find(d => d.id === selectedDeptId) || departments[0];
  const deptSubjects = selectedDeptId ? EduTrackApi.getSubjects(selectedDeptId) : [];
  const deptSections = selectedDeptId ? allSections.filter(s => s.departmentId === selectedDeptId) : [];

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHOD, setNewDeptHOD] = useState('');
  const [newDeptEmail, setNewDeptEmail] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [newDeptSectionsCount, setNewDeptSectionsCount] = useState<number>(3);

  // Sections management state
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSecName, setNewSecName] = useState('');
  const [newSecCap, setNewSecCap] = useState(60);
  const [editSectionModal, setEditSectionModal] = useState<Section | null>(null);
  const [editSecCap, setEditSecCap] = useState(60);

  // Faculty allocation state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocFacultyId, setAllocFacultyId] = useState(allFaculty[0]?.id || '');
  const [allocSubjectId, setAllocSubjectId] = useState(allSubjects[0]?.id || '');
  const [allocSection, setAllocSection] = useState('CSE-A');

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCredits, setNewSubCredits] = useState(4);
  const [newSubSem, setNewSubSem] = useState(1);
  const [newSubType, setNewSubType] = useState<'Theory' | 'Theory + Lab' | 'Lab only' | 'Practical' | 'Elective'>('Theory');
  const [newSubFacultyId, setNewSubFacultyId] = useState('');

  // Class Timetable state
  const [classDeptFilter, setClassDeptFilter] = useState(departments[0]?.id || 'all');
  const [classSemFilter, setClassSemFilter] = useState<number>(1);
  const [classSecFilter, setClassSecFilter] = useState<string>('CSE-A');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [ttDay, setTtDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [ttStartTime, setTtStartTime] = useState('09:00 AM');
  const [ttEndTime, setTtEndTime] = useState('10:00 AM');
  const [ttSubjectCode, setTtSubjectCode] = useState('');
  const [ttFacultyId, setTtFacultyId] = useState('');
  const [ttRoom, setTtRoom] = useState('Hall 101');
  const [ttConflictError, setTtConflictError] = useState<string | null>(null);

  // Semester Exam Timetable state
  const [examDeptFilter, setExamDeptFilter] = useState(departments[0]?.id || 'all');
  const [examSemFilter, setExamSemFilter] = useState(1);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [examSubjectCode, setExamSubjectCode] = useState('');
  const [examSubjectName, setExamSubjectName] = useState('');
  const [examDate, setExamDate] = useState('2026-11-20');
  const [examStartTime, setExamStartTime] = useState('10:00 AM');
  const [examEndTime, setExamEndTime] = useState('01:00 PM');
  const [examRoom, setExamRoom] = useState('Examination Hall 101');
  const [examInstructions, setExamInstructions] = useState('University ID card required. Closed book.');
  const [examClashError, setExamClashError] = useState<string | null>(null);

  // Announcements state
  const [annAudienceTab, setAnnAudienceTab] = useState<'STUDENTS' | 'FACULTY'>('STUDENTS');
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'urgent' | 'academic'>('normal');
  const [annDeptFilter, setAnnDeptFilter] = useState('');

  // Handlers
  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode.trim() || !newDeptName.trim()) return;

    const created = EduTrackApi.createDepartment({
      code: newDeptCode.toUpperCase().trim(),
      name: newDeptName.trim(),
      hodName: newDeptHOD.trim() || 'To be nominated',
      hodEmail: newDeptEmail.trim() || 'hod@edutrack.edu',
      description: newDeptDesc.trim() || 'Academic degree department',
      numberOfSections: Number(newDeptSectionsCount) || 3
    });

    setSelectedDeptId(created.id);
    setShowAddDeptModal(false);
    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptHOD('');
    setNewDeptEmail('');
    setNewDeptDesc('');
    setNewDeptSectionsCount(3);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName.trim() || !selectedDeptId) return;

    try {
      await EduTrackApi.createSection({
        name: newSecName.toUpperCase().trim(),
        departmentId: selectedDeptId,
        capacity: Number(newSecCap) || 60
      });
      setShowAddSectionModal(false);
      setNewSecName('');
      setNewSecCap(60);
    } catch (err: any) {
      console.error(err.message || 'Failed to create section.');
    }
  };

  const handleUpdateSectionCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSectionModal) return;

    try {
      await EduTrackApi.updateSection(editSectionModal.id, {
        capacity: Number(editSecCap)
      });
      setEditSectionModal(null);
    } catch (err: any) {
      console.error(err.message || 'Failed to update section capacity.');
    }
  };

  const handleAllocateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocFacultyId || !allocSubjectId || !allocSection) {
      return;
    }

    try {
      await EduTrackApi.allocateFaculty(allocFacultyId, allocSubjectId, allocSection);
      setShowAllocateModal(false);
    } catch (err: any) {
      console.error(err.message || 'Failed to allocate faculty.');
    }
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim() || !selectedDeptId) return;

    const facultyUser = allUsers.find(u => u.id === newSubFacultyId);

    EduTrackApi.createSubject({
      code: newSubCode.toUpperCase().trim(),
      name: newSubName.trim(),
      departmentId: selectedDeptId,
      semester: newSubSem,
      credits: newSubCredits,
      type: newSubType,
      theoryDuration: newSubType === 'Lab only' ? 0 : 1,
      labDuration: newSubType === 'Theory' ? 0 : 2,
      syllabus: [
        'Fundamental concepts and problem formulations',
        'Theoretical models and algorithmic paradigms',
        'Laboratory implementations and case benchmarks'
      ],
      assignedFacultyId: newSubFacultyId || undefined,
      assignedFacultyName: facultyUser ? facultyUser.name : undefined
    });

    setShowAddSubjectModal(false);
    setNewSubCode('');
    setNewSubName('');
  };

  const handleOpenAddStudent = async () => {
    try {
      const nextRoll = await EduTrackApi.getNextRegisterNumber();
      setNewStdRoll(nextRoll);
    } catch {
      setNewStdRoll('990000001');
    }
    const deptSecs = allSections.filter(s => s.departmentId === newStdDept);
    if (deptSecs.length > 0) {
      setNewStdSection(deptSecs[0].name);
    }
    setShowAddStudentModal(true);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStdName || !newStdEmail || !newStdRoll || !newStdDept) {
      alert('Please fill all required student fields, including selecting a department.');
      return;
    }

    const cleanRoll = newStdRoll.toUpperCase().trim();
    if (!cleanRoll.startsWith('99')) {
      alert('Student Register Number / Roll Number MUST start with "99" (e.g. 990000001).');
      return;
    }

    // Check section capacity
    const targetSection = allSections.find(s => s.departmentId === newStdDept && s.name === newStdSection);
    if (targetSection && targetSection.enrollmentCount >= targetSection.capacity) {
      alert(`Cannot enroll student: Section ${targetSection.name} is already at full capacity (${targetSection.enrollmentCount}/${targetSection.capacity}).`);
      return;
    }

    const dept = departments.find(d => d.id === newStdDept);
    EduTrackApi.createStudent({
      name: newStdName.trim(),
      email: newStdEmail.trim().toLowerCase(),
      rollNumber: cleanRoll,
      departmentId: newStdDept,
      departmentName: dept ? dept.name : 'Engineering',
      currentSemester: newStdSem,
      section: newStdSection
    });

    setRefreshKey(k => k + 1);

    setShowAddStudentModal(false);
    setNewStdName('');
    setNewStdEmail('');
    setNewStdRoll('');
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName || !newFacEmail || !newFacEmpId || !newFacDept) {
      alert('Please fill all required faculty fields.');
      return;
    }

    const dept = departments.find(d => d.id === newFacDept);
    const { profile: facProfile } = EduTrackApi.createFaculty({
      name: newFacName.trim(),
      email: newFacEmail.trim().toLowerCase(),
      employeeId: newFacEmpId.toUpperCase().trim(),
      designation: newFacDesignation,
      departmentId: newFacDept,
      departmentName: dept ? dept.name : 'Engineering',
      officeRoom: newFacRoom,
      assignedSections: newFacSections,
      subjectId: newFacSubjectId,
      isHOD: newFacIsHOD
    });

    if (newFacIsHOD && facProfile) {
      await EduTrackApi.designateHOD(facProfile.id, true);
    }

    if (newFacSections.length > 0 && newFacSubjectId && facProfile) {
      for (const sec of newFacSections) {
        await EduTrackApi.allocateFaculty(facProfile.id, newFacSubjectId, sec);
      }
    }

    setRefreshKey(k => k + 1);

    setShowAddFacultyModal(false);
    setNewFacName('');
    setNewFacEmail('');
    setNewFacEmpId('');
    setNewFacSections([]);
    setNewFacSubjectId('');
    setNewFacIsHOD(false);
  };

  const handleTransferStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentModal) return;

    const newDeptObj = departments.find(d => d.id === transferNewDept);
    EduTrackApi.updateStudentProfile(transferStudentModal.id, {
      departmentId: transferNewDept || transferStudentModal.departmentId,
      departmentName: newDeptObj ? newDeptObj.name : transferStudentModal.departmentName,
      section: transferNewSection,
      currentSemester: transferNewSem
    });

    EduTrackApi.logAudit(
      'Student Transfer Executed',
      currentUser.name,
      'admin',
      `Student ${transferStudentModal.rollNumber}`,
      `Transferred to ${newDeptObj?.name || transferStudentModal.departmentName}, Sem ${transferNewSem}, Sec ${transferNewSection}`
    );

    setTransferStudentModal(null);
  };

  const handleCreateClassTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    setTtConflictError(null);

    const sub = allSubjects.find(s => s.code === ttSubjectCode);
    const faculty = allFaculty.find(f => f.userId === ttFacultyId);
    const facultyUser = allUsers.find(u => u.id === ttFacultyId);

    const res = EduTrackApi.createClassTimetableEntry({
      dayOfWeek: ttDay,
      startTime: ttStartTime,
      endTime: ttEndTime,
      subjectId: sub ? sub.id : `sub_${Date.now()}`,
      subjectCode: ttSubjectCode,
      subjectName: sub ? sub.name : ttSubjectCode,
      departmentId: classDeptFilter === 'all' ? (departments[0]?.id || '') : classDeptFilter,
      semester: classSemFilter,
      section: classSecFilter,
      room: ttRoom,
      facultyId: ttFacultyId,
      facultyName: facultyUser ? facultyUser.name : 'Assigned Faculty'
    }, currentUser.name);

    if (!res.success) {
      setTtConflictError(res.error || 'Scheduling conflict detected!');
      return;
    }

    setShowAddClassModal(false);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    setExamClashError(null);

    const dept = departments.find(d => d.id === examDeptFilter);
    const res = EduTrackApi.createExamSchedule({
      departmentId: examDeptFilter === 'all' ? (departments[0]?.id || '') : examDeptFilter,
      departmentName: dept ? dept.name : 'Department',
      semester: examSemFilter,
      section: 'A',
      academicYear: '2026-2027',
      examType: 'Mid-Term Exam',
      subjectId: `sub_${examSubjectCode.toLowerCase()}`,
      subjectCode: examSubjectCode,
      subjectName: examSubjectName,
      examDate,
      startTime: examStartTime,
      endTime: examEndTime,
      room: examRoom,
      instructions: examInstructions,
      isPublished: true
    }, currentUser.name);

    if (!res.success) {
      setExamClashError(res.error || 'Clash detected!');
      return;
    }

    setShowCreateExamModal(false);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    EduTrackApi.createAnnouncement({
      title: annTitle.trim(),
      message: annMessage.trim(),
      audience: annAudienceTab,
      priority: annPriority,
      departmentId: annDeptFilter || undefined,
      publishedBy: currentUser.name
    }, currentUser.name);

    setAnnTitle('');
    setAnnMessage('');
  };

  // 1. DASHBOARD
  if (currentPage === 'dashboard') {
    const isDbEmpty = departments.length === 0 && allStudents.length === 0 && allFaculty.length === 0;

    return (
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 lg:p-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <span className="text-indigo-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1">
                Institutional Academic Governance
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words">
                Admin Central Operations
              </h1>
              <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-xl">
                Administrator: <span className="font-semibold text-white">{currentUser.name}</span> · Real persistent database counts
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <button
                onClick={() => onNavigate('departments-subjects')}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm min-h-[44px] sm:min-h-0 flex items-center justify-center"
              >
                Configure Departments
              </button>
              <button
                onClick={() => onNavigate('manage-users')}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm border border-white/10 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
              >
                Provision Accounts
              </button>
            </div>
          </div>
        </div>

        {/* Real Counts 3D Metric Cards (Zero when empty!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Registered Students</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {allStudents.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {allStudents.length === 0 ? 'No students enrolled yet' : 'Total active student records'}
            </p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Faculty Members</span>
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {allFaculty.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {allFaculty.length === 0 ? 'No faculty registered yet' : 'Active instructional staff'}
            </p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Academic Departments</span>
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {departments.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {allSubjects.length} subjects in catalog
            </p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Scheduled Classes & Exams</span>
              <CalendarClock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {allClassTimetables.length + allExams.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {allClassTimetables.length} class slots · {allExams.length} exam slots
            </p>
          </Card3D>
        </div>

        {/* Empty Database Setup Guidance Banner */}
        {isDbEmpty && (
          <div className="p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Clean Academic Database Ready for Setup</span>
            </div>
            <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed max-w-3xl">
              All academic tables are initialized empty. As System Administrator, follow these natural steps to build your university structure:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => onNavigate('departments-subjects')}
                className="p-3 text-left rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900 hover:border-indigo-500 transition-colors"
              >
                <span className="font-bold text-xs text-indigo-600 block">1. Create Department</span>
                <span className="text-[11px] text-slate-500">e.g. Computer Science (CSE)</span>
              </button>
              <button
                onClick={() => onNavigate('departments-subjects')}
                className="p-3 text-left rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900 hover:border-indigo-500 transition-colors"
              >
                <span className="font-bold text-xs text-indigo-600 block">2. Add Subjects</span>
                <span className="text-[11px] text-slate-500">Curriculum course codes & credits</span>
              </button>
              <button
                onClick={() => onNavigate('manage-users')}
                className="p-3 text-left rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900 hover:border-indigo-500 transition-colors"
              >
                <span className="font-bold text-xs text-indigo-600 block">3. Provision Users</span>
                <span className="text-[11px] text-slate-500">Register faculty & students</span>
              </button>
              <button
                onClick={() => onNavigate('class-timetable')}
                className="p-3 text-left rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900 hover:border-indigo-500 transition-colors"
              >
                <span className="font-bold text-xs text-indigo-600 block">4. Schedule Timetable</span>
                <span className="text-[11px] text-slate-500">Conflict-validated class slots</span>
              </button>
            </div>
          </div>
        )}

        {/* Audit Log */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Academic Activity Ledger</h3>
              <p className="text-xs text-slate-500">Real-time persistent audit logs of administrative actions</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{auditLogs.length} events logged</span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 6).map(log => (
              <div key={log.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">{log.action}</span>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{log.details}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Actor: <strong>{log.performedBy}</strong> ({log.role})</span>
                  <span className="font-mono">{log.targetEntity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // 2. MANAGE STUDENTS & FACULTY (ONE PAGE WITH 2 TABS)
  if (currentPage === 'manage-users') {
    const filteredStudents = allStudents.filter(std => {
      const user = allUsers.find(u => u.id === std.userId);
      if (userDeptFilter !== 'all' && std.departmentId !== userDeptFilter) return false;
      if (userSearch) {
        const query = userSearch.toLowerCase();
        return (user?.name.toLowerCase().includes(query) || std.rollNumber.toLowerCase().includes(query) || user?.email.toLowerCase().includes(query));
      }
      return true;
    });

    const filteredFaculty = allFaculty.filter(fac => {
      const user = allUsers.find(u => u.id === fac.userId);
      if (userDeptFilter !== 'all' && fac.departmentId !== userDeptFilter) return false;
      if (userSearch) {
        const query = userSearch.toLowerCase();
        return (user?.name.toLowerCase().includes(query) || fac.employeeId.toLowerCase().includes(query) || user?.email.toLowerCase().includes(query));
      }
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Manage Students & Faculty
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add, edit, deactivate users, assign cohorts, transfer students between sections, and manage faculty subject assignments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Bulk Import CSV
            </button>
            {userTab === 'students' ? (
              <button
                onClick={() => {
                  if (departments.length === 0) {
                    alert('Please create at least one department first under "Departments & Subjects".');
                    return;
                  }
                  handleOpenAddStudent();
                }}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </button>
            ) : (
              <button
                onClick={() => {
                  if (departments.length === 0) {
                    alert('Please create at least one department first under "Departments & Subjects".');
                    return;
                  }
                  setShowAddFacultyModal(true);
                }}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Add Faculty
              </button>
            )}
          </div>
        </div>

        {/* 2 Tabs */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 sm:mx-0 sm:px-0 gap-1">
          <button
            onClick={() => setUserTab('students')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              userTab === 'students'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Students Roster ({allStudents.length})
          </button>
          <button
            onClick={() => setUserTab('faculty')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              userTab === 'faculty'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Faculty Members ({allFaculty.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none min-h-[40px] sm:min-h-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 shrink-0">Department:</span>
            <select
              value={userDeptFilter}
              onChange={(e) => setUserDeptFilter(e.target.value)}
              className="flex-1 sm:flex-initial py-2 sm:py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium min-h-[40px] sm:min-h-0"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab 1: Students Roster */}
        {userTab === 'students' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {filteredStudents.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-xs text-slate-400 space-y-3">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No student accounts registered yet</p>
                <p className="max-w-md mx-auto text-slate-400">
                  Click "Add Student" above to enroll students into departments, semesters, and sections.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards (md:hidden) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                  {filteredStudents.map(std => {
                    const user = allUsers.find(u => u.id === std.userId);
                    return (
                      <div key={std.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{std.rollNumber}</span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{user?.name || 'Student'}</h4>
                            <p className="text-[11px] text-slate-400">{user?.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${user?.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`}>
                            {user?.status || 'active'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>Dept: <strong className="text-slate-700 dark:text-slate-300">{std.departmentName}</strong></div>
                          <div>Cohort: <strong className="text-slate-700 dark:text-slate-300">Sem {std.currentSemester} ({std.section})</strong></div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500">Attendance:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{std.attendancePercentage}%</span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => {
                              setTransferStudentModal(std);
                              setTransferNewDept(std.departmentId);
                              setTransferNewSection(std.section);
                              setTransferNewSem(std.currentSemester);
                            }}
                            className="flex-1 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors min-h-[40px] flex items-center justify-center"
                          >
                            Transfer Cohort
                          </button>
                          <button
                            onClick={() => {
                              const newStatus = user?.status === 'active' ? 'inactive' : 'active';
                              if (user) {
                                EduTrackApi.updateUser(user.id, { status: newStatus });
                              }
                            }}
                            className="flex-1 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-colors min-h-[40px] flex items-center justify-center"
                          >
                            Toggle Status
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Full Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Roll Number</th>
                        <th className="py-3 px-4 font-semibold">Student Name</th>
                        <th className="py-3 px-4 font-semibold">Department</th>
                        <th className="py-3 px-4 font-semibold">Semester / Sec</th>
                        <th className="py-3 px-4 font-semibold">Attendance</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.map(std => {
                        const user = allUsers.find(u => u.id === std.userId);
                        return (
                          <tr key={std.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{std.rollNumber}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {user?.name || 'Student'}
                              <span className="block text-[11px] font-normal text-slate-400">{user?.email}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{std.departmentName}</td>
                            <td className="py-3 px-4 text-slate-500">Sem {std.currentSemester} (Sec {std.section})</td>
                            <td className="py-3 px-4 font-mono font-semibold">
                              {std.attendancePercentage}%
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${user?.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`}>
                                {user?.status || 'active'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <button
                                onClick={() => {
                                  setTransferStudentModal(std);
                                  setTransferNewDept(std.departmentId);
                                  setTransferNewSection(std.section);
                                  setTransferNewSem(std.currentSemester);
                                }}
                                className="px-2 py-1 text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-100"
                                title="Transfer section or department"
                              >
                                Transfer
                              </button>
                              <button
                                onClick={() => {
                                  const newStatus = user?.status === 'active' ? 'inactive' : 'active';
                                  if (user) {
                                    EduTrackApi.updateUser(user.id, { status: newStatus });
                                  }
                                }}
                                className="px-2 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded"
                              >
                                Toggle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Faculty Members */}
        {userTab === 'faculty' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {filteredFaculty.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-xs text-slate-400 space-y-3">
                <GraduationCap className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No faculty members registered yet</p>
                <p className="max-w-md mx-auto text-slate-400">
                  Click "Add Faculty" above to provision teacher accounts and assign teaching departments.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards (md:hidden) */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
                  {filteredFaculty.map(fac => {
                    const user = allUsers.find(u => u.id === fac.userId || (u.email && (fac as any).email && u.email.toLowerCase() === (fac as any).email.toLowerCase()));
                    return (
                      <div key={fac.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">{fac.employeeId}</span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{user?.name || (fac as any).name || 'Faculty Member'}</h4>
                            <p className="text-[11px] text-slate-400">{user?.email || (fac as any).email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${user?.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`}>
                            {user?.status || 'active'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div>Dept: <strong className="text-slate-700 dark:text-slate-300">{fac.departmentName}</strong></div>
                          <div>Designation: <strong className="text-slate-700 dark:text-slate-300">{fac.designation}</strong></div>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Office: <span className="font-medium text-slate-700 dark:text-slate-300">{fac.officeRoom}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => {
                              const newStatus = user?.status === 'active' ? 'inactive' : 'active';
                              if (user) {
                                EduTrackApi.updateUser(user.id, { status: newStatus });
                              }
                            }}
                            className="w-full py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-colors min-h-[40px] flex items-center justify-center"
                          >
                            Toggle Active Status
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Full Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Emp ID</th>
                        <th className="py-3 px-4 font-semibold">Faculty Name</th>
                        <th className="py-3 px-4 font-semibold">Department</th>
                        <th className="py-3 px-4 font-semibold">Designation</th>
                        <th className="py-3 px-4 font-semibold">Office Room</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredFaculty.map(fac => {
                        const user = allUsers.find(u => u.id === fac.userId || (u.email && (fac as any).email && u.email.toLowerCase() === (fac as any).email.toLowerCase()));
                        return (
                          <tr key={fac.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{fac.employeeId}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {user?.name || (fac as any).name || 'Faculty Member'}
                              <span className="block text-[11px] font-normal text-slate-400">{user?.email || (fac as any).email}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{fac.departmentName}</td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{fac.designation}</td>
                            <td className="py-3 px-4 text-slate-500">{fac.officeRoom}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  const newStatus = user?.status === 'active' ? 'inactive' : 'active';
                                  if (user) {
                                    EduTrackApi.updateUser(user.id, { status: newStatus });
                                  }
                                }}
                                className="px-2 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded"
                              >
                                Toggle Status
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal: Add Student */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Student</h3>
                  <p className="text-[11px] text-slate-500">Auto-assigns 99-series registration number and semester subjects</p>
                </div>
                <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={handleCreateStudent} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Student Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Hayes"
                    value={newStdName}
                    onChange={(e) => setNewStdName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan.hayes@edutrack.edu"
                    value={newStdEmail}
                    onChange={(e) => setNewStdEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Register No. (Series 99)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="990000001"
                      value={newStdRoll}
                      onChange={(e) => setNewStdRoll(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono font-bold text-indigo-600 dark:text-indigo-400"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-incremented 99-series</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select
                      value={newStdDept}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        setNewStdDept(deptId);
                        const secs = allSections.filter(s => s.departmentId === deptId);
                        if (secs.length > 0) {
                          setNewStdSection(secs[0].name);
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Semester</label>
                    <select
                      value={newStdSem}
                      onChange={(e) => setNewStdSem(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <optgroup label="Year 1">
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                      </optgroup>
                      <optgroup label="Year 2">
                        <option value={3}>Semester 3</option>
                        <option value={4}>Semester 4</option>
                      </optgroup>
                      <optgroup label="Year 3">
                        <option value={5}>Semester 5</option>
                        <option value={6}>Semester 6</option>
                      </optgroup>
                      <optgroup label="Year 4">
                        <option value={7}>Semester 7</option>
                        <option value={8}>Semester 8</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section & Capacity</label>
                    {allSections.filter(s => s.departmentId === newStdDept).length === 0 ? (
                      <input
                        type="text"
                        value={newStdSection}
                        onChange={(e) => setNewStdSection(e.target.value)}
                        placeholder="e.g. CSE-A"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                      />
                    ) : (
                      <select
                        value={newStdSection}
                        onChange={(e) => setNewStdSection(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                      >
                        {allSections
                          .filter(s => s.departmentId === newStdDept)
                          .map(s => {
                            const enrollment = allStudents.filter(st =>
                              st.departmentId === s.departmentId &&
                              isMatchingSection(st.section, s.name, s.sectionCode)
                            ).length;
                            const effectiveEnrollment = Math.max(s.enrollmentCount || 0, enrollment);
                            const isFull = effectiveEnrollment >= s.capacity;
                            return (
                              <option key={s.id} value={s.name} disabled={isFull}>
                                {s.name} ({effectiveEnrollment}/{s.capacity}){isFull ? ' [FULL]' : ''}
                              </option>
                            );
                          })}
                      </select>
                    )}
                  </div>
                </div>

                {/* Section full warning indicator */}
                {(() => {
                  const sec = allSections.find(s => s.departmentId === newStdDept && s.name === newStdSection);
                  if (sec && sec.enrollmentCount >= sec.capacity) {
                    return (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Section {sec.name} has reached maximum capacity ({sec.capacity}/{sec.capacity}). Please choose another section.</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddStudentModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Save & Enroll</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Faculty */}
        {showAddFacultyModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Faculty</h3>
                <button onClick={() => setShowAddFacultyModal(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={handleCreateFaculty} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name & Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Robert Vance"
                    value={newFacName}
                    onChange={(e) => setNewFacName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    placeholder="r.vance@edutrack.edu"
                    value={newFacEmail}
                    onChange={(e) => setNewFacEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty ID (FAC...)</label>
                    <input
                      type="text"
                      required
                      placeholder="FAC-001"
                      value={newFacEmpId}
                      onChange={(e) => setNewFacEmpId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select
                      value={newFacDept}
                      onChange={(e) => {
                        setNewFacDept(e.target.value);
                        setNewFacSections([]);
                        setNewFacSubjectId('');
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                    <select
                      value={newFacDesignation}
                      onChange={(e) => setNewFacDesignation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Head of Department">Head of Department</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Room</label>
                    <input
                      type="text"
                      value={newFacRoom}
                      onChange={(e) => setNewFacRoom(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Subject Allocation in this Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Department Subject (Optional)
                  </label>
                  <select
                    value={newFacSubjectId}
                    onChange={(e) => setNewFacSubjectId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="">-- Unassigned / To be allocated --</option>
                    {allSubjects
                      .filter(s => s.departmentId === newFacDept)
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name} (Sem {s.semester})</option>
                      ))}
                  </select>
                </div>

                {/* Multi-Section Teaching Allocation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Assign Teaching Sections (Multi-Section Teaching)
                  </label>
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {allSections.filter(s => s.departmentId === newFacDept).length === 0 ? (
                      <span className="text-xs text-slate-400">No sections in this department yet.</span>
                    ) : (
                      allSections
                        .filter(s => s.departmentId === newFacDept)
                        .map(sec => {
                          const isChecked = newFacSections.includes(sec.name);
                          return (
                            <label
                              key={sec.id}
                              className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-all ${
                                isChecked
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewFacSections(prev => [...prev, sec.name]);
                                  } else {
                                    setNewFacSections(prev => prev.filter(x => x !== sec.name));
                                  }
                                }}
                              />
                              <span>{sec.name}</span>
                            </label>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* HOD Designation */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newFacIsHOD}
                      onChange={(e) => setNewFacIsHOD(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Designate as Head of Department (HOD) for this department</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddFacultyModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Save Faculty</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Transfer Student */}
        {transferStudentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Transfer Student Cohort</h3>
                <button onClick={() => setTransferStudentModal(null)} className="text-slate-400">✕</button>
              </div>
              <p className="text-xs text-slate-500">
                Transfer student Roll No <strong>{transferStudentModal.rollNumber}</strong> to a different department or section with academic history preservation.
              </p>
              <form onSubmit={handleTransferStudent} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Department</label>
                  <select
                    value={transferNewDept}
                    onChange={(e) => setTransferNewDept(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Semester</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={transferNewSem}
                      onChange={(e) => setTransferNewSem(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Section</label>
                    <input
                      type="text"
                      value={transferNewSection}
                      onChange={(e) => setTransferNewSection(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setTransferStudentModal(null)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Execute Transfer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Bulk Import */}
        {showBulkImportModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Batch CSV Roster Import</h3>
                <button onClick={() => setShowBulkImportModal(false)} className="text-slate-400">✕</button>
              </div>
              <p className="text-xs text-slate-500">
                Import CSV files formatted with columns: <code>FullName, Email, RollNumber, DeptCode, Semester, Section</code>.
              </p>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-semibold text-indigo-600 hover:underline">Select CSV File</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowBulkImportModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                <button
                  onClick={() => {
                    setShowBulkImportModal(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                >
                  Confirm Import
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 3. DEPARTMENTS & SUBJECTS (ONE PAGE)
  if (currentPage === 'departments-subjects') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Departments & Subjects
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create academic departments, manage course catalogs, credit weighting, and assign teaching faculty.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Department
            </button>
            <button
              onClick={() => {
                if (!selectedDeptId) {
                  alert('Please create and select a department first.');
                  return;
                }
                setShowAddSubjectModal(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>
        </div>

        {/* Department Selector Tabs */}
        {departments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <Building2 className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Academic Departments Configured</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your university needs at least one department (e.g., Computer Science, Electrical Engineering) to structure subjects and students.
            </p>
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create First Department
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    selectedDeptId === dept.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {dept.name} ({dept.code})
                </button>
              ))}
            </div>

            {/* Department Details Card */}
            {activeDept && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">Code: {activeDept.code}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{activeDept.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{activeDept.description}</p>
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Head of Dept</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{activeDept.hodName}</p>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Enrolled Students</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                        {allStudents.filter(s => s.departmentId === activeDept.id).length}
                      </p>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Faculty Staff</span>
                      <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                        {allFaculty.filter(f => f.departmentId === activeDept.id).length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sections & Enrollment Capacity */}
                <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Department Sections & Class Strength ({deptSections.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Class capacity enforced strictly on student enrollment to prevent over-allocation.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setNewSecName(`${activeDept.code}-${String.fromCharCode(65 + deptSections.length)}`);
                        setNewSecCap(60);
                        setShowAddSectionModal(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Section
                    </button>
                  </div>

                  {deptSections.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                      No sections configured for this department yet. Click "Add Section" to create cohorts.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {deptSections.map(sec => {
                        const enrollment = allStudents.filter(st =>
                          st.departmentId === sec.departmentId &&
                          isMatchingSection(st.section, sec.name, sec.sectionCode)
                        ).length;
                        const effectiveEnrollment = Math.max(sec.enrollmentCount || 0, enrollment);
                        const pct = Math.round((effectiveEnrollment / (sec.capacity || 1)) * 100);
                        const isFull = effectiveEnrollment >= sec.capacity;

                        return (
                          <div
                            key={sec.id}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                {sec.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  isFull
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {isFull ? 'FULL' : 'ACTIVE'}
                              </span>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                                <span>Strength: <strong className="text-slate-800 dark:text-slate-200">{effectiveEnrollment}</strong> / {sec.capacity}</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isFull ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end pt-1">
                              <button
                                onClick={() => {
                                  setEditSectionModal(sec);
                                  setEditSecCap(sec.capacity);
                                }}
                                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Edit Capacity
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Subjects Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Department Subjects & Assigned Faculty ({deptSubjects.length})
                    </h4>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setAllocSection(deptSections[0]?.name || `${activeDept.code}-A`);
                          setShowAllocateModal(true);
                        }}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Allocate Faculty
                      </button>
                      <button
                        onClick={() => setShowAddSubjectModal(true)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Subject
                      </button>
                    </div>
                  </div>

                  {deptSubjects.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-slate-100 dark:border-slate-800 rounded-lg">
                      No subjects configured under {activeDept.name}. Click "Add Subject" to create curriculum courses.
                    </div>
                  ) : (
                    <>
                      {/* Mobile View: Stacked Cards (md:hidden) */}
                      <div className="md:hidden space-y-3">
                        {deptSubjects.map(sub => (
                          <div key={sub.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {sub.code}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                {sub.type} · {sub.credits} Credits
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              {sub.name}
                            </h5>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span>Semester {sub.semester}</span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {sub.assignedFacultyName || <span className="text-slate-400 italic">Unassigned</span>}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View: Full Table (hidden md:block) */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[11px] border-y border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Code</th>
                              <th className="py-2.5 px-4 font-semibold">Subject Title</th>
                              <th className="py-2.5 px-4 font-semibold">Semester</th>
                              <th className="py-2.5 px-4 font-semibold">Type</th>
                              <th className="py-2.5 px-4 font-semibold">Credits</th>
                              <th className="py-2.5 px-4 font-semibold">Assigned Faculty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {deptSubjects.map(sub => (
                              <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{sub.code}</td>
                                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{sub.name}</td>
                                <td className="py-3 px-4 text-slate-500">Sem {sub.semester}</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                    {sub.type}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{sub.credits}</td>
                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                  {sub.assignedFacultyName || (
                                    <span className="text-slate-400 italic">Unassigned</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Department */}
        {showAddDeptModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Academic Department</h3>
                <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={handleCreateDepartment} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dept Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Computer Science & Eng"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Head of Department (HOD)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Arthur Pendelton"
                    value={newDeptHOD}
                    onChange={(e) => setNewDeptHOD(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">HOD Email</label>
                  <input
                    type="email"
                    placeholder="hod.cse@edutrack.edu"
                    value={newDeptEmail}
                    onChange={(e) => setNewDeptEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Program scope and academic degree curriculum..."
                    value={newDeptDesc}
                    onChange={(e) => setNewDeptDesc(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Sections to Auto-Create (Capacity 60 each)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newDeptSectionsCount}
                      onChange={(e) => setNewDeptSectionsCount(Number(e.target.value))}
                      className="w-20 text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold"
                    />
                    <span className="text-xs text-slate-500">
                      Auto-creates {newDeptSectionsCount} sections ({newDeptCode || 'CODE'}-A, {newDeptCode || 'CODE'}-B...) with capacity 60
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddDeptModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Save Department</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Section */}
        {showAddSectionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Department Section</h3>
                <button onClick={() => setShowAddSectionModal(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={handleCreateSection} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section Identifier</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE-D"
                    value={newSecName}
                    onChange={(e) => setNewSecName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Student Capacity</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    required
                    value={newSecCap}
                    onChange={(e) => setNewSecCap(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Default standard capacity is 60 students per section</span>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddSectionModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Create Section</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Section Capacity */}
        {editSectionModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Capacity: {editSectionModal.name}</h3>
                <button onClick={() => setEditSectionModal(null)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={handleUpdateSectionCapacity} className="space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Current Enrolled:</span>
                    <strong className="font-bold text-slate-900 dark:text-white">{editSectionModal.enrollmentCount} students</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Current Capacity:</span>
                    <strong>{editSectionModal.capacity}</strong>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Capacity Limit</label>
                  <input
                    type="number"
                    min={editSectionModal.enrollmentCount}
                    max={200}
                    required
                    value={editSecCap}
                    onChange={(e) => setEditSecCap(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Cannot be lower than currently enrolled students ({editSectionModal.enrollmentCount})</span>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setEditSectionModal(null)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Save Capacity</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Allocate Faculty to Section */}
        {showAllocateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Allocate Faculty to Course Section</h3>
                <button onClick={() => setShowAllocateModal(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={handleAllocateFaculty} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty Member</label>
                  <select
                    value={allocFacultyId}
                    onChange={(e) => setAllocFacultyId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="">-- Choose Faculty --</option>
                    {allFaculty
                      .filter(f => !selectedDeptId || f.departmentId === selectedDeptId)
                      .map(f => {
                        const u = allUsers.find(user => user.id === f.userId);
                        return (
                          <option key={f.id} value={f.id}>{u?.name || f.employeeId} ({f.departmentName})</option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Course</label>
                  <select
                    value={allocSubjectId}
                    onChange={(e) => setAllocSubjectId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="">-- Choose Subject --</option>
                    {deptSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name} (Sem {s.semester})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Section</label>
                  <select
                    value={allocSection}
                    onChange={(e) => setAllocSection(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    {deptSections.map(s => {
                      const enrollment = allStudents.filter(st =>
                        st.departmentId === s.departmentId &&
                        isMatchingSection(st.section, s.name, s.sectionCode)
                      ).length;
                      const effectiveEnrollment = Math.max(s.enrollmentCount || 0, enrollment);
                      return (
                        <option key={s.id} value={s.name}>{s.name} ({effectiveEnrollment}/{s.capacity} enrolled)</option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAllocateModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg shadow-sm">Confirm Allocation</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Subject */}
        {showAddSubjectModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Subject to {activeDept?.name}</h3>
                <button onClick={() => setShowAddSubjectModal(false)} className="text-slate-400">✕</button>
              </div>
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS101"
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Credits</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newSubCredits}
                      onChange={(e) => setNewSubCredits(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">B.Tech Semester (1-8)</label>
                    <select
                      value={newSubSem}
                      onChange={(e) => setNewSubSem(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <optgroup label="Year 1">
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                      </optgroup>
                      <optgroup label="Year 2">
                        <option value={3}>Semester 3</option>
                        <option value={4}>Semester 4</option>
                      </optgroup>
                      <optgroup label="Year 3">
                        <option value={5}>Semester 5</option>
                        <option value={6}>Semester 6</option>
                      </optgroup>
                      <optgroup label="Year 4">
                        <option value={7}>Semester 7</option>
                        <option value={8}>Semester 8</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Type</label>
                    <select
                      value={newSubType}
                      onChange={(e) => setNewSubType(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="Theory">Theory (1 hr)</option>
                      <option value="Theory + Lab">Theory + Lab (1 hr + 2 hr)</option>
                      <option value="Lab only">Lab only (2 continuous hrs)</option>
                      <option value="Practical">Practical</option>
                      <option value="Elective">Elective</option>
                    </select>
                  </div>
                </div>

                {/* Duration info */}
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                  <span>Slot Duration:</span>
                  <span className="font-semibold">
                    {newSubType === 'Lab only' ? '2 continuous hrs lab block' : newSubType === 'Theory + Lab' ? '1 hr theory + 2 hrs continuous lab' : '1 hr theory slot'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign Teaching Faculty</label>
                  <select
                    value={newSubFacultyId}
                    onChange={(e) => setNewSubFacultyId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  >
                    <option value="">-- Leave Unassigned for now --</option>
                    {allFaculty
                      .filter(f => f.departmentId === selectedDeptId)
                      .map(f => {
                        const u = allUsers.find(user => user.id === f.userId);
                        return (
                          <option key={f.userId} value={f.userId}>{u?.name || f.employeeId} ({f.designation})</option>
                        );
                      })}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddSubjectModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Save Subject</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 4. CLASS TIMETABLE (DEDICATED PAGE WITH CONFLICT VALIDATION)
  if (currentPage === 'class-timetable') {
    const filteredTimetables = EduTrackApi.getClassTimetables(
      classDeptFilter === 'all' ? undefined : classDeptFilter,
      classSemFilter,
      classSecFilter
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Weekly Class Timetable
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure and publish weekly instructional periods. Conflict engine automatically validates room, faculty, and cohort clashes.
            </p>
          </div>
          <button
            onClick={() => {
              if (allSubjects.length === 0 || allFaculty.length === 0) {
                alert('Please ensure you have configured subjects and registered faculty before creating timetables.');
                return;
              }
              setTtConflictError(null);
              setShowAddClassModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Schedule Class Period
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Department:</span>
              <select
                value={classDeptFilter}
                onChange={(e) => setClassDeptFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Semester:</span>
              <input
                type="number"
                min={1}
                max={8}
                value={classSemFilter}
                onChange={(e) => setClassSemFilter(Number(e.target.value))}
                className="py-1.5 px-3 text-xs w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Section:</span>
              <input
                type="text"
                value={classSecFilter}
                onChange={(e) => setClassSecFilter(e.target.value)}
                className="py-1.5 px-3 text-xs w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Timetable Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Scheduled Periods ({filteredTimetables.length})
          </h3>

          {filteredTimetables.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No class periods scheduled for this cohort</p>
              <p>Click "Schedule Class Period" to add weekly lecture or lab sessions.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Stacked Cards (md:hidden) */}
              <div className="md:hidden space-y-3">
                {filteredTimetables.map(slot => (
                  <div key={slot.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-[11px]">
                        {slot.dayOfWeek}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] tabular-nums">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1.5">{slot.subjectCode}</span>
                        {slot.subjectName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>Instructor: {slot.facultyName}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Room {slot.room}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                      <button
                        onClick={() => {
                          if (confirm(`Remove class period for ${slot.subjectCode}?`)) {
                            EduTrackApi.deleteClassTimetableEntry(slot.id, currentUser.name);
                          }
                        }}
                        className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded flex items-center gap-1 transition-colors min-h-[36px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Period</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Full Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[11px] border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Day</th>
                      <th className="py-2.5 px-4 font-semibold">Timeslot</th>
                      <th className="py-2.5 px-4 font-semibold">Subject</th>
                      <th className="py-2.5 px-4 font-semibold">Instructor</th>
                      <th className="py-2.5 px-4 font-semibold">Venue / Room</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTimetables.map(slot => (
                      <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{slot.dayOfWeek}</td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 tabular-nums">{slot.startTime} - {slot.endTime}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{slot.subjectCode}</span>
                          <span className="block text-[11px] text-slate-500">{slot.subjectName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{slot.facultyName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{slot.room}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Remove class period for ${slot.subjectCode}?`)) {
                                EduTrackApi.deleteClassTimetableEntry(slot.id, currentUser.name);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Modal: Schedule Class Period with Conflict Detection */}
        {showAddClassModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Class Period</h3>
                <button onClick={() => setShowAddClassModal(false)} className="text-slate-400">✕</button>
              </div>

              {ttConflictError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{ttConflictError}</span>
                </div>
              )}

              {/* College Hours & Lunch Policy Notice */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>College Hours: 09:00 AM – 05:00 PM (09:00 – 17:00)</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  <strong>Mandatory Lunch Break:</strong> 12:00 PM – 01:00 PM (12:00 – 13:00). All academic classes and laboratory sessions are strictly forbidden during lunch.
                </p>
              </div>

              <form onSubmit={handleCreateClassTimetable} className="space-y-3">
                {/* Period Slot Quick Preset Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Standard Period Preset Slot
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const [start, end] = val.split('-');
                      if (start && end) {
                        setTtStartTime(start.trim());
                        setTtEndTime(end.trim());
                      }
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-medium"
                  >
                    <option value="">-- Choose Standard Slot Preset --</option>
                    <optgroup label="1-Hour Theory Slots (9 AM - 5 PM)">
                      <option value="09:00-10:00">Period 1: 09:00 AM - 10:00 AM</option>
                      <option value="10:00-11:00">Period 2: 10:00 AM - 11:00 AM</option>
                      <option value="11:00-12:00">Period 3: 11:00 AM - 12:00 PM</option>
                      <option disabled value="">12:00 PM - 01:00 PM [LUNCH BREAK - NO CLASSES]</option>
                      <option value="13:00-14:00">Period 4: 01:00 PM - 02:00 PM</option>
                      <option value="14:00-15:00">Period 5: 02:00 PM - 03:00 PM</option>
                      <option value="15:00-16:00">Period 6: 03:00 PM - 04:00 PM</option>
                      <option value="16:00-17:00">Period 7: 04:00 PM - 05:00 PM</option>
                    </optgroup>
                    <optgroup label="2-Hour Continuous Lab Slots">
                      <option value="09:00-11:00">Morning Lab A: 09:00 AM - 11:00 AM (2 hrs)</option>
                      <option value="10:00-12:00">Morning Lab B: 10:00 AM - 12:00 PM (2 hrs)</option>
                      <option value="13:00-15:00">Afternoon Lab A: 01:00 PM - 03:00 PM (2 hrs)</option>
                      <option value="14:00-16:00">Afternoon Lab B: 02:00 PM - 04:00 PM (2 hrs)</option>
                      <option value="15:00-17:00">Afternoon Lab C: 03:00 PM - 05:00 PM (2 hrs)</option>
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Day of Week</label>
                    <select
                      value={ttDay}
                      onChange={(e) => setTtDay(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time (24h/12h)</label>
                    <input
                      type="text"
                      required
                      placeholder="09:00"
                      value={ttStartTime}
                      onChange={(e) => setTtStartTime(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time (24h/12h)</label>
                    <input
                      type="text"
                      required
                      placeholder="10:00"
                      value={ttEndTime}
                      onChange={(e) => setTtEndTime(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Section</label>
                    <select
                      value={classSecFilter}
                      onChange={(e) => setClassSecFilter(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    >
                      {allSections
                        .filter(s => classDeptFilter === 'all' || s.departmentId === classDeptFilter)
                        .map(sec => (
                          <option key={sec.id} value={sec.name}>{sec.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                    <select
                      value={classSemFilter}
                      onChange={(e) => setClassSemFilter(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Subject</label>
                    <select
                      value={ttSubjectCode}
                      onChange={(e) => setTtSubjectCode(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="">-- Choose Subject --</option>
                      {allSubjects.map(s => (
                        <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Instructor</label>
                    <select
                      value={ttFacultyId}
                      onChange={(e) => setTtFacultyId(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="">-- Choose Faculty --</option>
                      {allFaculty.map(f => {
                        const u = allUsers.find(user => user.id === f.userId);
                        return (
                          <option key={f.userId} value={f.userId}>{u?.name || f.employeeId}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hall 302 or Systems Lab 4"
                    value={ttRoom}
                    onChange={(e) => setTtRoom(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddClassModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Validate & Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 5. SEMESTER EXAM TIMETABLE
  if (currentPage === 'exam-timetable') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Semester Exam Timetables
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create and publish official examination schedules. Automatic validation prevents room clashes and cohort student overlaps.
            </p>
          </div>
          <button
            onClick={() => {
              setExamClashError(null);
              setShowCreateExamModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Schedule Examination
          </button>
        </div>

        {/* Master Exam Timetable Roster */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Published Examination Schedules ({allExams.length})
          </h3>

          {allExams.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <CalendarClock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No examination schedules published yet</p>
              <p>Click "Schedule Examination" to create mid-term or final examination slots.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Stacked Cards (md:hidden) */}
              <div className="md:hidden space-y-3">
                {allExams.map(ex => (
                  <div key={ex.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded text-[11px]">
                        {ex.examDate}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {ex.examType}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1.5">{ex.subjectCode}</span>
                        {ex.subjectName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between font-mono">
                        <span>{ex.startTime} - {ex.endTime}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Room: {ex.room}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ex.departmentName} (Sem {ex.semester})
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        onClick={() => EduTrackApi.togglePublishExam(ex.id, currentUser.name)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors min-h-[36px] ${
                          ex.isPublished
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {ex.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {ex.isPublished ? 'Published' : 'Hidden'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete exam schedule for ${ex.subjectCode}?`)) {
                            EduTrackApi.deleteExamSchedule(ex.id, currentUser.name);
                          }
                        }}
                        className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded flex items-center gap-1 transition-colors min-h-[36px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Full Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[11px] border-y border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Date & Time</th>
                      <th className="py-3 px-4 font-semibold">Subject</th>
                      <th className="py-3 px-4 font-semibold">Cohort</th>
                      <th className="py-3 px-4 font-semibold">Venue Room</th>
                      <th className="py-3 px-4 font-semibold">Exam Type</th>
                      <th className="py-3 px-4 font-semibold">Visibility</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {allExams.map(ex => (
                      <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white">{ex.examDate}</span>
                          <span className="block font-mono text-[11px] text-slate-500">{ex.startTime} - {ex.endTime}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{ex.subjectCode}</span>
                          <span className="block text-slate-700 dark:text-slate-300">{ex.subjectName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {ex.departmentName} (Sem {ex.semester})
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{ex.room}</td>
                        <td className="py-3 px-4 text-slate-500">{ex.examType}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => EduTrackApi.togglePublishExam(ex.id, currentUser.name)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              ex.isPublished
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {ex.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {ex.isPublished ? 'Published' : 'Hidden'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete exam schedule for ${ex.subjectCode}?`)) {
                                EduTrackApi.deleteExamSchedule(ex.id, currentUser.name);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Modal: Schedule Exam */}
        {showCreateExamModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Examination</h3>
                <button onClick={() => setShowCreateExamModal(false)} className="text-slate-400">✕</button>
              </div>

              {examClashError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{examClashError}</span>
                </div>
              )}

              <form onSubmit={handleCreateExam} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <select
                      value={examDeptFilter}
                      onChange={(e) => setExamDeptFilter(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={examSemFilter}
                      onChange={(e) => setExamSemFilter(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS501"
                      value={examSubjectCode}
                      onChange={(e) => setExamSubjectCode(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Operating Systems"
                      value={examSubjectName}
                      onChange={(e) => setExamSubjectName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Exam Date</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                    <input
                      type="text"
                      required
                      value={examStartTime}
                      onChange={(e) => setExamStartTime(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                    <input
                      type="text"
                      required
                      value={examEndTime}
                      onChange={(e) => setExamEndTime(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Room / Examination Venue</label>
                  <input
                    type="text"
                    required
                    value={examRoom}
                    onChange={(e) => setExamRoom(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Instructions</label>
                  <input
                    type="text"
                    value={examInstructions}
                    onChange={(e) => setExamInstructions(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowCreateExamModal(false)} className="px-3 py-2 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Validate & Publish</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 6. ANNOUNCEMENTS
  if (currentPage === 'announcements') {
    const audienceAnnouncements = announcements.filter(a => a.audience === annAudienceTab);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Announcements & Circulars
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast official academic circulars with strict audience separation: Students receive only student notices, and Faculty receive only faculty notices.
          </p>
        </div>

        {/* Compose Form */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Compose Official Announcement
          </h3>
          <form onSubmit={handleCreateAnnouncement} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={annAudienceTab}
                  onChange={(e) => setAnnAudienceTab(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold outline-none"
                >
                  <option value="STUDENTS">STUDENTS ONLY</option>
                  <option value="FACULTY">FACULTY ONLY</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent / Action Required</option>
                  <option value="academic">Academic Governance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Department Filter (Optional)</label>
                <select
                  value={annDeptFilter}
                  onChange={(e) => setAnnDeptFilter(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. End-Semester Examination Registration Notification"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
              <textarea
                rows={3}
                required
                placeholder="Type circular details..."
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Publish Broadcast
            </button>
          </form>
        </div>

        {/* Delivery Roster */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <button
              onClick={() => setAnnAudienceTab('STUDENTS')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg ${
                annAudienceTab === 'STUDENTS' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Student Bulletins ({announcements.filter(a => a.audience === 'STUDENTS').length})
            </button>
            <button
              onClick={() => setAnnAudienceTab('FACULTY')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg ml-2 ${
                annAudienceTab === 'FACULTY' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Faculty Bulletins ({announcements.filter(a => a.audience === 'FACULTY').length})
            </button>
          </div>

          {audienceAnnouncements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No circulars published for {annAudienceTab} yet.
            </div>
          ) : (
            <div className="space-y-3">
              {audienceAnnouncements.map(ann => (
                <div key={ann.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        ann.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ann.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">Published {ann.publishedAt}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ann.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{ann.message}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete announcement "${ann.title}"?`)) {
                        EduTrackApi.deleteAnnouncement(ann.id, currentUser.name);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  return <div>Admin Page Not Found</div>;
};
