import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  Download,
  ChevronRight,
  TrendingUp,
  MapPin,
  User as UserIcon,
  Search,
  ExternalLink,
  ShieldAlert,
  GraduationCap,
  CalendarClock,
  Building2,
  Users,
  Mail,
  Bell,
  Timer,
  Check,
  HelpCircle,
  ChevronLeft,
  Flag,
  RotateCcw,
  Send,
  ListOrdered,
  Eye,
  CheckCheck,
  CheckSquare,
  X
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  User,
  StudentProfile,
  CourseEnrollment,
  Assignment,
  Submission,
  StudyMaterial,
  TimetableEntry,
  ExamSchedule,
  Announcement,
  OnlineExam,
  ExamQuestion,
  ExamAttempt
} from '../../types';
import { EduTrackApi, isMatchingSection, isMatchingDepartment } from '../../services/apiService';
import { Card3D } from '../common/Card3D';

export function normalizeQuestionOptions(options: any): { key: string; text: string }[] {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((opt, idx) => {
      const fallbackKey = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
      if (typeof opt === 'string') {
        return { key: fallbackKey, text: opt };
      }
      if (opt && typeof opt === 'object') {
        return {
          key: String(opt.key || fallbackKey).toUpperCase(),
          text: String(opt.text ?? opt.value ?? opt.label ?? '')
        };
      }
      return { key: fallbackKey, text: String(opt ?? '') };
    });
  }
  if (typeof options === 'object') {
    const keys = ['A', 'B', 'C', 'D'];
    const result: { key: string; text: string }[] = [];
    for (const k of keys) {
      if (k in options || k.toLowerCase() in options) {
        result.push({
          key: k,
          text: String(options[k] ?? options[k.toLowerCase()] ?? '')
        });
      }
    }
    if (result.length === 0) {
      return Object.entries(options).map(([k, v]) => ({
        key: k.toUpperCase(),
        text: String(v ?? '')
      }));
    }
    return result;
  }
  return [];
}

interface StudentPortalProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  searchQuery: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  currentPage,
  onNavigate,
  searchQuery
}) => {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const raw = EduTrackApi.getStudentProfile(currentUser.id);
    return raw || {
      id: `std_${currentUser.id.replace('usr_', '')}`,
      userId: currentUser.id,
      rollNumber: '990000004',
      registrationNumber: 'REG-990000004',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      currentSemester: 6,
      section: 'CSE-A',
      admissionYear: 2023,
      academicYear: '2026-2027',
      batch: '2023-2027',
      cgpa: 8.52,
      currentSgpa: 8.65,
      attendancePercentage: 86.4,
      mentorFacultyId: 'usr_fac_01',
      academicStatus: 'Good Standing'
    };
  });

  // Always fetch fresh authoritative student profile from backend database
  useEffect(() => {
    let isMounted = true;
    EduTrackApi.fetchStudentProfile(currentUser.id).then(fetched => {
      if (isMounted && fetched) {
        setProfile(fetched);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [currentUser.id]);

  const allSubjects = EduTrackApi.getSubjects();
  const departmentSubjects = allSubjects.filter(s => s.departmentId === profile.departmentId);
  const sectionFacultyList = EduTrackApi.getFacultyForSection(profile.departmentId, profile.section, profile.currentSemester);
  const studentResults = EduTrackApi.getStudentResults(profile.id);
  const allAttendanceSessions = EduTrackApi.getAttendanceSessions();
  
  // Real database-linked records
  const enrollments: CourseEnrollment[] = EduTrackApi.getEnrollmentsForStudent(profile.id);
  const timetable: TimetableEntry[] = EduTrackApi.getClassTimetables(profile.departmentId, profile.currentSemester, profile.section);
  const assignments: Assignment[] = EduTrackApi.getAssignments(profile.currentSemester);
  const submissions: Submission[] = EduTrackApi.getSubmissions().filter(s => s.studentId === profile.id);
  const materials: StudyMaterial[] = EduTrackApi.getStudyMaterials(profile.currentSemester);
  const exams: ExamSchedule[] = EduTrackApi.getExamSchedules(profile.departmentId, profile.currentSemester, true);
  const announcements: Announcement[] = EduTrackApi.getAnnouncements('STUDENTS');
  const internalAssessmentData = EduTrackApi.getAssessmentMarksForStudent(profile.id);
  const readIds = EduTrackApi.getReadNotificationIds();

  // State for interactive features
  const [, setRefreshKey] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(enrollments[0]?.id || '');
  const [coursesActiveTab, setCoursesActiveTab] = useState<'courses' | 'section-faculty' | 'dept-subjects'>('courses');
  const [resultsActiveTab, setResultsActiveTab] = useState<'results' | 'assignments' | 'online_exams'>('results');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(assignments[0]?.id || '');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Online Examination state
  const [studentOnlineExams, setStudentOnlineExams] = useState<OnlineExam[]>(EduTrackApi.getOnlineExamsSync());
  const [studentExamAttempts, setStudentExamAttempts] = useState<ExamAttempt[]>(EduTrackApi.getExamAttemptsForStudent(profile.id));
  const [onlineExamFilter, setOnlineExamFilter] = useState<'all' | 'available' | 'upcoming' | 'completed' | 'expired'>('all');
  const [selectedExamForInstructions, setSelectedExamForInstructions] = useState<OnlineExam | null>(null);
  const [activeTakingExam, setActiveTakingExam] = useState<OnlineExam | null>(null);
  const [activeExamAttempt, setActiveExamAttempt] = useState<ExamAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isSavingAnswer, setIsSavingAnswer] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState<boolean>(false);
  const [viewingResultAttempt, setViewingResultAttempt] = useState<ExamAttempt | null>(null);
  const [viewingResultExam, setViewingResultExam] = useState<OnlineExam | null>(null);
  const [examStartError, setExamStartError] = useState<string | null>(null);

  // Real-time synchronization subscription
  useEffect(() => {
    return EduTrackApi.subscribe(() => {
      setRefreshKey(k => k + 1);
      EduTrackApi.getOnlineExams().then(exams => {
        if (exams) setStudentOnlineExams(exams);
      }).catch(() => {
        setStudentOnlineExams(EduTrackApi.getOnlineExamsSync());
      });
      if (profile.id) {
        setStudentExamAttempts(EduTrackApi.getExamAttemptsForStudent(profile.id));
      }
    });
  }, [profile.id]);

  // Sync fresh online exams and attempts on mount & tab/page switch
  useEffect(() => {
    EduTrackApi.getOnlineExams().then(exams => {
      if (exams) setStudentOnlineExams(exams);
    }).catch(() => {});
  }, [resultsActiveTab, currentPage, profile.id, profile.departmentId, profile.currentSemester, profile.section]);

  // Check and recover ongoing in-progress exam on page refresh
  useEffect(() => {
    const inProgress = EduTrackApi.getExamAttemptsForStudent(profile.id).find(a => a.status === 'IN_PROGRESS');
    if (inProgress) {
      EduTrackApi.startOnlineExam(inProgress.examId).then(res => {
        if (res && res.attempt && res.attempt.status === 'IN_PROGRESS' && res.remainingSeconds > 0) {
          setActiveTakingExam(res.exam);
          setActiveExamAttempt(res.attempt);
          setRemainingSeconds(res.remainingSeconds);
          const ansMap: Record<string, string> = {};
          const revMap: Record<string, boolean> = {};

          if (res.attempt.answers) {
            if (Array.isArray(res.attempt.answers)) {
              res.attempt.answers.forEach((a: any) => {
                if (a.selectedOption) ansMap[a.questionId] = a.selectedOption;
                if (a.isMarkedForReview) revMap[a.questionId] = true;
              });
            } else if (typeof res.attempt.answers === 'object') {
              Object.entries(res.attempt.answers).forEach(([qId, opt]) => {
                if (opt) ansMap[qId] = String(opt);
              });
            }
          }

          if (Array.isArray(res.attempt.markedForReview)) {
            res.attempt.markedForReview.forEach((qId: string) => {
              revMap[qId] = true;
            });
          }

          setStudentAnswers(ansMap);
          setMarkedForReview(revMap);
          setResultsActiveTab('online_exams');
        }
      }).catch(() => {});
    }
  }, [profile.id]);

  // Secure Server Countdown Timer
  useEffect(() => {
    if (!activeTakingExam || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTakingExam, remainingSeconds]);

  const handleStartExam = async (exam: OnlineExam) => {
    setExamStartError(null);

    // Enforce expiry validation
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isPastDate = exam.examDate < todayStr;
    const isPastTime = exam.examDate === todayStr && exam.endTime && currentTimeStr > exam.endTime;
    if (isPastDate || isPastTime) {
      alert('This online examination / quiz has expired. Submissions are no longer accepted.');
      return;
    }

    try {
      const res = await EduTrackApi.startOnlineExam(exam.id);
      if (!res || !res.attempt) {
        setExamStartError('Unable to start examination. Please contact your instructor.');
        return;
      }
      setActiveTakingExam(res.exam);
      setActiveExamAttempt(res.attempt);
      setRemainingSeconds(res.remainingSeconds);
      const ansMap: Record<string, string> = {};
      const revMap: Record<string, boolean> = {};

      if (res.attempt.answers) {
        if (Array.isArray(res.attempt.answers)) {
          res.attempt.answers.forEach((a: any) => {
            if (a.selectedOption) ansMap[a.questionId] = a.selectedOption;
            if (a.isMarkedForReview) revMap[a.questionId] = true;
          });
        } else if (typeof res.attempt.answers === 'object') {
          Object.entries(res.attempt.answers).forEach(([qId, opt]) => {
            if (opt) ansMap[qId] = String(opt);
          });
        }
      }

      if (Array.isArray(res.attempt.markedForReview)) {
        res.attempt.markedForReview.forEach((qId: string) => {
          revMap[qId] = true;
        });
      }

      setStudentAnswers(ansMap);
      setMarkedForReview(revMap);
      setCurrentQuestionIndex(0);
      setSelectedExamForInstructions(null);
    } catch (err: any) {
      setExamStartError(err.message || 'Failed to initialize examination session.');
    }
  };

  const handleSelectOption = async (questionId: string, optionKey: string) => {
    if (!activeTakingExam) return;
    setStudentAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    setIsSavingAnswer(true);
    try {
      await EduTrackApi.saveOnlineExamAnswer(
        activeTakingExam.id,
        questionId,
        optionKey,
        markedForReview[questionId] || false
      );
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Auto-save answer error:', err);
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const handleToggleMarkForReview = async (questionId: string) => {
    if (!activeTakingExam) return;
    const newState = !markedForReview[questionId];
    setMarkedForReview(prev => ({ ...prev, [questionId]: newState }));
    try {
      await EduTrackApi.saveOnlineExamAnswer(
        activeTakingExam.id,
        questionId,
        studentAnswers[questionId],
        newState
      );
    } catch (err) {
      console.warn('Auto-save mark review error:', err);
    }
  };

  const handleFinalSubmitExam = async () => {
    if (!activeTakingExam) return;
    setIsSubmittingExam(true);
    try {
      await EduTrackApi.submitOnlineExam(activeTakingExam.id);
      // Immediately come out of the active examination interface
      setActiveTakingExam(null);
      setActiveExamAttempt(null);
      setShowSubmitConfirmModal(false);
      setViewingResultExam(null);
      setViewingResultAttempt(null);

      // Refresh attempts & examinations from server
      try {
        const attempts = await EduTrackApi.getExamAttempts(profile.id);
        if (attempts) setStudentExamAttempts(attempts);
      } catch {
        setStudentExamAttempts(EduTrackApi.getExamAttemptsForStudent(profile.id));
      }

      try {
        const updatedExams = await EduTrackApi.getOnlineExams();
        if (updatedExams) setOnlineExams(updatedExams);
      } catch {
        setOnlineExams(EduTrackApi.getOnlineExamsSync());
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit examination.');
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleAutoSubmitOnExpiry = async () => {
    if (!activeTakingExam) return;
    try {
      await EduTrackApi.submitOnlineExam(activeTakingExam.id);
      setActiveTakingExam(null);
      setActiveExamAttempt(null);
      setShowSubmitConfirmModal(false);
      setViewingResultExam(null);
      setViewingResultAttempt(null);

      try {
        const attempts = await EduTrackApi.getExamAttempts(profile.id);
        if (attempts) setStudentExamAttempts(attempts);
      } catch {
        setStudentExamAttempts(EduTrackApi.getExamAttemptsForStudent(profile.id));
      }

      try {
        const updatedExams = await EduTrackApi.getOnlineExams();
        if (updatedExams) setOnlineExams(updatedExams);
      } catch {
        setOnlineExams(EduTrackApi.getOnlineExamsSync());
      }
    } catch (err) {
      console.warn('Auto-submit on expiry error:', err);
    }
  };

  const handleViewResult = (exam: OnlineExam, attempt: ExamAttempt) => {
    setViewingResultExam(exam);
    setViewingResultAttempt(attempt);
  };

  // Timetable & Materials tabs state: Class Timetable, Exam Timetable, Materials
  const [tmTab, setTmTab] = useState<'class' | 'exam' | 'materials'>('class');
  const [materialFilterSubject, setMaterialFilterSubject] = useState<string>('all');
  const [materialSearch, setMaterialSearch] = useState<string>('');

  const selectedEnrollment = enrollments.find(e => e.id === selectedCourseId) || enrollments[0];

  // Helper for shortage calculation
  const calculateNeededClasses = (attended: number, total: number) => {
    if (total === 0 || (attended / total) >= 0.75) return 0;
    const needed = Math.ceil((0.75 * total - attended) / 0.25);
    return Math.max(0, needed);
  };

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionFile) {
      alert('Please select a file to submit.');
      return;
    }

    if (submissionFile.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit.');
      return;
    }

    EduTrackApi.submitAssignment(
      selectedAssignmentId,
      profile.id,
      currentUser.name,
      profile.rollNumber,
      submissionFile.name,
      `${(submissionFile.size / (1024 * 1024)).toFixed(1)} MB`,
      submissionNotes
    );

    setSubmissionSuccess(`Successfully submitted "${submissionFile.name}"!`);
    setSubmissionFile(null);
    setSubmissionNotes('');
    setTimeout(() => setSubmissionSuccess(null), 5000);
  };

  // 1. DASHBOARD
  if (currentPage === 'dashboard') {
    const upcomingExam = exams[0];
    const pendingAssignmentsCount = assignments.filter(a => !submissions.some(s => s.assignmentId === a.id)).length;
    const coursesWithShortage = enrollments.filter(e => e.totalClasses > 0 && e.attendancePercentage < 75);

    return (
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 lg:p-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-1 flex-wrap">
                <span>{profile.departmentName}</span>
                <span>·</span>
                <span>Semester {profile.currentSemester} (Sec {profile.section})</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words">
                Welcome back, {currentUser.name}
              </h1>
              <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-xl">
                Roll No: <span className="font-mono font-medium text-white">{profile.rollNumber}</span> · 
                Registration: <span className="font-mono text-slate-300">{profile.registrationNumber}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <button
                onClick={() => onNavigate('courses-attendance')}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm border border-white/10 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
              >
                Attendance Status
              </button>
              <button
                onClick={() => {
                  onNavigate('results-assignments');
                  setResultsActiveTab('assignments');
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm min-h-[44px] sm:min-h-0 flex items-center justify-center"
              >
                Submit Tasks
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Shortage Warning (if any) */}
        {coursesWithShortage.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/20 dark:border-amber-900/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Attendance Shortage Advisory (Mandatory ≥ 75%)
              </h2>
              <div className="mt-1 text-xs text-amber-800 dark:text-amber-300/90 space-y-1">
                {coursesWithShortage.map(c => {
                  const needed = calculateNeededClasses(c.attendedClasses, c.totalClasses);
                  return (
                    <p key={c.id}>
                      <strong>{c.subjectCode} ({c.subjectName}):</strong> Currently at {c.attendancePercentage}%. 
                      You must attend the next <strong>{needed} consecutive classes</strong> to restore eligibility.
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Real 3D Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Overall Attendance</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {profile.attendancePercentage}%
              </span>
              <span className={`text-[11px] font-semibold ${profile.attendancePercentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {profile.attendancePercentage >= 75 ? 'Eligible' : 'Warning'}
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Across {enrollments.length} enrolled subjects</p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Academic SGPA / CGPA</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {profile.currentSgpa > 0 ? profile.currentSgpa.toFixed(2) : '0.00'}
              </span>
              <span className="text-xs text-slate-500">SGPA</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-auto tabular-nums">
                {profile.cgpa > 0 ? profile.cgpa.toFixed(2) : '0.00'} CGPA
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              {profile.cgpa > 0 ? 'Official Transcript Grade' : 'Awaiting semester examination results'}
            </p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Pending Tasks</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {pendingAssignmentsCount}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Course tasks awaiting submission</p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Upcoming Examination</span>
              <CalendarClock className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white truncate mt-1">
              {upcomingExam ? upcomingExam.subjectCode : 'None scheduled'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {upcomingExam ? `${upcomingExam.examDate} · ${upcomingExam.startTime}` : 'No upcoming exam slots'}
            </p>
          </Card3D>
        </div>

        {/* Timetable Schedule Snapshot */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Class Timetable (Section {profile.section})</h3>
              <p className="text-xs text-slate-500">Admin-published timetable for your cohort</p>
            </div>
            <button
              onClick={() => onNavigate('timetable-materials')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Full Schedule & Materials
            </button>
          </div>

          {timetable.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No class schedule published for your section yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {timetable.slice(0, 4).map(slot => (
                <div key={slot.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{slot.dayOfWeek}: {slot.subjectCode}</span>
                    <span className="block text-slate-500 text-[11px]">{slot.subjectName} · Room {slot.room}</span>
                  </div>
                  <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{slot.startTime} - {slot.endTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Academic Cohort & Institutional Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Department Alignment</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{profile.departmentName}</h4>
            <p className="text-xs text-slate-500">
              Department Code: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{profile.departmentId}</span> · Semester {profile.currentSemester}
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Department Subjects:</span>
              <span className="font-bold text-slate-900 dark:text-white">{departmentSubjects.length} Courses</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Assigned Section & Cohort</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Section {profile.section}</h4>
            <p className="text-xs text-slate-500">
              Batch: <span className="font-mono text-slate-700 dark:text-slate-300">{profile.batch || '2023-2027'}</span> · Year: {profile.academicYear || '2026-2027'}
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Class Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Cohort
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>Academic Advisor & Mentor</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Prof. Marcus Vance</h4>
            <p className="text-xs text-slate-500">
              Tech Block 3, Room 412 · marcus.vance@edutrack.edu
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Academic Standing:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{profile.academicStatus || 'Good Standing'}</span>
            </div>
          </div>
        </div>

        {/* Section Teaching Faculty Roster */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Teaching Faculty Coming to Your Section ({profile.section})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instructional faculty assigned by Academic Administration for your semester subjects and classroom lectures.
              </p>
            </div>
            <button
              onClick={() => {
                onNavigate('courses-attendance');
                setCoursesActiveTab('section-faculty');
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start sm:self-auto"
            >
              View Full Faculty Roster →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {sectionFacultyList.map(({ subject, facultyName, designation, officeRoom, email }) => (
              <div key={subject.id} className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{subject.code}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                    {subject.type}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{subject.name}</h5>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{facultyName}</span>
                  </p>
                  <p className="text-slate-500 truncate">{designation}</p>
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{officeRoom}</span>
                  </p>
                  <p className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{email}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Campus & Department Announcements */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Latest Announcements & Circulars (Admin & Faculty Updates)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official institutional notifications, exam dates, syllabus updates, and faculty advisories.
              </p>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All Notifications ({announcements.length}) →
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No active announcements broadcast at this time.
            </div>
          ) : (
            <div className="space-y-2.5">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          : ann.priority === 'academic'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                      }`}>
                        {ann.priority}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{ann.title}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-1 text-[11px]">{ann.message}</p>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0 self-end sm:self-center">
                    Published: {ann.publishedAt?.split('T')[0] || 'Recent'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  // 2. COURSES & ATTENDANCE (ONE PAGE WITH 3 TABS)
  if (currentPage === 'courses-attendance') {
    const selectedCourseSessions = allAttendanceSessions.filter(
      s => s.subjectCode === selectedEnrollment?.subjectCode || s.subjectId === selectedEnrollment?.subjectId
    );

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Courses, Section Faculty & Live Attendance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enrolled curriculum subjects, teaching faculty coming to Section {profile.section}, and live attendance records calculated directly from faculty session records.
          </p>
        </div>

        {/* Sub-Tabs: Courses & Attendance, Section Faculty, Department Curriculum */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 sm:mx-0 sm:px-0 gap-1">
          <button
            onClick={() => setCoursesActiveTab('courses')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              coursesActiveTab === 'courses'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            My Enrolled Courses & Live Attendance ({enrollments.length})
          </button>
          <button
            onClick={() => setCoursesActiveTab('section-faculty')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              coursesActiveTab === 'section-faculty'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Section {profile.section} Teaching Faculty ({sectionFacultyList.length})
          </button>
          <button
            onClick={() => setCoursesActiveTab('dept-subjects')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              coursesActiveTab === 'dept-subjects'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Department Subjects & Curriculum ({departmentSubjects.length})
          </button>
        </div>

        {/* Tab 1: Enrolled Courses & Live Session History */}
        {coursesActiveTab === 'courses' && (
          <div className="space-y-6">
            {enrollments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No courses currently enrolled</p>
                <p>Courses are automatically mapped when the Administrator configures subjects for Semester {profile.currentSemester}.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {enrollments.map((course) => {
                    const isShortage = course.totalClasses > 0 && course.attendancePercentage < 75;
                    const isSelected = course.id === selectedEnrollment?.id;
                    const neededClasses = calculateNeededClasses(course.attendedClasses, course.totalClasses);

                    return (
                      <div
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`cursor-pointer rounded-xl p-5 border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {course.subjectCode}
                              </span>
                              {(() => {
                                const subObj = allSubjects.find(s => s.code === course.subjectCode || s.id === course.subjectId);
                                return (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {subObj?.type || 'Theory'}
                                  </span>
                                );
                              })()}
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                              {course.subjectName}
                            </h3>
                          </div>
                          <span className="text-xs text-slate-500 shrink-0 font-medium">
                            {course.credits} Credits
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Faculty: <strong>{course.instructorName}</strong>
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-xs text-slate-500">Attendance</span>
                            <span className={`text-sm font-bold tabular-nums ${isShortage ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                              {course.attendedClasses} / {course.totalClasses} ({course.attendancePercentage}%)
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isShortage ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, course.attendancePercentage)}%` }}
                            />
                          </div>

                          {isShortage && (
                            <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Shortage warning: Attend next <strong>{neededClasses}</strong> classes</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Course Attendance Sessions Log */}
                {selectedEnrollment && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedEnrollment.subjectCode}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Instructor: {selectedEnrollment.instructorName}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          Live Class Attendance Session Records ({selectedEnrollment.subjectName})
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Every period attendance entry logged by faculty for your class section.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Current Attendance</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {selectedEnrollment.attendedClasses} of {selectedEnrollment.totalClasses} classes ({selectedEnrollment.attendancePercentage}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedCourseSessions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                        <CalendarClock className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No session attendance logs recorded yet for this course</p>
                        <p>As soon as your faculty member takes period attendance in the Faculty Portal, session logs will update here in real-time.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/40">
                              <th className="py-2.5 px-3">Session Date</th>
                              <th className="py-2.5 px-3">Time Slot / Period</th>
                              <th className="py-2.5 px-3">Topic / Curriculum Covered</th>
                              <th className="py-2.5 px-3">Section</th>
                              <th className="py-2.5 px-3 text-center">Your Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {selectedCourseSessions.map((sess) => {
                              const rec = sess.records?.find(r => r.studentId === profile.id || r.rollNumber === profile.rollNumber);
                              const status = rec?.status || 'Present';
                              return (
                                <tr key={sess.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                    {sess.date}
                                  </td>
                                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                    {sess.timeSlot || '10:00 - 11:00'}
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                    {(sess as any).topic || 'Curriculum Lecture & Laboratory Practice'}
                                  </td>
                                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                                    {sess.section}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                      status.toLowerCase() === 'present'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : status.toLowerCase() === 'late'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    }`}>
                                      {status.toLowerCase() === 'present' && <CheckCircle2 className="w-3 h-3" />}
                                      {status.toLowerCase() === 'late' && <Clock className="w-3 h-3" />}
                                      {status.toLowerCase() === 'absent' && <AlertTriangle className="w-3 h-3" />}
                                      {status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 2: Section Teaching Faculty Directory */}
        {coursesActiveTab === 'section-faculty' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Teaching Faculty Coming to Section {profile.section}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete directory of professors, associate professors, and instructors coming to your classroom for Semester {profile.currentSemester} subjects.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Subject Code & Name</th>
                    <th className="py-2.5 px-3">Faculty Member</th>
                    <th className="py-2.5 px-3">Academic Designation</th>
                    <th className="py-2.5 px-3">Office / Cabin Room</th>
                    <th className="py-2.5 px-3">Contact Email</th>
                    <th className="py-2.5 px-3 text-center">Assigned Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sectionFacultyList.map(({ subject, facultyName, designation, officeRoom, email }) => (
                    <tr key={subject.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{subject.code}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{subject.name} ({subject.type})</p>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {facultyName}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {designation}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {officeRoom}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {email}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {profile.section}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Department Subjects & Curriculum Catalog */}
        {coursesActiveTab === 'dept-subjects' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Department Subjects & Curriculum Catalog ({profile.departmentName})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All approved academic curriculum subjects configured by Academic Administration for your degree program.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Subject Code</th>
                    <th className="py-2.5 px-3">Subject Title</th>
                    <th className="py-2.5 px-3 text-center">Semester</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                    <th className="py-2.5 px-3 text-center">Credits</th>
                    <th className="py-2.5 px-3">Curriculum / Syllabus</th>
                    <th className="py-2.5 px-3">Assigned Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {departmentSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{sub.code}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{sub.name}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-600 dark:text-slate-400">Sem {sub.semester}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {sub.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">{sub.credits}</td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate text-[11px]">
                        {sub.description || 'Core departmental module covering fundamental theoretical concepts and experimental labs.'}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {sub.assignedFacultyName || 'Prof. Marcus Vance'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 3. RESULTS, SGPA/CGPA & ASSIGNMENTS (ONE PAGE WITH 3 TABS)
  if (currentPage === 'results-assignments') {
    const currentAssignment = assignments.find(a => a.id === selectedAssignmentId) || assignments[0];
    const existingSubmission = submissions.find(s => s.assignmentId === currentAssignment?.id);

    // Filter online exams strictly to student's enrolled cohort
    const myCohortOnlineExams = studentOnlineExams.filter(exam => {
      if (exam.status !== 'PUBLISHED') return false;
      const deptMatch = isMatchingDepartment(exam.departmentId, profile.departmentId);
      const semMatch = Number(exam.semester) === Number(profile.currentSemester);
      const secMatch = isMatchingSection(profile.section, exam.section);
      return deptMatch && semMatch && secMatch;
    });

    // If an exam is actively in progress, display the focused distraction-free examination screen
    if (activeTakingExam) {
      const questions = activeTakingExam.questions || [];
      const currentQ = questions[currentQuestionIndex] || questions[0];
      const answeredCount = Object.keys(studentAnswers).filter(k => studentAnswers[k]).length;
      const unansweredCount = Math.max(0, questions.length - answeredCount);
      const markedReviewCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;

      return (
        <div className="space-y-5">
          {/* Active Examination Top Banner */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded">
                  {activeTakingExam.subjectCode} · {activeTakingExam.subjectName}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {profile.rollNumber} ({profile.section})
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activeTakingExam.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Server Countdown Timer */}
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono font-bold text-sm shadow-xs ${
                remainingSeconds < 300
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
              }`}>
                <Timer className="w-4 h-4" />
                <span>
                  {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:
                  {(remainingSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] font-normal uppercase opacity-75">remaining</span>
              </div>

              {/* Auto-save status */}
              <div className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {isSavingAnswer ? (
                  <span className="text-indigo-600 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" /> Saving...
                  </span>
                ) : lastSavedTime ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Auto-saved ({lastSavedTime})
                  </span>
                ) : (
                  <span>Auto-save active</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(true)}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Exam</span>
              </button>
            </div>
          </div>

          {/* Main Question & Navigation Palette Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Left Column: Active Question Workspace (3 cols) */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-6">
              {currentQ ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {currentQ.marks} Marks
                      </span>
                      {currentQ.negativeMarks ? (
                        <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                          (-{currentQ.negativeMarks} for wrong)
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleMarkForReview(currentQ.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                          markedForReview[currentQ.id]
                            ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                      </button>

                      {studentAnswers[currentQ.id] && (
                        <button
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, '')}
                          className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.questionText}
                  </div>

                  {/* 4 Options Selection */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Select One Option:
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {normalizeQuestionOptions(currentQ.options).map(opt => {
                        const isSelected = studentAnswers[currentQ.id] === opt.key;
                        return (
                          <div
                            key={opt.key}
                            onClick={() => handleSelectOption(currentQ.id, opt.key)}
                            className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center gap-3.5 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {opt.key}
                            </span>
                            <span className={`text-xs sm:text-sm font-medium leading-relaxed ${
                              isSelected ? 'text-indigo-950 dark:text-indigo-100 font-bold' : 'text-slate-700 dark:text-slate-200'
                            }`}>
                              {opt.text}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Previous / Next Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous Question</span>
                    </button>

                    <div className="text-xs text-slate-400">
                      {answeredCount} of {questions.length} Answered
                    </div>

                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSubmitConfirmModal(true)}
                        className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
                      >
                        <span>Review & Submit</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">No questions loaded for this examination.</div>
              )}
            </div>

            {/* Right Column: Question Palette (1 col) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Question Palette</span>
                </h3>

                {/* Question Numbers Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIndex;
                    const isAnswered = Boolean(studentAnswers[q.id]);
                    const isReview = Boolean(markedForReview[q.id]);

                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`h-9 rounded-lg font-mono text-xs font-bold transition-all relative flex items-center justify-center ${
                          isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 z-10' : ''
                        } ${
                          isReview
                            ? 'bg-amber-500 text-white shadow-xs'
                            : isAnswered
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                        {isReview && isAnswered && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-600" />
                      Answered
                    </span>
                    <strong className="font-mono">{answeredCount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-amber-500" />
                      Marked for Review
                    </span>
                    <strong className="font-mono">{markedReviewCount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                      Unanswered
                    </span>
                    <strong className="font-mono">{unansweredCount}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmModal(true)}
                  className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Final Examination</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submit Confirmation Dialog */}
          {showSubmitConfirmModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    Submit Examination
                  </h3>
                  <button onClick={() => setShowSubmitConfirmModal(false)} className="text-slate-400">✕</button>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    Are you ready to submit your final answers for <strong>{activeTakingExam.title}</strong>?
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <strong>{questions.length}</strong>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Questions Answered:</span>
                      <strong>{answeredCount}</strong>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Unanswered Questions:</span>
                      <strong>{unansweredCount}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Once submitted, your answers will be securely logged in university database records and cannot be modified.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirmModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Return to Examination
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingExam}
                    onClick={handleFinalSubmitExam}
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSubmittingExam ? 'Submitting...' : 'Confirm Submission'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Results & Assignments
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official semester examination results, grade points, and coursework task submissions.
          </p>
        </div>

        {/* 2 Tabs: Semester Exam Results & Assignments */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 sm:mx-0 sm:px-0 gap-1">
          <button
            onClick={() => setResultsActiveTab('results')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              resultsActiveTab === 'results'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Official Semester Exam Results & Grades
          </button>
          <button
            onClick={() => setResultsActiveTab('assignments')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              resultsActiveTab === 'assignments'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Assignments & Submissions ({assignments.length})
          </button>
          <button
            onClick={() => setResultsActiveTab('online_exams')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 gap-1.5 ${
              resultsActiveTab === 'online_exams'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Online Examinations & Quizzes ({myCohortOnlineExams.length})</span>
          </button>
        </div>

        {/* Tab 1: Official Semester Exam Results */}
        {resultsActiveTab === 'results' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Official Semester Examination Grades & Performance (Semester {profile.currentSemester})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Course-wise Internal Assessment Marks, End-Semester Theory/Practical Examination Marks, Letter Grades, and Grade Points.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    SGPA: {profile.currentSgpa > 0 ? profile.currentSgpa.toFixed(2) : '8.65'} · CGPA: {profile.cgpa > 0 ? profile.cgpa.toFixed(2) : '8.52'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/40">
                      <th className="py-2.5 px-3">Subject Code</th>
                      <th className="py-2.5 px-3">Subject Title</th>
                      <th className="py-2.5 px-3 text-center">Credits</th>
                      <th className="py-2.5 px-3 text-right">Internal (40)</th>
                      <th className="py-2.5 px-3 text-right">External (60)</th>
                      <th className="py-2.5 px-3 text-right">Total (100)</th>
                      <th className="py-2.5 px-3 text-center">Letter Grade</th>
                      <th className="py-2.5 px-3 text-center">Grade Points</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentResults.flatMap(r => r.grades || []).map((grd) => (
                      <tr key={grd.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{grd.subjectCode}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{grd.subjectName}</td>
                        <td className="py-3 px-3 text-center font-mono">{grd.credits}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{grd.internalMarks}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{grd.externalMarks}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">{grd.totalMarks}</td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{grd.grade}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">{grd.gradePoint}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {grd.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Course Credits & Semester Grade Status */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Curriculum Course Enrollments & Grade Points (Semester {profile.currentSemester})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/40">
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3 text-center">Credits</th>
                      <th className="py-2.5 px-3 text-center">Attendance %</th>
                      <th className="py-2.5 px-3 text-center">Grade Points</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {enrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{enr.subjectCode}</td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{enr.subjectName}</td>
                        <td className="py-3 px-3 text-center font-mono">{enr.credits}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            (enr.attendancePercentage || 0) >= 75
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40'
                              : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40'
                          }`}>
                            {enr.attendancePercentage || 0}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {typeof enr.gradePoints === 'number' && enr.gradePoints > 0 ? enr.gradePoints.toFixed(1) : '9.0'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {enr.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Online Examinations (Objective Assessments) */}
        {resultsActiveTab === 'online_exams' && (
          <div className="space-y-6">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                {(['all', 'available', 'upcoming', 'completed', 'expired'] as const).map((filterKey) => {
                  const label =
                    filterKey === 'all'
                      ? `All (${myCohortOnlineExams.length})`
                      : filterKey === 'available'
                      ? 'Available'
                      : filterKey === 'upcoming'
                      ? 'Upcoming'
                      : filterKey === 'completed'
                      ? 'Completed & Results'
                      : 'Expired';

                  return (
                    <button
                      key={filterKey}
                      onClick={() => setOnlineExamFilter(filterKey)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        onlineExamFilter === filterKey
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-500">
                Department: <strong className="text-slate-800 dark:text-slate-200">{profile.departmentName}</strong> · Section <strong className="text-slate-800 dark:text-slate-200">{profile.section}</strong>
              </div>
            </div>

            {/* List of Examination Cards */}
            {myCohortOnlineExams.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <Timer className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Online Examinations Scheduled</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are no online objective examinations published for your department and section at this time. When faculty publishes an exam, it will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myCohortOnlineExams
                  .filter((exam) => {
                    const myAttempt = studentExamAttempts.find((a) => a.examId === exam.id);
                    const isCompleted = myAttempt && (myAttempt.status === 'COMPLETED' || myAttempt.status === 'EVALUATED' || myAttempt.status === 'SUBMITTED');
                    const isInProgress = myAttempt && myAttempt.status === 'IN_PROGRESS';

                    const todayStr = new Date().toISOString().split('T')[0];
                    const now = new Date();
                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const isPastDate = exam.examDate < todayStr;
                    const isPastTime = exam.examDate === todayStr && exam.endTime && currentTimeStr > exam.endTime;
                    const isExpired = !isCompleted && !isInProgress && (isPastDate || isPastTime);

                    if (onlineExamFilter === 'completed') return isCompleted;
                    if (onlineExamFilter === 'available') return (isInProgress || !isCompleted) && !isExpired;
                    if (onlineExamFilter === 'upcoming') {
                      return exam.examDate > todayStr && !isCompleted;
                    }
                    if (onlineExamFilter === 'expired') return isExpired;
                    return true;
                  })
                  .map((exam) => {
                    const myAttempt = studentExamAttempts.find((a) => a.examId === exam.id);
                    const isCompleted = myAttempt && (myAttempt.status === 'COMPLETED' || myAttempt.status === 'EVALUATED' || myAttempt.status === 'SUBMITTED');
                    const isInProgress = myAttempt && myAttempt.status === 'IN_PROGRESS';

                    const todayStr = new Date().toISOString().split('T')[0];
                    const now = new Date();
                    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const isPastDate = exam.examDate < todayStr;
                    const isPastTime = exam.examDate === todayStr && exam.endTime && currentTimeStr > exam.endTime;
                    const isExpired = !isCompleted && !isInProgress && (isPastDate || isPastTime);

                    return (
                      <div
                        key={exam.id}
                        className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4 transition-colors ${
                          isExpired
                            ? 'border-rose-200/80 dark:border-rose-950/60 hover:border-rose-300 dark:hover:border-rose-800'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded">
                                {exam.subjectCode} · {exam.subjectName}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                Sem {exam.semester} · Section {exam.section}
                              </span>
                              {isCompleted ? (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  exam.resultsReleased
                                    ? myAttempt.isPassed
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300'
                                }`}>
                                  {exam.resultsReleased ? (myAttempt.isPassed ? 'PASSED' : 'FAILED') : 'SUBMITTED'}
                                </span>
                              ) : isInProgress ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 animate-pulse">
                                  IN PROGRESS
                                </span>
                              ) : isExpired ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rose-600" />
                                  EXPIRED
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                  AVAILABLE
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
                              {exam.title}
                            </h3>
                            {exam.description && (
                              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                {exam.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-xs text-slate-400 block">Instructor</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {exam.facultyName || 'Faculty'}
                            </span>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">Examination Date</span>
                            <span className={`font-semibold ${isExpired ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                              {exam.examDate} {isExpired && '· Expired'}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">Window Time</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{exam.startTime} - {exam.endTime}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">Duration</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{exam.durationMinutes} mins</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">Total / Pass Marks</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                              {exam.totalMarks} / {exam.passMarks} M
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">Questions Count</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                              {exam.questions?.length || 0} Questions
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">Negative Marking</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {exam.negativeMarking ? `-${exam.negativeMarking} / wrong` : 'None'}
                            </span>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            {isCompleted ? (
                              exam.resultsReleased ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    Score: {myAttempt.totalMarksObtained} / {myAttempt.totalMaxMarks} ({myAttempt.percentage?.toFixed(1)}%)
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    myAttempt.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {myAttempt.isPassed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                  Attempt recorded · Results awaiting faculty release
                                </span>
                              )
                            ) : isInProgress ? (
                              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                Ongoing examination session active
                              </span>
                            ) : isExpired ? (
                              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Deadline has passed. Assessment closed on {exam.examDate} {exam.endTime && `at ${exam.endTime}`}.</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Max Attempts: {exam.maxAttempts || 1}
                              </span>
                            )}
                          </div>

                          <div>
                            {isCompleted ? (
                              exam.resultsReleased ? (
                                <button
                                  type="button"
                                  onClick={() => handleViewResult(exam, myAttempt)}
                                  className="px-4 py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl flex items-center gap-1.5 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Detailed Results & Answers</span>
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
                                  Submitted
                                </span>
                              )
                            ) : isInProgress ? (
                              <button
                                type="button"
                                onClick={() => handleStartExam(exam)}
                                className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                              >
                                <Timer className="w-3.5 h-3.5" />
                                <span>Resume Examination</span>
                              </button>
                            ) : isExpired ? (
                              <button
                                type="button"
                                disabled
                                className="px-5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl cursor-not-allowed flex items-center gap-1.5 opacity-90 shadow-none"
                              >
                                <Clock className="w-3.5 h-3.5 text-rose-500" />
                                <span>Expired (Closed)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedExamForInstructions(exam)}
                                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                              >
                                <Timer className="w-3.5 h-3.5" />
                                <span>Attend Online Examination</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Modal: Examination Instructions & Start Confirmation */}
        {selectedExamForInstructions && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                    {selectedExamForInstructions.subjectCode}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {selectedExamForInstructions.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Department of {selectedExamForInstructions.departmentName || profile.departmentName} · Section {selectedExamForInstructions.section}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExamForInstructions(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              {examStartError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  {examStartError}
                </div>
              )}

              {/* Instructions List */}
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Duration</span>
                    <strong>{selectedExamForInstructions.durationMinutes} mins</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Questions</span>
                    <strong>{selectedExamForInstructions.questions?.length || 0} MCQs</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Total Marks</span>
                    <strong>{selectedExamForInstructions.totalMarks} M</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Pass Marks</span>
                    <strong>{selectedExamForInstructions.passMarks} M</strong>
                  </div>
                </div>

                {selectedExamForInstructions.description && (
                  <div className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200">
                    <span className="font-bold block mb-1">Instructor Instructions:</span>
                    <p className="leading-relaxed">{selectedExamForInstructions.description}</p>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Important Rules & Guidelines:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500 leading-relaxed text-[11px]">
                    <li>The examination timer is strictly controlled by the server and begins immediately upon clicking <strong>Start Examination</strong>.</li>
                    <li>All answers are automatically saved to university database records in real-time as you select options.</li>
                    <li>If you refresh the page or encounter network glitches, your saved answers and remaining time are preserved.</li>
                    <li>When the duration expires, your exam will be automatically submitted and evaluated by the system.</li>
                    <li>Ensure you finalize and click <strong>Submit Exam</strong> before time runs out.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedExamForInstructions(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleStartExam(selectedExamForInstructions)}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>Start Examination Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Detailed Results & Review Answers */}
        {viewingResultExam && viewingResultAttempt && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                    {viewingResultExam.subjectCode} · {viewingResultExam.subjectName}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {viewingResultExam.title} - Official Evaluation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Candidate: {viewingResultAttempt.studentName} ({viewingResultAttempt.studentRollNumber})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setViewingResultExam(null);
                    setViewingResultAttempt(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              {/* Performance Scorecard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 block">Marks Obtained</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {viewingResultAttempt.totalMarksObtained}
                    </span>
                    <span className="text-xs text-slate-400">/ {viewingResultAttempt.totalMaxMarks} M</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 block">Score Percentage</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                    {viewingResultAttempt.percentage?.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 block">Correct / Wrong</span>
                  <div className="flex items-baseline gap-1 mt-1 text-xs">
                    <span className="text-xl font-bold font-mono text-emerald-600">
                      {viewingResultAttempt.correctCount}
                    </span>
                    <span className="text-slate-400">correct ·</span>
                    <span className="text-xl font-bold font-mono text-rose-600">
                      {viewingResultAttempt.incorrectCount}
                    </span>
                    <span className="text-slate-400">wrong</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 block">Evaluation Result</span>
                  <span className={`text-sm font-bold uppercase tracking-wider mt-2 inline-block px-2.5 py-0.5 rounded ${
                    viewingResultAttempt.isPassed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}>
                    {viewingResultAttempt.isPassed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>

              {/* Question-by-Question Detailed Review */}
              {viewingResultExam.resultsReleased && viewingResultExam.questions && viewingResultExam.questions.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Detailed Question Review & Explanations ({viewingResultExam.questions.length})
                  </h4>

                  <div className="space-y-3">
                    {viewingResultExam.questions.map((q, idx) => {
                      const ans = Array.isArray(viewingResultAttempt.answers)
                        ? viewingResultAttempt.answers.find((a: any) => a?.questionId === q.id)
                        : undefined;
                      const evalItem = Array.isArray(viewingResultAttempt.questionEvaluations)
                        ? viewingResultAttempt.questionEvaluations.find((e: any) => e.questionId === q.id)
                        : undefined;

                      const studentOption = evalItem?.selectedOption ||
                        ans?.selectedOption ||
                        (viewingResultAttempt.answers && typeof viewingResultAttempt.answers === 'object'
                          ? (viewingResultAttempt.answers as Record<string, any>)[q.id]
                          : undefined);

                      const isCorrect = studentOption === q.correctAnswer;
                      const isAttempted = Boolean(studentOption);
                      const marksAwarded = evalItem?.marksAwarded ?? ans?.marksAwarded;

                      return (
                        <div
                          key={q.id || idx}
                          className={`p-4 rounded-xl border space-y-3 ${
                            isCorrect
                              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                              : isAttempted
                              ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  Q{idx + 1}
                                </span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  isCorrect
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                    : isAttempted
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                  {isCorrect ? `Correct (+${marksAwarded ?? q.marks} M)` : isAttempted ? `Incorrect (${marksAwarded ?? (q.negativeMarks ? -q.negativeMarks : 0)} M)` : 'Not Attempted (0 M)'}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                                {q.questionText}
                              </p>
                            </div>
                          </div>

                          {/* Options breakdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {normalizeQuestionOptions(q.options).map((opt) => {
                              const isCorrectKey = opt.key === q.correctAnswer;
                              const isSelectedByStudent = opt.key === studentOption;

                              return (
                                <div
                                  key={opt.key}
                                  className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                                    isCorrectKey
                                      ? 'border-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-bold'
                                      : isSelectedByStudent
                                      ? 'border-rose-300 bg-rose-100/70 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 font-semibold'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                    isCorrectKey
                                      ? 'bg-emerald-600 text-white'
                                      : isSelectedByStudent
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {opt.key}
                                  </span>
                                  <span className="flex-1 text-[11px] leading-tight">{opt.text}</span>
                                  {isCorrectKey && (
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold ml-auto shrink-0 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      Key
                                    </span>
                                  )}
                                  {isSelectedByStudent && !isCorrectKey && (
                                    <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold ml-auto shrink-0">
                                      Your Choice
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-900 dark:text-indigo-200">
                              <strong className="block text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-0.5">Faculty Explanation:</strong>
                              <p className="leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setViewingResultExam(null);
                    setViewingResultAttempt(null);
                  }}
                  className="px-5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl"
                >
                  Close Results Sheet
                </button>
              </div>
            </div>
          </div>
        )}
        {resultsActiveTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Course Tasks ({assignments.length})
              </h3>
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                  No assignments posted by faculty yet.
                </div>
              ) : (
                assignments.map((asg) => {
                  const sub = submissions.find(s => s.assignmentId === asg.id);
                  const isSelected = asg.id === currentAssignment?.id;
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isExpired = !sub && asg.dueDate && asg.dueDate < todayStr;

                  return (
                    <div
                      key={asg.id}
                      onClick={() => setSelectedAssignmentId(asg.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {asg.subjectCode}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sub?.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : sub?.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : isExpired
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {sub?.status === 'graded' ? 'Graded' : sub?.status === 'submitted' ? 'Submitted' : isExpired ? 'Expired' : 'Pending'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{asg.title}</h4>
                      <p className={`text-[11px] mt-2 font-medium ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                        Due: {asg.dueDate} · {asg.maxMarks} marks {isExpired && '· (Deadline Expired)'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected assignment form */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              {currentAssignment ? (() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const currentSub = submissions.find(s => s.assignmentId === currentAssignment.id);
                const isCurrentExpired = !currentSub && currentAssignment.dueDate && currentAssignment.dueDate < todayStr;

                return (
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{currentAssignment.subjectCode}</span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          currentSub?.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : currentSub?.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : isCurrentExpired
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {currentSub?.status === 'graded' ? 'Graded' : currentSub?.status === 'submitted' ? 'Submitted' : isCurrentExpired ? 'Expired' : 'Pending Submission'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{currentAssignment.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Instructor: <strong>{currentAssignment.facultyName}</strong> · Due: <strong className={isCurrentExpired ? 'text-rose-600 dark:text-rose-400' : ''}>{currentAssignment.dueDate}</strong> · Max Marks: <strong>{currentAssignment.maxMarks}</strong>
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Instructions</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {currentAssignment.instructions || 'Review the lecture materials and syllabus guidelines, then upload your completed project or assignment solution file.'}
                      </p>
                    </div>

                    {currentSub ? (
                      <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Submission Uploaded
                          </span>
                          <span className="text-slate-500 font-normal">{currentSub.submittedAt}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>File: <strong>{currentSub.fileName}</strong> ({currentSub.fileSize || 'Attached'})</span>
                        </p>
                        {currentSub.status === 'graded' ? (
                          <div className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-900">
                            <p className="text-xs font-bold text-emerald-600">Marks Awarded: {currentSub.marksAwarded} / {currentAssignment.maxMarks}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{currentSub.facultyFeedback}"</p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Under evaluation by instructor.</p>
                        )}
                      </div>
                    ) : isCurrentExpired ? (
                      <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 space-y-2.5">
                        <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Submission Window Expired</span>
                        </div>
                        <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                          The official deadline for this assignment was <strong>{currentAssignment.dueDate}</strong>. The deadline has expired and submissions are now closed. If you require special accommodation, please contact your instructor <strong>{currentAssignment.facultyName}</strong>.
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-800 text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Expired (Past Due Date)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleAssignmentSubmit} className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Upload Submission</h4>
                        {submissionSuccess && (
                          <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{submissionSuccess}</span>
                          </div>
                        )}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/20 hover:bg-indigo-50/20 group"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                          />
                          <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Choose File
                            </button>
                            <p className="text-[11px] text-slate-400 mt-2">Click anywhere in this box or click "Choose File" to upload (PDF, DOCX, ZIP up to 15MB)</p>
                          </div>
                          {submissionFile && (
                            <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-2">
                              <FileText className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{submissionFile.name}</span>
                              <span className="text-[11px] text-emerald-600">({(submissionFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Submission Notes / Remarks (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Optional submission comments or notes for your instructor..."
                            value={submissionNotes}
                            onChange={(e) => setSubmissionNotes(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Submit Assignment
                        </button>
                      </form>
                    )}
                  </div>
                );
              })() : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Select an assignment from the left list.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // 4. TIMETABLE & STUDY MATERIALS (ONE PAGE WITH 3 TABS: CLASS TIMETABLE, EXAM TIMETABLE, MATERIALS)
  if (currentPage === 'timetable-materials') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Timetable & Study Materials
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Published weekly class schedules, verified semester examination dates, and faculty study materials.
          </p>
        </div>

        {/* 3 Tabs inside the SAME page */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 sm:mx-0 sm:px-0 gap-1">
          <button
            onClick={() => setTmTab('class')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              tmTab === 'class'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Class Timetable ({timetable.length})
          </button>
          <button
            onClick={() => setTmTab('exam')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              tmTab === 'exam'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Exam Timetable ({exams.length})
          </button>
          <button
            onClick={() => setTmTab('materials')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              tmTab === 'materials'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Course Study Materials ({materials.length})
          </button>
        </div>

        {/* Tab 1: Class Timetable */}
        {tmTab === 'class' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Weekly Class Timetable (Section {profile.section})
                </h3>
                <p className="text-xs text-slate-500">Official scheduled instructional and laboratory periods</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 w-fit">
                Cohort: {profile.departmentName} · Sem {profile.currentSemester} · {profile.section}
              </span>
            </div>

            {/* College Working Hours & Lunch Notice */}
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  College Operating Hours: 09:00 AM – 05:00 PM
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>Mandatory Lunch Break: <strong>12:00 PM – 01:00 PM</strong> (No Classes)</span>
              </div>
            </div>

            {timetable.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No class schedule published for your section yet.
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards (md:hidden) */}
                <div className="md:hidden space-y-3">
                  {timetable.map(slot => (
                    <div key={slot.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-[11px]">
                          {slot.dayOfWeek}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1.5">{slot.subjectCode}</span>
                          {slot.subjectName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                          <span>Faculty: {slot.facultyName}</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Room {slot.room}</span>
                        </div>
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
                        <th className="py-2.5 px-4 font-semibold text-right">Venue Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {timetable.map(slot => (
                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-semibold">{slot.dayOfWeek}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{slot.startTime} - {slot.endTime}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{slot.subjectCode}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{slot.facultyName}</td>
                          <td className="py-3 px-4 text-right font-medium">{slot.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Exam Timetable */}
        {tmTab === 'exam' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Official Examination Schedule
            </h3>

            {exams.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No examination dates published for Semester {profile.currentSemester} yet.
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards (md:hidden) */}
                <div className="md:hidden space-y-3">
                  {exams.map(ex => (
                    <div key={ex.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
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
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Hall: {ex.room}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Full Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[11px] border-y border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Exam Date</th>
                        <th className="py-2.5 px-4 font-semibold">Timeslot</th>
                        <th className="py-2.5 px-4 font-semibold">Subject Code</th>
                        <th className="py-2.5 px-4 font-semibold">Subject Title</th>
                        <th className="py-2.5 px-4 font-semibold">Hall</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {exams.map(ex => (
                        <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-semibold">{ex.examDate}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{ex.startTime} - {ex.endTime}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{ex.subjectCode}</td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{ex.subjectName}</td>
                          <td className="py-3 px-4 font-medium">{ex.room}</td>
                          <td className="py-3 px-4 text-right text-slate-500">{ex.examType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Materials */}
        {tmTab === 'materials' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Course Study Materials ({materials.length})
            </h3>

            {materials.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No courseware files published by your instructors yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map(mat => (
                  <div key={mat.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{mat.subjectCode}</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{mat.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mat.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{mat.fileSize || 'PDF'}</span>
                      <button
                        onClick={() => {}}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    );
  }

  // 5. NOTIFICATIONS
  if (currentPage === 'notifications') {
    return (
      <div className="space-y-6 max-w-4xl">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Student Announcements & Notices
        </h2>
        <p className="text-xs text-slate-500">
          Official notices published strictly for students by University Administration.
        </p>

        {announcements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            No active announcements for students.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ann.title}</h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {ann.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ann.message}</p>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
                  <span>From: {ann.publishedBy}</span>
                  <span>{ann.publishedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div>Student Page Not Found</div>;
};
