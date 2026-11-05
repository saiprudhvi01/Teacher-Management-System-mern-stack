import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  Users,
  BarChart3,
  Lightbulb,
  ExternalLink,
  Save,
  CheckCheck,
  CalendarCheck,
  UserCheck,
  FileSpreadsheet,
  LineChart,
  Megaphone,
  HelpCircle,
  Send,
  ListOrdered,
  Check,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  Layers,
  Timer
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  User,
  FacultyProfile,
  Subject,
  TimetableEntry,
  StudyMaterial,
  Assignment,
  Submission,
  Announcement,
  StudentProfile,
  InternalAssessment,
  AssessmentMarkEntry,
  OnlineExam,
  ExamQuestion,
  ExamResultsAnalytics
} from '../../types';
import { EduTrackApi, isMatchingSection } from '../../services/apiService';
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

interface FacultyPortalProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  searchQuery: string;
}

export const FacultyPortal: React.FC<FacultyPortalProps> = ({
  currentUser,
  currentPage,
  onNavigate,
  searchQuery
}) => {
  const [, setRefreshKey] = useState(0);

  const profile: FacultyProfile | null = EduTrackApi.getFacultyProfile(currentUser.id);
  const allFaculty = EduTrackApi.getAllFaculty();
  const allStudents = EduTrackApi.getAllStudents();
  const allUsers = EduTrackApi.getUsers();
  const allSections = EduTrackApi.getSections();

  const teachingAssignments = EduTrackApi.getTeachingAssignmentsSync(currentUser.id);
  const taSections = teachingAssignments.map(ta => ta.section).filter(Boolean);

  const deptSections = allSections.filter(s => !profile?.departmentId || s.departmentId === profile.departmentId).map(s => s.name);
  const rawFacultySections: string[] = [
    ...(profile?.assignedSections || []),
    ...taSections,
    ...deptSections
  ];

  const effectiveSections = Array.from(new Set(rawFacultySections.length > 0 ? rawFacultySections : ['CSE-A', 'CSE-B', 'CSE-C']));

  // Subjects assigned to this faculty by Admin (or available in department)
  const allSubjects = EduTrackApi.getSubjects();
  const assignedSubjects: Subject[] = allSubjects.filter(
    s => s.assignedFacultyId === currentUser.id ||
         (profile && s.assignedFacultyId === profile.id) ||
         teachingAssignments.some(ta => ta.subjectId === s.id) ||
         (profile?.departmentId && s.departmentId === profile.departmentId)
  );

  const timetable: TimetableEntry[] = EduTrackApi.getFacultyTimetable(currentUser.id);
  const materials: StudyMaterial[] = EduTrackApi.getStudyMaterials().filter(m => m.facultyId === currentUser.id);
  const assignments: Assignment[] = EduTrackApi.getAssignments().filter(a => a.facultyId === currentUser.id);
  const internalAssessments: InternalAssessment[] = EduTrackApi.getInternalAssessments(currentUser.id);
  const allSubmissions: Submission[] = EduTrackApi.getSubmissions();
  const facultySubmissions = allSubmissions.filter(s => assignments.some(a => a.id === s.assignmentId));
  const announcements: Announcement[] = EduTrackApi.getAnnouncements('FACULTY');

  // Enrolled students in cohorts and sections taught by this faculty member
  const facultyEnrolledStudents = allStudents.filter(std => {
    const deptMatch = profile?.departmentId
      ? std.departmentId === profile.departmentId
      : (assignedSubjects.length > 0 ? assignedSubjects.some(sub => sub.departmentId === std.departmentId) : true);
    const sectionMatch = effectiveSections.some(sec => isMatchingSection(std.section, sec));
    return deptMatch && sectionMatch;
  });

  const facultySectionNames = Array.from(new Set([
    ...effectiveSections,
    ...facultyEnrolledStudents.map(s => s.section)
  ])).filter(Boolean);

  const [enrolledSectionFilter, setEnrolledSectionFilter] = useState<string>('all');
  const [enrolledSearch, setEnrolledSearch] = useState<string>('');
  const [enrolledSubjectFilter, setEnrolledSubjectFilter] = useState<string>('all');

  // Attendance tab states
  const [attMatTab, setAttMatTab] = useState<'attendance' | 'materials'>('attendance');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(assignedSubjects[0]?.code || '');
  const [selectedSection, setSelectedSection] = useState<string>(effectiveSections[0] || 'CSE-A');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [studentAttendanceMap, setStudentAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [attendanceSavedMessage, setAttendanceSavedMessage] = useState<string | null>(null);

  // Material state
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialDesc, setNewMaterialDesc] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<'pdf' | 'notes' | 'presentation' | 'link'>('pdf');
  const [newMaterialSubject, setNewMaterialSubject] = useState(assignedSubjects[0]?.code || '');

  // Assignments, Exams & Marks tabs
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [aemTab, setAemTab] = useState<'assignments' | 'exams' | 'marks'>('assignments');
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newAsgTitle, setNewAsgTitle] = useState('');
  const [newAsgSubjectCode, setNewAsgSubjectCode] = useState(assignedSubjects[0]?.code || '');
  const [newAsgDeadline, setNewAsgDeadline] = useState(getDefaultDueDate());
  const [asgDateError, setAsgDateError] = useState<string | null>(null);
  const [newAsgMaxMarks, setNewAsgMaxMarks] = useState(50);
  const [newAsgInstructions, setNewAsgInstructions] = useState('');
  const [newAsgTopicTag, setNewAsgTopicTag] = useState('');

  // Grading modal state
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(40);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Internal test creation state
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestType, setNewTestType] = useState<'Quiz' | 'Unit Test' | 'Mid-Term CIA' | 'Lab Viva'>('Quiz');
  const [newTestSubject, setNewTestSubject] = useState(assignedSubjects[0]?.code || '');
  const [newTestSemester, setNewTestSemester] = useState<number>(assignedSubjects[0]?.semester || 6);
  const [newTestSection, setNewTestSection] = useState<string>(effectiveSections[0] || 'CSE-A');
  const [newTestMaxMarks, setNewTestMaxMarks] = useState(25);
  const [newTestDate, setNewTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTestTopicTag, setNewTestTopicTag] = useState('');

  // Online Examination state
  const [examSubTab, setExamSubTab] = useState<'internal' | 'online'>('internal');
  const [onlineExams, setOnlineExams] = useState<OnlineExam[]>(EduTrackApi.getOnlineExamsSync());
  const [showCreateExamModal, setShowCreateExamModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<OnlineExam | null>(null);
  const [showQuestionBuilderModal, setShowQuestionBuilderModal] = useState<boolean>(false);
  const [activeExamForQuestions, setActiveExamForQuestions] = useState<OnlineExam | null>(null);
  const [questionsDraft, setQuestionsDraft] = useState<ExamQuestion[]>([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<ExamResultsAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [examFormError, setExamFormError] = useState<string | null>(null);
  const [examPublishSuccess, setExamPublishSuccess] = useState<string | null>(null);

  useEffect(() => {
    return EduTrackApi.subscribe(() => {
      setRefreshKey(k => k + 1);
      EduTrackApi.getOnlineExams().then(exams => {
        if (exams) setOnlineExams(exams);
      }).catch(() => {
        setOnlineExams(EduTrackApi.getOnlineExamsSync());
      });
      if (showAnalyticsModal && activeExamForQuestions) {
        EduTrackApi.getOnlineExamResults(activeExamForQuestions.id).then(res => {
          if (res) setAnalyticsData(res);
        }).catch(() => {});
      }
    });
  }, [showAnalyticsModal, activeExamForQuestions]);

  useEffect(() => {
    EduTrackApi.getOnlineExams().then(exams => {
      if (exams) setOnlineExams(exams);
    }).catch(() => {});
  }, []);

  // Online Exam Form state
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examSubjectId, setExamSubjectId] = useState(assignedSubjects[0]?.id || 'sub_cs401');
  const [examSemester, setExamSemester] = useState<number>(assignedSubjects[0]?.semester || 6);
  const [examSection, setExamSection] = useState('All');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examStartTime, setExamStartTime] = useState('10:00');
  const [examEndTime, setExamEndTime] = useState('11:00');
  const [examDurationMinutes, setExamDurationMinutes] = useState(60);
  const [examTotalMarks, setExamTotalMarks] = useState(30);
  const [examPassMarks, setExamPassMarks] = useState(12);
  const [examNegativeMarking, setExamNegativeMarking] = useState<number>(0);
  const [examMaxAttempts, setExamMaxAttempts] = useState(1);
  const [examResultPublication, setExamResultPublication] = useState<'MANUAL_BY_FACULTY' | 'IMMEDIATE_ON_SUBMIT'>('MANUAL_BY_FACULTY');

  // Question Form state
  const [editingQIndex, setEditingQIndex] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qMarks, setQMarks] = useState(10);
  const [qNegMarks, setQNegMarks] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qFormError, setQFormError] = useState<string | null>(null);

  const handleOpenCreateExam = () => {
    setEditingExam(null);
    setExamTitle('');
    setExamDescription('Please read all instructions before starting. Choose one answer for each multiple-choice question. Tab switches and window closes are monitored for attendance.');
    const firstSub = assignedSubjects[0];
    setExamSubjectId(firstSub?.id || 'sub_cs401');
    setExamSemester(firstSub?.semester || 6);
    setExamSection('All');
    setExamDate(new Date().toISOString().split('T')[0]);
    setExamStartTime('10:00');
    setExamEndTime('11:00');
    setExamDurationMinutes(60);
    setExamTotalMarks(30);
    setExamPassMarks(12);
    setExamNegativeMarking(0);
    setExamMaxAttempts(1);
    setExamResultPublication('MANUAL_BY_FACULTY');
    setExamFormError(null);
    setShowCreateExamModal(true);
  };

  const handleEditExam = (exam: OnlineExam) => {
    setEditingExam(exam);
    setExamTitle(exam.title);
    setExamDescription(exam.description || '');
    setExamSubjectId(exam.subjectId);
    setExamSemester(exam.semester);
    setExamSection(exam.section);
    setExamDate(exam.examDate);
    setExamStartTime(exam.startTime);
    setExamEndTime(exam.endTime);
    setExamDurationMinutes(exam.durationMinutes);
    setExamTotalMarks(exam.totalMarks);
    setExamPassMarks(exam.passMarks);
    setExamNegativeMarking(exam.negativeMarking || 0);
    setExamMaxAttempts(exam.maxAttempts || 1);
    setExamResultPublication(exam.resultPublication || 'MANUAL_BY_FACULTY');
    setExamFormError(null);
    setShowCreateExamModal(true);
  };

  const handleSaveExamForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamFormError(null);

    const todayStr = new Date().toISOString().split('T')[0];
    if (!examDate || examDate < todayStr) {
      setExamFormError('Date is invalid: Examination date cannot be before today. Faculty can only set today or future dates.');
      alert('Date is invalid! Examination date cannot be before today. Faculty can only set today or future dates.');
      return;
    }

    const sub = allSubjects.find(s => s.id === examSubjectId) || assignedSubjects.find(s => s.id === examSubjectId);
    if (!sub) {
      setExamFormError('Please select a valid course subject.');
      return;
    }

    if (!examTitle.trim()) {
      setExamFormError('Examination title is required.');
      return;
    }

    if (examTotalMarks <= 0) {
      setExamFormError('Total marks must be greater than 0.');
      return;
    }

    if (examPassMarks > examTotalMarks) {
      setExamFormError('Pass marks cannot exceed total marks.');
      return;
    }

    const payload: Partial<OnlineExam> = {
      title: examTitle.trim(),
      description: examDescription.trim(),
      departmentId: sub.departmentId || profile?.departmentId || 'dept_cse',
      departmentName: sub.departmentId === 'dept_cse' ? 'Computer Science & Engineering' : 'Electronics & Communication',
      subjectId: sub.id,
      subjectCode: sub.code,
      subjectName: sub.name,
      semester: Number(examSemester),
      section: examSection,
      examDate,
      startTime: examStartTime,
      endTime: examEndTime,
      durationMinutes: Number(examDurationMinutes),
      totalMarks: Number(examTotalMarks),
      passMarks: Number(examPassMarks),
      negativeMarking: Number(examNegativeMarking || 0),
      maxAttempts: Number(examMaxAttempts || 1),
      resultPublication: examResultPublication
    };

    try {
      if (editingExam) {
        const updated = await EduTrackApi.updateOnlineExam(editingExam.id, payload);
        setOnlineExams(prev => prev.map(e => e.id === updated.id ? updated : e));
        setShowCreateExamModal(false);
      } else {
        const created = await EduTrackApi.createOnlineExam({
          ...payload,
          facultyId: currentUser.id,
          facultyName: currentUser.name,
          status: 'DRAFT',
          questions: [],
          resultsReleased: false
        }, currentUser.name);
        setOnlineExams(prev => [created, ...prev.filter(e => e.id !== created.id)]);
        setShowCreateExamModal(false);
        // Automatically open Question Builder for newly created exam
        handleOpenQuestionBuilder(created);
      }
    } catch (err: any) {
      setExamFormError(err.message || 'Failed to save online examination.');
    }
  };

  const handleOpenQuestionBuilder = (exam: OnlineExam) => {
    setActiveExamForQuestions(exam);
    const normalizedQs = (exam.questions || []).map((q: any) => ({
      ...q,
      options: normalizeQuestionOptions(q.options)
    }));
    setQuestionsDraft(normalizedQs);
    setEditingQIndex(null);
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect('A');
    setQMarks(10);
    setQNegMarks(exam.negativeMarking || 0);
    setQExplanation('');
    setQFormError(null);
    setShowQuestionBuilderModal(true);
  };

  const handleAddOrUpdateQuestion = () => {
    if (!qText.trim()) {
      setQFormError('Question text cannot be empty.');
      return;
    }
    if (!qOptA.trim() || !qOptB.trim() || !qOptC.trim() || !qOptD.trim()) {
      setQFormError('All four options (A, B, C, D) are required.');
      return;
    }
    if (qMarks <= 0) {
      setQFormError('Marks for this question must be greater than 0.');
      return;
    }

    setQFormError(null);

    const qItem: ExamQuestion = {
      id: editingQIndex !== null ? questionsDraft[editingQIndex].id : `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionNumber: editingQIndex !== null ? questionsDraft[editingQIndex].questionNumber : questionsDraft.length + 1,
      questionText: qText.trim(),
      options: [
        { key: 'A', text: qOptA.trim() },
        { key: 'B', text: qOptB.trim() },
        { key: 'C', text: qOptC.trim() },
        { key: 'D', text: qOptD.trim() }
      ],
      correctAnswer: qCorrect,
      marks: Number(qMarks),
      negativeMarks: Number(qNegMarks || 0),
      explanation: qExplanation.trim()
    };

    if (editingQIndex !== null) {
      const updated = [...questionsDraft];
      updated[editingQIndex] = qItem;
      setQuestionsDraft(updated);
      setEditingQIndex(null);
    } else {
      setQuestionsDraft([...questionsDraft, qItem]);
    }

    // Reset question inputs for next entry
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect('A');
    setQMarks(10);
    setQNegMarks(activeExamForQuestions?.negativeMarking || 0);
    setQExplanation('');
  };

  const handleEditQuestionInDraft = (idx: number) => {
    const q = questionsDraft[idx];
    if (!q) return;
    setEditingQIndex(idx);
    setQText(q.questionText);
    const opts = normalizeQuestionOptions(q.options);
    setQOptA(opts.find(o => o.key === 'A')?.text || '');
    setQOptB(opts.find(o => o.key === 'B')?.text || '');
    setQOptC(opts.find(o => o.key === 'C')?.text || '');
    setQOptD(opts.find(o => o.key === 'D')?.text || '');
    setQCorrect(q.correctAnswer);
    setQMarks(q.marks);
    setQNegMarks(q.negativeMarks || 0);
    setQExplanation(q.explanation || '');
    setQFormError(null);
  };

  const handleDeleteQuestion = (idx: number) => {
    const filtered = questionsDraft.filter((_, i) => i !== idx).map((q, i) => ({
      ...q,
      questionNumber: i + 1
    }));
    setQuestionsDraft(filtered);
    if (editingQIndex === idx) {
      setEditingQIndex(null);
      setQText('');
    }
  };

  const handleReorderQuestion = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questionsDraft.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...questionsDraft];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    const normalized = reordered.map((q, i) => ({ ...q, questionNumber: i + 1 }));
    setQuestionsDraft(normalized);
  };

  const handleSaveQuestionsDraft = async () => {
    if (!activeExamForQuestions) return;
    try {
      const updated = await EduTrackApi.updateOnlineExam(activeExamForQuestions.id, {
        questions: questionsDraft
      });
      setActiveExamForQuestions(updated);
      setOnlineExams(prev => prev.map(e => e.id === updated.id ? updated : e));
      setShowQuestionBuilderModal(false);
    } catch (err: any) {
      setQFormError(err.message || 'Failed to save question bank.');
    }
  };

  const handlePublishFromBuilder = async () => {
    if (!activeExamForQuestions) return;
    const sumMarks = questionsDraft.reduce((acc, q) => acc + (q.marks || 0), 0);
    if (questionsDraft.length === 0) {
      setQFormError('Cannot publish examination with 0 questions. Add at least one question.');
      return;
    }
    if (sumMarks !== activeExamForQuestions.totalMarks) {
      setQFormError(`Total marks of questions (${sumMarks}) does not match configured exam total marks (${activeExamForQuestions.totalMarks}). Please adjust question marks.`);
      return;
    }

    try {
      await EduTrackApi.updateOnlineExam(activeExamForQuestions.id, { questions: questionsDraft });
      const published = await EduTrackApi.publishOnlineExam(activeExamForQuestions.id);
      setOnlineExams(prev => prev.map(e => e.id === published.id ? published : e));
      setShowQuestionBuilderModal(false);
      setExamPublishSuccess(`Online Examination "${published.title}" has been successfully published to ${published.section} (Sem ${published.semester})!`);
      setTimeout(() => setExamPublishSuccess(null), 5000);
    } catch (err: any) {
      setQFormError(err.message || 'Failed to publish examination.');
    }
  };

  const handlePublishExamCard = async (exam: OnlineExam) => {
    const questions = exam.questions || [];
    const sumMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
    if (questions.length === 0) {
      alert('This exam has no questions yet. Please click "Questions & Editor" to add questions before publishing.');
      return;
    }
    if (sumMarks !== exam.totalMarks) {
      alert(`Question marks sum (${sumMarks}) does not match exam total marks (${exam.totalMarks}). Please open "Questions & Editor" to align.`);
      return;
    }

    try {
      const published = await EduTrackApi.publishOnlineExam(exam.id);
      setOnlineExams(prev => prev.map(e => e.id === published.id ? published : e));
      setExamPublishSuccess(`Examination "${published.title}" is now PUBLISHED and live for Section ${published.section}!`);
      setTimeout(() => setExamPublishSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to publish examination.');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this online examination and all its records?')) return;
    try {
      await EduTrackApi.deleteOnlineExam(examId);
      setOnlineExams(prev => prev.filter(e => e.id !== examId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete online examination.');
    }
  };

  const handleOpenAnalytics = async (exam: OnlineExam) => {
    setActiveExamForQuestions(exam);
    setAnalyticsLoading(true);
    setShowAnalyticsModal(true);
    try {
      const data = await EduTrackApi.getOnlineExamResults(exam.id);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleReleaseResultsAction = async (examId: string) => {
    try {
      const updated = await EduTrackApi.releaseOnlineExamResults(examId);
      setOnlineExams(prev => prev.map(e => e.id === updated.id ? updated : e));
      if (analyticsData) {
        setAnalyticsData({
          ...analyticsData,
          exam: { ...analyticsData.exam, resultsReleased: true }
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to release results.');
    }
  };

  // Marks entry state
  const [activeAssessmentForMarks, setActiveAssessmentForMarks] = useState<InternalAssessment | null>(null);
  const [marksEntryMap, setMarksEntryMap] = useState<Record<string, number>>({});
  const [marksSectionFilter, setMarksSectionFilter] = useState<string>('all');
  const [marksSubjectCode, setMarksSubjectCode] = useState<string>(assignedSubjects[0]?.code || 'CS401');
  const [marksSearchQuery, setMarksSearchQuery] = useState<string>('');
  const [marksSavedMessage, setMarksSavedMessage] = useState<string | null>(null);
  const [analyticsSectionFilter, setAnalyticsSectionFilter] = useState<string>('all');

  const getExistingMarkForStudent = (studentId: string, subjectCode: string): number | '' => {
    const results = EduTrackApi.getStudentResults(studentId);
    for (const res of results) {
      const grd = res.grades?.find(g => g.subjectCode === subjectCode || g.subjectId === `sub_${subjectCode}`);
      if (grd && typeof grd.totalMarks === 'number') {
        return grd.totalMarks;
      }
    }
    return '';
  };

  const handleSaveSubjectMarks = (targetStudentId?: string) => {
    const sub = assignedSubjects.find(s => s.code === marksSubjectCode) || allSubjects.find(s => s.code === marksSubjectCode);
    const subCode = sub ? sub.code : marksSubjectCode;
    const subName = sub ? sub.name : marksSubjectCode;
    const sem = sub ? sub.semester : 6;

    const subjectCohortStudents = allStudents.filter(std => {
      const deptMatch = sub ? std.departmentId === sub.departmentId : true;
      const semMatch = sub?.semester ? std.currentSemester === sub.semester : true;
      return deptMatch || semMatch;
    });

    const baseStudents = subjectCohortStudents.length > 0 ? subjectCohortStudents : allStudents;
    const studentsToSave = targetStudentId
      ? allStudents.filter(s => s.id === targetStudentId)
      : baseStudents.filter(s => marksSectionFilter === 'all' || isMatchingSection(s.section, marksSectionFilter));

    if (studentsToSave.length === 0) {
      alert('No students selected to record marks.');
      return;
    }

    const entries = studentsToSave.map(std => {
      const u = allUsers.find(user => user.id === std.userId);
      const existing = getExistingMarkForStudent(std.id, subCode);
      const entered = marksEntryMap[std.id];
      const finalMarks = entered !== undefined ? Number(entered) : (typeof existing === 'number' ? existing : 75);

      return {
        studentId: std.id,
        studentName: u ? u.name : 'Student',
        rollNumber: std.rollNumber,
        marksObtained: Math.max(0, Math.min(100, finalMarks))
      };
    });

    EduTrackApi.recordSubjectMarks({
      subjectId: sub ? sub.id : `sub_${subCode}`,
      subjectCode: subCode,
      subjectName: subName,
      semester: sem,
      entries,
      facultyName: currentUser.name
    });

    setMarksSavedMessage(`Successfully recorded and published marks (out of 100) for ${entries.length} student(s) in ${subCode}! These marks now reflect in the Student Portal.`);
    setTimeout(() => setMarksSavedMessage(null), 6000);
  };

  // Handlers
  const handleSaveAttendance = () => {
    if (!selectedSubjectCode) {
      alert('Please select an assigned subject.');
      return;
    }

    const sub = assignedSubjects.find(s => s.code === selectedSubjectCode);
    const enrolledStudents = allStudents.filter(
      s => sub
        ? (s.departmentId === sub.departmentId && s.currentSemester === sub.semester && (selectedSection === 'all' || isMatchingSection(s.section, selectedSection)))
        : (s.departmentId === profile?.departmentId && (selectedSection === 'all' || isMatchingSection(s.section, selectedSection)))
    );

    if (enrolledStudents.length === 0) {
      alert(`No enrolled students found in ${sub?.code || 'Course'} Section ${selectedSection === 'all' ? 'All' : selectedSection}.`);
      return;
    }

    const records = enrolledStudents.map(std => {
      const user = allUsers.find(u => u.id === std.userId);
      const status = studentAttendanceMap[std.id] || 'present';
      return {
        studentId: std.id,
        studentName: user ? user.name : 'Student',
        rollNumber: std.rollNumber,
        status
      };
    });

    EduTrackApi.recordAttendanceSession({
      subjectId: sub ? sub.id : `sub_${selectedSubjectCode}`,
      subjectCode: selectedSubjectCode,
      departmentId: sub ? sub.departmentId : '',
      semester: sub ? sub.semester : 1,
      section: selectedSection,
      date: selectedDate,
      timeSlot: 'Regular Period',
      facultyId: currentUser.id,
      records
    }, currentUser.name);

    setAttendanceSavedMessage(`Attendance session saved for ${selectedSubjectCode} (${records.length} students recorded).`);
    setTimeout(() => setAttendanceSavedMessage(null), 4000);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgTitle.trim() || !newAsgSubjectCode) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (!newAsgDeadline || newAsgDeadline < todayStr) {
      setAsgDateError('Date is invalid: Due date cannot be in the past. Faculty must select today or a future date.');
      alert('Date is invalid! Assignment due date cannot be before today. Please select today or a future date.');
      return;
    }

    const sub = assignedSubjects.find(s => s.code === newAsgSubjectCode);

    EduTrackApi.createAssignment({
      title: newAsgTitle.trim(),
      subjectId: sub ? sub.id : `sub_${newAsgSubjectCode}`,
      subjectCode: newAsgSubjectCode,
      subjectName: sub ? sub.name : newAsgSubjectCode,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      semester: sub ? sub.semester : 1,
      section: 'A',
      instructions: newAsgInstructions.trim(),
      dueDate: newAsgDeadline,
      maxMarks: newAsgMaxMarks,
      topicTag: newAsgTopicTag.trim() || undefined
    });

    setShowCreateAssignment(false);
    setNewAsgTitle('');
    setNewAsgInstructions('');
    setAsgDateError(null);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    EduTrackApi.gradeSubmission(
      gradingSubmission.id,
      gradeMarks,
      gradeFeedback.trim(),
      currentUser.name
    );

    setGradingSubmission(null);
    setGradeFeedback('');
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialTitle.trim() || !newMaterialSubject) return;

    const sub = assignedSubjects.find(s => s.code === newMaterialSubject);

    EduTrackApi.addStudyMaterial({
      subjectId: sub ? sub.id : `sub_${newMaterialSubject}`,
      subjectCode: newMaterialSubject,
      subjectName: sub ? sub.name : newMaterialSubject,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      title: newMaterialTitle.trim(),
      description: newMaterialDesc.trim(),
      type: newMaterialType,
      fileSize: '2.4 MB',
      url: `#download-${Date.now()}`,
      semester: sub ? sub.semester : 1
    });

    setNewMaterialTitle('');
    setNewMaterialDesc('');
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim() || !newTestSubject) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (!newTestDate || newTestDate < todayStr) {
      alert('Date is invalid! Assessment date cannot be before today. You can only set today or future dates.');
      return;
    }

    const sub = assignedSubjects.find(s => s.code === newTestSubject || s.id === newTestSubject);

    EduTrackApi.createInternalAssessment({
      subjectId: sub ? sub.id : `sub_${newTestSubject}`,
      subjectCode: sub ? sub.code : newTestSubject,
      subjectName: sub ? sub.name : newTestSubject,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      departmentId: sub ? sub.departmentId : (profile?.departmentId || 'dept_cse'),
      semester: Number(newTestSemester),
      section: newTestSection,
      title: newTestTitle.trim(),
      type: newTestType,
      date: newTestDate,
      maxMarks: newTestMaxMarks,
      topicTag: newTestTopicTag.trim() || undefined,
      isPublished: true
    }, currentUser.name);

    setShowCreateTest(false);
    setNewTestTitle('');
  };

  const handleSaveAssessmentMarks = () => {
    if (!activeAssessmentForMarks) return;

    const enrolledStudents = allStudents.filter(
      s => (!activeAssessmentForMarks.departmentId || s.departmentId === activeAssessmentForMarks.departmentId) &&
           (!activeAssessmentForMarks.semester || s.currentSemester === activeAssessmentForMarks.semester)
    );

    const entries: AssessmentMarkEntry[] = enrolledStudents.map(std => {
      const u = allUsers.find(user => user.id === std.userId);
      return {
        id: `me_${Date.now()}_${std.id}`,
        assessmentId: activeAssessmentForMarks.id,
        studentId: std.id,
        studentName: u ? u.name : 'Student',
        rollNumber: std.rollNumber,
        marksObtained: marksEntryMap[std.id] !== undefined ? marksEntryMap[std.id] : 0,
        maxMarks: activeAssessmentForMarks.maxMarks,
        updatedAt: new Date().toISOString()
      };
    });

    EduTrackApi.saveAssessmentMarks(activeAssessmentForMarks.id, entries, currentUser.name);
    setActiveAssessmentForMarks(null);
  };

  // 1. DASHBOARD
  if (currentPage === 'dashboard') {
    const pendingGradingCount = facultySubmissions.filter(s => s.status === 'submitted').length;
    const enrolledStudentsInMySubjects = allStudents.filter(std =>
      assignedSubjects.some(sub => sub.departmentId === std.departmentId && sub.semester === std.currentSemester)
    );
    const studentsNeedingHelp = enrolledStudentsInMySubjects.filter(s => s.attendancePercentage < 75);

    return (
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 lg:p-8 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-indigo-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider">
                  {profile ? `${profile.designation} · ${profile.departmentName}` : 'Faculty Member'}
                </span>
                {profile?.isHOD && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950 tracking-wider shadow-xs uppercase">
                    Head of Department (HOD)
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight break-words">
                Faculty Workspace: {currentUser.name}
              </h1>
              <p className="mt-1 text-slate-300 text-xs sm:text-sm max-w-xl">
                Employee ID: <span className="font-mono text-white">{profile?.employeeId || 'Assigned by Admin'}</span> · 
                Room: <span className="text-slate-300">{profile?.officeRoom || 'Academic Block'}</span>
                {effectiveSections.length > 0 && (
                  <span> · Assigned Sections: <span className="text-indigo-200 font-bold">{effectiveSections.join(', ')}</span></span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
              <button
                onClick={() => {
                  onNavigate('attendance-materials');
                  setAttMatTab('attendance');
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm min-h-[44px] sm:min-h-0 flex items-center justify-center"
              >
                Record Attendance
              </button>
              <button
                onClick={() => onNavigate('assignments-exams-marks')}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 sm:py-2 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm border border-white/10 transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center"
              >
                Grade Submissions ({pendingGradingCount})
              </button>
            </div>
          </div>
        </div>

        {/* Real KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Assigned Subjects</span>
              <BookOpen className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {assignedSubjects.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {assignedSubjects.length === 0 ? 'Awaiting subject assignment by Admin' : assignedSubjects.map(s => s.code).join(', ')}
            </p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Scheduled Class Periods</span>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {timetable.length}
            </div>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              Weekly periods configured
            </p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Submissions Pending Grading</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {pendingGradingCount}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Student tasks awaiting review
            </p>
          </Card3D>

          <Card3D className="p-5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
              <span>Students Requiring Support</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {studentsNeedingHelp.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Attendance &lt; 75% in assigned courses
            </p>
          </Card3D>
        </div>

        {/* Enrolled Students Section-Wise Overview */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Enrolled Students (Section-Wise)
              </h3>
              <p className="text-xs text-slate-500">Student enrollment and attendance compliance across your teaching cohorts</p>
            </div>
            <button
              onClick={() => onNavigate('enrolled-students')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              View Full Student Directory →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {facultySectionNames.map(secName => {
              const secStudents = facultyEnrolledStudents.filter(std => isMatchingSection(std.section, secName));
              const secInfo = allSections.find(s => isMatchingSection(secName, s.name, s.sectionCode));
              const capacity = secInfo?.capacity || 60;
              const pct = Math.round((secStudents.length / capacity) * 100);
              const avgAtt = secStudents.length > 0
                ? Math.round(secStudents.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / secStudents.length)
                : 0;

              return (
                <div
                  key={secName}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  onClick={() => {
                    setEnrolledSectionFilter(secName);
                    onNavigate('enrolled-students');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      Section {secName}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      {secStudents.length} Students
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Capacity: {secStudents.length} / {capacity}</span>
                      <span>Avg Att: <strong className={avgAtt < 75 ? 'text-rose-600' : 'text-emerald-600'}>{avgAtt}%</strong></span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teaching Timetable Snapshot */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Teaching Schedule Snapshot</h3>
              <p className="text-xs text-slate-500">Official weekly class timetable assigned by Admin</p>
            </div>
            <button
              onClick={() => onNavigate('faculty-timetable')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Full Subjects & Syllabus
            </button>
          </div>

          {timetable.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No class timetable slots scheduled by Admin for your account yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {timetable.map(slot => (
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

      </div>
    );
  }

  // ENROLLED STUDENTS DIRECTORY (SECTION-WISE)
  if (currentPage === 'enrolled-students') {
    const subjectFilteredStudents = enrolledSubjectFilter === 'all'
      ? facultyEnrolledStudents
      : facultyEnrolledStudents.filter(std => {
          const sub = assignedSubjects.find(s => s.code === enrolledSubjectFilter);
          return sub ? (sub.departmentId === std.departmentId && sub.semester === std.currentSemester) : true;
        });

    const searchFilteredStudents = subjectFilteredStudents.filter(std => {
      const u = allUsers.find(user => user.id === std.userId);
      const q = (enrolledSearch || searchQuery || '').toLowerCase().trim();
      if (!q) return true;
      return (
        std.rollNumber.toLowerCase().includes(q) ||
        (std.registrationNumber && std.registrationNumber.toLowerCase().includes(q)) ||
        (u?.name && u.name.toLowerCase().includes(q)) ||
        (u?.email && u.email.toLowerCase().includes(q)) ||
        std.section.toLowerCase().includes(q)
      );
    });

    const studentsBySection: Record<string, StudentProfile[]> = {};
    facultySectionNames.forEach(secName => {
      studentsBySection[secName] = searchFilteredStudents.filter(std =>
        isMatchingSection(std.section, secName)
      );
    });

    const matchedStudentIds = new Set(Object.values(studentsBySection).flat().map(s => s.id));
    const otherStudents = searchFilteredStudents.filter(std => !matchedStudentIds.has(std.id));
    if (otherStudents.length > 0) {
      studentsBySection['Other Sections'] = otherStudents;
    }

    const displayedSections = enrolledSectionFilter === 'all'
      ? Object.keys(studentsBySection)
      : Object.keys(studentsBySection).filter(secName => secName === enrolledSectionFilter);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Enrolled Students Directory (Section-Wise)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete student rosters organized section-wise across your assigned academic cohorts and courses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onNavigate('attendance-materials');
                setAttMatTab('attendance');
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              onClick={() => onNavigate('assignments-exams-marks')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              View Marks
            </button>
          </div>
        </div>

        {/* Section Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card3D className="p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Total Enrolled Students</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {facultyEnrolledStudents.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across all teaching sections</p>
          </Card3D>
          <Card3D className="p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Teaching Sections</div>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {facultySectionNames.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{facultySectionNames.join(', ')}</p>
          </Card3D>
          <Card3D className="p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Overall Avg. Attendance</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {facultyEnrolledStudents.length > 0
                ? Math.round(facultyEnrolledStudents.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / facultyEnrolledStudents.length)
                : 0}%
            </div>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">Recorded across live sessions</p>
          </Card3D>
          <Card3D className="p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Low Attendance Alert (&lt; 75%)</div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              {facultyEnrolledStudents.filter(s => (s.attendancePercentage || 0) < 75).length}
            </div>
            <p className="text-[11px] text-rose-500 mt-1 font-medium">Requires academic intervention</p>
          </Card3D>
        </div>

        {/* Filters & Section Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Section Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Section:</span>
              <button
                type="button"
                onClick={() => setEnrolledSectionFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  enrolledSectionFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Sections (Section-Wise) ({searchFilteredStudents.length})
              </button>
              {facultySectionNames.map(secName => {
                const count = (studentsBySection[secName] || []).length;
                return (
                  <button
                    key={secName}
                    type="button"
                    onClick={() => setEnrolledSectionFilter(secName)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                      enrolledSectionFilter === secName
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Section {secName} ({count})
                  </button>
                );
              })}
            </div>

            {/* Subject Selector & Search */}
            <div className="flex items-center gap-2">
              <select
                value={enrolledSubjectFilter}
                onChange={(e) => setEnrolledSubjectFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-medium"
              >
                <option value="all">All Assigned Subjects</option>
                {assignedSubjects.map(s => (
                  <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter student / roll..."
                  value={enrolledSearch}
                  onChange={(e) => setEnrolledSearch(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none w-44"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section-Wise Student Display */}
        {searchFilteredStudents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No students match your criteria</p>
            <p>Ensure students are enrolled in your assigned department and semester cohorts.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayedSections.map(secName => {
              const secStudents = studentsBySection[secName] || [];
              const secSecInfo = allSections.find(s => isMatchingSection(secName, s.name, s.sectionCode));
              const capacity = secSecInfo?.capacity || 60;
              const avgAtt = secStudents.length > 0
                ? Math.round(secStudents.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / secStudents.length)
                : 0;

              return (
                <div
                  key={secName}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
                >
                  {/* Section Group Header */}
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center font-mono text-sm border border-indigo-200 dark:border-indigo-800">
                        {secName.split('-').pop() || secName}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Section {secName}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-mono">
                            {profile?.departmentName || 'Engineering'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Enrolled Strength: <strong className="text-slate-800 dark:text-slate-200">{secStudents.length}</strong> / {capacity} · Section Avg Attendance: <strong className={avgAtt < 75 ? 'text-rose-600' : 'text-emerald-600'}>{avgAtt}%</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedSection(secName);
                          onNavigate('attendance-materials');
                          setAttMatTab('attendance');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Take Section Attendance
                      </button>
                    </div>
                  </div>

                  {/* Section Students Table */}
                  {secStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No students currently enrolled in Section {secName}.
                    </div>
                  ) : (
                    <>
                      {/* Mobile View */}
                      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {secStudents.map(std => {
                          const u = allUsers.find(user => user.id === std.userId);
                          const att = std.attendancePercentage || 0;
                          return (
                            <div key={std.id} className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                  {std.rollNumber}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    att >= 85
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                      : att >= 75
                                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  {att}% Att.
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                                {u?.name || 'Student'}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-mono">{u?.email || 'N/A'}</p>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <span>Sem {std.currentSemester} · Section {std.section}</span>
                                <span>CGPA: <strong className="text-slate-800 dark:text-slate-200">{std.cgpa ? std.cgpa.toFixed(2) : 'N/A'}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Register / Roll No</th>
                              <th className="py-2.5 px-4 font-semibold">Student Name</th>
                              <th className="py-2.5 px-4 font-semibold">Email</th>
                              <th className="py-2.5 px-4 font-semibold">Semester</th>
                              <th className="py-2.5 px-4 font-semibold">Section</th>
                              <th className="py-2.5 px-4 font-semibold">Attendance</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Academic CGPA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {secStudents.map(std => {
                              const u = allUsers.find(user => user.id === std.userId);
                              const att = std.attendancePercentage || 0;
                              return (
                                <tr key={std.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                    {std.rollNumber}
                                  </td>
                                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                                    {u?.name || 'Student'}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                    {u?.email || 'N/A'}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                                    Semester {std.currentSemester}
                                  </td>
                                  <td className="py-3 px-4 font-mono">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                      {std.section}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${
                                            att >= 85 ? 'bg-emerald-500' : att >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                                          }`}
                                          style={{ width: `${Math.min(100, att)}%` }}
                                        />
                                      </div>
                                      <span
                                        className={`font-mono font-bold text-[11px] ${
                                          att >= 85 ? 'text-emerald-600' : att >= 75 ? 'text-amber-600' : 'text-rose-600'
                                        }`}
                                      >
                                        {att}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {std.cgpa ? std.cgpa.toFixed(2) : '—'}
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
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 2. FACULTY TIMETABLE & SUBJECTS (ONE PAGE)
  if (currentPage === 'faculty-timetable') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Faculty Timetable & Subjects
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official teaching timetable and curriculum subjects assigned by Institutional Administration.
          </p>
        </div>

        {/* Assigned Subjects */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Assigned Teaching Subjects ({assignedSubjects.length})
          </h3>

          {assignedSubjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No subjects currently assigned to your account. The Academic Administrator assigns faculty in "Departments & Subjects".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedSubjects.map(sub => (
                <div key={sub.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{sub.code}</span>
                    <span className="text-[11px] font-semibold text-slate-500">{sub.credits} Credits · Sem {sub.semester}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</h4>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Syllabus Units:</span>
                    <ul className="mt-1 space-y-1 text-slate-500 text-[11px]">
                      {sub.syllabus.map((unit, idx) => (
                        <li key={idx}>• {unit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Timetable */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Official Instructional Timetable
          </h3>

          {timetable.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No teaching periods scheduled. Timetable slots are configured by Administration in "Class Timetable".
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
                        <span>Cohort: Sem {slot.semester} ({slot.section})</span>
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
                      <th className="py-2.5 px-4 font-semibold">Period Timeslot</th>
                      <th className="py-2.5 px-4 font-semibold">Course Code</th>
                      <th className="py-2.5 px-4 font-semibold">Course Title</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Venue Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {timetable.map(slot => (
                      <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{slot.dayOfWeek}</td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">{slot.startTime} - {slot.endTime}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{slot.subjectCode}</td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{slot.subjectName}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">{slot.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>
    );
  }

  // 3. ATTENDANCE & STUDY MATERIALS (ONE PAGE WITH 2 TABS)
  if (currentPage === 'attendance-materials') {
    const activeSub = assignedSubjects.find(s => s.code === selectedSubjectCode);
    const cohortStudents = activeSub
      ? allStudents
          .filter(s =>
            s.departmentId === activeSub.departmentId &&
            s.currentSemester === activeSub.semester &&
            (selectedSection === 'all' || isMatchingSection(s.section, selectedSection))
          )
          .sort((a, b) => a.section.localeCompare(b.section) || a.rollNumber.localeCompare(b.rollNumber))
      : [];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Attendance Sessions & Study Materials
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Conduct live attendance sessions with immediate persistence and distribute authorized curriculum study materials.
          </p>
        </div>

        {/* 2 Tabs */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 sm:mx-0 sm:px-0 gap-1">
          <button
            onClick={() => setAttMatTab('attendance')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              attMatTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Mark Student Attendance
          </button>
          <button
            onClick={() => setAttMatTab('materials')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              attMatTab === 'materials'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Course Materials ({materials.length})
          </button>
        </div>

        {/* Tab 1: Attendance Marking */}
        {attMatTab === 'attendance' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-auto">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assigned Subject</label>
                  <select
                    value={selectedSubjectCode}
                    onChange={(e) => setSelectedSubjectCode(e.target.value)}
                    className="w-full sm:w-auto py-2 sm:py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium min-h-[42px] sm:min-h-0"
                  >
                    {assignedSubjects.length === 0 ? (
                      <option value="">No subjects assigned</option>
                    ) : (
                      assignedSubjects.map(s => (
                        <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Multi-Section Switcher */}
                <div className="w-full sm:w-auto">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Teaching Section</label>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedSection('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        selectedSection === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      All Sections (Section-Wise)
                    </button>
                    {effectiveSections.map(secName => (
                      <button
                        key={secName}
                        type="button"
                        onClick={() => setSelectedSection(secName)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                          selectedSection === secName
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {secName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Session Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto py-2 sm:py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium min-h-[42px] sm:min-h-0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <button
                  onClick={() => {
                    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
                    cohortStudents.forEach(s => {
                      updated[s.id] = 'present';
                    });
                    setStudentAttendanceMap(updated);
                  }}
                  className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-0"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Mark All Present
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-sm min-h-[42px] sm:min-h-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save to Database
                </button>
              </div>
            </div>

            {attendanceSavedMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{attendanceSavedMessage}</span>
              </div>
            )}

            {cohortStudents.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No students enrolled in this cohort</p>
                <p>Students enrolled in this department and semester will appear here automatically.</p>
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards (md:hidden) */}
                <div className="md:hidden space-y-3">
                  {cohortStudents.map(std => {
                    const user = allUsers.find(u => u.id === std.userId);
                    const currentStatus = studentAttendanceMap[std.id] || 'present';

                    return (
                      <div key={std.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{std.rollNumber}</span>
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">{user?.name || 'Student'}</h4>
                          </div>
                          <span className="text-[11px] text-slate-500">Sem {std.currentSemester} ({std.section})</span>
                        </div>

                        {/* Large Touch Buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <button
                            type="button"
                            onClick={() => setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'present' }))}
                            className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[40px] flex items-center justify-center ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'late' }))}
                            className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[40px] flex items-center justify-center ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'absent' }))}
                            className={`py-2 text-xs font-bold rounded-lg transition-colors min-h-[40px] flex items-center justify-center ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Full Table (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-[11px] border-y border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Roll Number</th>
                        <th className="py-2.5 px-4 font-semibold">Student Name</th>
                        <th className="py-2.5 px-4 font-semibold">Cohort</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Attendance Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cohortStudents.map(std => {
                        const user = allUsers.find(u => u.id === std.userId);
                        const currentStatus = studentAttendanceMap[std.id] || 'present';

                        return (
                          <tr key={std.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{std.rollNumber}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{user?.name || 'Student'}</td>
                            <td className="py-2.5 px-4 text-slate-500">Sem {std.currentSemester} (Sec {std.section})</td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                                <button
                                  onClick={() => setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'present' }))}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${currentStatus === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'late' }))}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${currentStatus === 'late' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                  Late
                                </button>
                                <button
                                  onClick={() => setStudentAttendanceMap(prev => ({ ...prev, [std.id]: 'absent' }))}
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded ${currentStatus === 'absent' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
                                >
                                  Absent
                                </button>
                              </div>
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

        {/* Tab 2: Study Materials */}
        {attMatTab === 'materials' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Course Material</h3>
              <form onSubmit={handleAddMaterial} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <select
                      value={newMaterialSubject}
                      onChange={(e) => setNewMaterialSubject(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      {assignedSubjects.map(s => (
                        <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                    <select
                      value={newMaterialType}
                      onChange={(e) => setNewMaterialType(e.target.value as any)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="pdf">PDF Lecture Notes</option>
                      <option value="notes">Annotated Notes</option>
                      <option value="presentation">Slide Deck</option>
                      <option value="link">Research Article</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 1: Foundations & Algorithmic Models"
                    value={newMaterialTitle}
                    onChange={(e) => setNewMaterialTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Topic overview and learning goals..."
                    value={newMaterialDesc}
                    onChange={(e) => setNewMaterialDesc(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Publish Material
                </button>
              </form>
            </div>

            {/* List of uploaded materials */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Published Course Materials ({materials.length})
              </h3>

              {materials.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No materials published for your classes yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {materials.map(mat => (
                    <div key={mat.id} className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{mat.subjectCode}</span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{mat.title}</h4>
                        <p className="text-[11px] text-slate-500">{mat.description}</p>
                      </div>
                      <button
                        onClick={() => EduTrackApi.deleteStudyMaterial(mat.id, currentUser.name)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // 4. ASSIGNMENTS, EXAMS & MARKS (ONE PAGE WITH 3 TABS)
  if (currentPage === 'assignments-exams-marks') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Assignments, Exams & Marks
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Publish course tasks, review student submissions, manage online examinations, and record authorized grades.
          </p>
        </div>

        {/* 3 Tabs */}
        <div className="flex items-center overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 -mx-3 px-3 sm:mx-0 sm:px-0 gap-1">
          <button
            onClick={() => setAemTab('assignments')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              aemTab === 'assignments'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Assignments & Submissions ({assignments.length})
          </button>
          <button
            onClick={() => setAemTab('exams')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              aemTab === 'exams'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Online Examinations ({onlineExams.length})
          </button>
          <button
            onClick={() => setAemTab('marks')}
            className={`whitespace-nowrap px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold border-b-2 transition-all min-h-[44px] flex items-center shrink-0 ${
              aemTab === 'marks'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Record Assessment Marks
          </button>
        </div>

        {/* Tab 1: Assignments */}
        {aemTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Coursework Tasks
              </h3>
              <button
                onClick={() => setShowCreateAssignment(!showCreateAssignment)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {showCreateAssignment ? 'Cancel' : 'Create Assignment'}
              </button>
            </div>

            {showCreateAssignment && (
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">New Course Assignment</h4>
                <form onSubmit={handleCreateAssignment} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                      <select
                        value={newAsgSubjectCode}
                        onChange={(e) => setNewAsgSubjectCode(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      >
                        {assignedSubjects.map(s => (
                          <option key={s.id} value={s.code}>{s.code} - {s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Due Date <span className="text-[10px] text-slate-400 font-normal">(Today or future only)</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={newAsgDeadline}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewAsgDeadline(val);
                          const today = new Date().toISOString().split('T')[0];
                          if (val && val < today) {
                            setAsgDateError('Date is invalid: Due date cannot be in the past. Faculty must select today or a future date.');
                          } else {
                            setAsgDateError(null);
                          }
                        }}
                        className={`w-full text-xs p-2 rounded-lg border outline-none ${
                          asgDateError
                            ? 'border-rose-500 bg-rose-50/30 text-rose-900 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                        }`}
                      />
                      {asgDateError && (
                        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {asgDateError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Marks</label>
                      <input
                        type="number"
                        min={1}
                        value={newAsgMaxMarks}
                        onChange={(e) => setNewAsgMaxMarks(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lab Exercise 1: Recursive Data Models"
                      value={newAsgTitle}
                      onChange={(e) => setNewAsgTitle(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Submission formatting and instructions..."
                      value={newAsgInstructions}
                      onChange={(e) => setNewAsgInstructions(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm"
                  >
                    Publish to Students
                  </button>
                </form>
              </div>
            )}

            {/* Submissions list */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                Student Submissions ({facultySubmissions.length})
              </h4>

              {facultySubmissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No submissions uploaded by students yet.
                </div>
              ) : (
                <>
                  {/* Mobile View: Stacked Cards (md:hidden) */}
                  <div className="md:hidden space-y-3">
                    {facultySubmissions.map(sub => (
                      <div key={sub.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">{sub.studentName}</span>
                            <span className="block text-[11px] font-mono text-slate-400">{sub.rollNumber}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            sub.status === 'graded' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>
                            {sub.status === 'graded' ? `${sub.marksAwarded} Marks` : 'Pending Review'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          File: {sub.fileName}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span>{sub.submittedAt}</span>
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setGradeMarks(sub.marksAwarded || 40);
                              setGradeFeedback(sub.facultyFeedback || '');
                            }}
                            className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-xs hover:bg-indigo-700 transition-colors min-h-[36px]"
                          >
                            {sub.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
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
                          <th className="py-2.5 px-4 font-semibold">Student</th>
                          <th className="py-2.5 px-4 font-semibold">File Uploaded</th>
                          <th className="py-2.5 px-4 font-semibold">Submitted At</th>
                          <th className="py-2.5 px-4 font-semibold">Grade</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {facultySubmissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-slate-900 dark:text-white">{sub.studentName}</span>
                              <span className="block text-[11px] font-mono text-slate-400">{sub.rollNumber}</span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-indigo-600 dark:text-indigo-400">{sub.fileName}</td>
                            <td className="py-2.5 px-4 text-slate-500">{sub.submittedAt}</td>
                            <td className="py-2.5 px-4 font-mono">
                              {sub.status === 'graded' ? (
                                <span className="font-bold text-emerald-600">{sub.marksAwarded} marks</span>
                              ) : (
                                <span className="text-amber-600">Pending Review</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setGradingSubmission(sub);
                                  setGradeMarks(sub.marksAwarded || 40);
                                  setGradeFeedback(sub.facultyFeedback || '');
                                }}
                                className="px-3 py-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-100"
                              >
                                {sub.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
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
          </div>
        )}

        {/* Tab 2: Online Examination */}
        {aemTab === 'exams' && (
          <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Online Examinations & Objective Tests
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure timed MCQ examinations, manage question banks, review analytics, and publish results to enrolled cohorts.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateExam}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    + Create Online Examination
                  </button>
                </div>

                {examPublishSuccess && (
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{examPublishSuccess}</span>
                  </div>
                )}

                {/* List of Online Examinations */}
                {onlineExams.length === 0 ? (
                  <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <Timer className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Online Examinations Found</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Create an online examination to deliver secure timed objective tests directly to enrolled students.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenCreateExam}
                      className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Create Online Examination
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {onlineExams.map(exam => {
                      const qCount = exam.questions?.length || 0;
                      const qSumMarks = (exam.questions || []).reduce((acc, q) => acc + (q.marks || 0), 0);
                      const isDraft = exam.status === 'DRAFT';

                      return (
                        <div
                          key={exam.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
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
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    isDraft
                                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                      : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  }`}
                                >
                                  {exam.status}
                                </span>
                                {exam.resultsReleased && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                    Results Released
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {exam.attemptCount || 0} Attended
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                                {exam.title}
                              </h4>
                              {exam.description && (
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                  {exam.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleEditExam(exam)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit Exam Metadata"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExam(exam.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Delete Examination"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Metadata row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">Exam Date</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{exam.examDate}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">Window Time</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{exam.startTime} - {exam.endTime}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">Duration</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{exam.durationMinutes} minutes</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">Total / Pass Marks</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">
                                {exam.totalMarks} / {exam.passMarks} M
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">Questions Bank</span>
                              <span className={`font-semibold font-mono ${qSumMarks === exam.totalMarks ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {qCount} Qs ({qSumMarks} M)
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-slate-400 block">Negative Marking</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {exam.negativeMarking ? `-${exam.negativeMarking} / wrong` : 'None'}
                              </span>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenQuestionBuilder(exam)}
                                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                              >
                                <ListOrdered className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Questions & Editor ({qCount})</span>
                              </button>
                              <button
                                onClick={() => handleOpenAnalytics(exam)}
                                className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg flex items-center gap-1.5 transition-colors"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Analytics & Submissions ({exam.attemptCount || 0} Attended)</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {isDraft && (
                                <button
                                  onClick={() => handlePublishExamCard(exam)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Publish Exam</span>
                                </button>
                              )}
                              {!exam.resultsReleased && exam.status === 'PUBLISHED' && (
                                <button
                                  onClick={() => handleReleaseResultsAction(exam.id)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Release Results</span>
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

        {/* Tab 3: Record Assessment Marks */}
        {aemTab === 'marks' && (() => {
          const selectedSub = assignedSubjects.find(s => s.code === marksSubjectCode) || allSubjects.find(s => s.code === marksSubjectCode) || assignedSubjects[0] || allSubjects[0];
          const activeSubCode = selectedSub?.code || marksSubjectCode || 'CS401';
          const activeSubName = selectedSub?.name || 'Course Curriculum';

          // All assignments for this course
          const courseAssignments = (assignments || []).concat(
            EduTrackApi.getAssignments().filter(a => a.subjectCode === activeSubCode || (selectedSub && a.subjectId === selectedSub.id))
          ).filter((a, idx, arr) => arr.findIndex(x => x.id === a.id) === idx);

          // Find candidate students for this subject and department
          const subjectCohortStudents = allStudents.filter(std => {
            const deptMatch = selectedSub ? std.departmentId === selectedSub.departmentId : true;
            const semMatch = selectedSub?.semester ? std.currentSemester === selectedSub.semester : true;
            return deptMatch || semMatch;
          });

          const baseStudents = subjectCohortStudents.length > 0 ? subjectCohortStudents : allStudents;
          const availableSections = Array.from(new Set(baseStudents.map(s => s.section))).filter(Boolean);

          const filteredStudents = baseStudents
            .filter(std => {
              const secMatch = marksSectionFilter === 'all' || isMatchingSection(std.section, marksSectionFilter);
              const searchMatch = !marksSearchQuery ? true : (() => {
                const q = marksSearchQuery.toLowerCase();
                const u = allUsers.find(user => user.id === std.userId);
                return (
                  std.rollNumber.toLowerCase().includes(q) ||
                  (u && u.name.toLowerCase().includes(q)) ||
                  (u && u.email.toLowerCase().includes(q))
                );
              })();
              return secMatch && searchMatch;
            })
            .sort((a, b) => {
              if (a.section !== b.section) return (a.section || '').localeCompare(b.section || '');
              return (a.rollNumber || '').localeCompare(b.rollNumber || '');
            });

          return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5">
              {/* Top Header & Context Description */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {activeSubCode}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Record Assessment Marks (Out of 100)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter and publish marks out of 100 for all enrolled students in {activeSubName}. Verify whether each student has submitted all course tasks before recording marks. Marks reflect immediately in the Student Portal under Official Semester Exam Results & Grades.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSaveSubjectMarks()}
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Save & Publish All Marks to Student Portal
                  </button>
                </div>
              </div>

              {/* Success Alert Banner */}
              {marksSavedMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{marksSavedMessage}</span>
                  </div>
                  <button onClick={() => setMarksSavedMessage(null)} className="text-emerald-600 font-bold hover:underline">Dismiss</button>
                </div>
              )}

              {/* Controls: Subject Selector, Section Filters & Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                {/* Subject Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Course / Subject
                  </label>
                  <select
                    value={activeSubCode}
                    onChange={(e) => {
                      setMarksSubjectCode(e.target.value);
                      setActiveAssessmentForMarks(null);
                    }}
                    className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-900 dark:text-white"
                  >
                    {(assignedSubjects.length > 0 ? assignedSubjects : allSubjects).map(s => (
                      <option key={s.id} value={s.code}>
                        {s.code} - {s.name} (Sem {s.semester})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Section Filter
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setMarksSectionFilter('all')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        marksSectionFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      All ({baseStudents.length})
                    </button>
                    {availableSections.map(sec => {
                      const secCount = baseStudents.filter(s => isMatchingSection(s.section, sec)).length;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setMarksSectionFilter(sec)}
                          className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                            marksSectionFilter === sec
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {sec} ({secCount})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search Box */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Search Student
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search roll number, name, email..."
                      value={marksSearchQuery}
                      onChange={(e) => setMarksSearchQuery(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Student Details, Assignment Submission Status & Marks Entry Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Roll Number</th>
                      <th className="py-3 px-4 font-semibold">Student Name & Email</th>
                      <th className="py-3 px-4 font-semibold text-center">Section</th>
                      <th className="py-3 px-4 font-semibold text-center">Assignment Submissions</th>
                      <th className="py-3 px-4 font-semibold text-right">Marks (Out of 100)</th>
                      <th className="py-3 px-4 font-semibold text-center">Grade Preview</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">No students found matching current filters.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try selecting "All Sections" or clearing your search query.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(std => {
                        const u = allUsers.find(user => user.id === std.userId);
                        
                        // Check assignment submissions for this student in this course
                        const studentSubs = (allSubmissions || []).filter(sub =>
                          sub.studentId === std.id &&
                          courseAssignments.some(asg => asg.id === sub.assignmentId)
                        );
                        const totalAsgs = courseAssignments.length;
                        const subCount = studentSubs.length;
                        const allSubmitted = totalAsgs > 0 && subCount >= totalAsgs;

                        // Existing recorded mark out of 100
                        const existingMark = getExistingMarkForStudent(std.id, activeSubCode);
                        const markVal = marksEntryMap[std.id] !== undefined ? marksEntryMap[std.id] : (typeof existingMark === 'number' ? existingMark : '');

                        const numMark = typeof markVal === 'number' ? markVal : (markVal !== '' ? Number(markVal) : null);
                        const gradeLetter = numMark !== null
                          ? (numMark >= 90 ? 'O' : numMark >= 80 ? 'A+' : numMark >= 70 ? 'A' : numMark >= 60 ? 'B+' : numMark >= 50 ? 'B' : numMark >= 40 ? 'C' : 'F')
                          : null;
                        const isPass = numMark !== null ? numMark >= 40 : true;

                        return (
                          <tr key={std.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            {/* Roll Number */}
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              {std.rollNumber}
                            </td>

                            {/* Student Name & Email */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">{u?.name || 'Student'}</p>
                              <p className="text-[11px] text-slate-400">{u?.email || 'student@edutrack.edu'}</p>
                            </td>

                            {/* Section */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                                {std.section}
                              </span>
                            </td>

                            {/* Assignment Submissions Status: Whether all assignments are submitted or not */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {totalAsgs === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  No Tasks Set
                                </span>
                              ) : allSubmitted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  All Submitted ({subCount}/{totalAsgs})
                                </span>
                              ) : subCount > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  Partially Submitted ({subCount}/{totalAsgs})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  Not Submitted (0/{totalAsgs})
                                </span>
                              )}
                            </td>

                            {/* Enter Marks out of 100 */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={markVal}
                                  placeholder="0-100"
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const val = raw === '' ? 0 : Math.max(0, Math.min(100, Number(raw)));
                                    setMarksEntryMap(prev => ({ ...prev, [std.id]: val }));
                                  }}
                                  className="w-20 p-1.5 text-xs font-mono font-bold text-right rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                                />
                                <span className="text-[11px] font-bold text-slate-400">/ 100</span>
                              </div>
                            </td>

                            {/* Live Grade Preview */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {gradeLetter ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                                  gradeLetter === 'O' || gradeLetter === 'A+'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : gradeLetter === 'A' || gradeLetter === 'B+'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                    : gradeLetter === 'B' || gradeLetter === 'C'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                }`}>
                                  Grade {gradeLetter} · {isPass ? 'Pass' : 'Fail'}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">Not Entered</span>
                              )}
                            </td>

                            {/* Individual Row Action */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleSaveSubjectMarks(std.id)}
                                className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-md transition-colors"
                              >
                                Publish
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Footer Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length}</span> students across <span className="font-bold text-slate-900 dark:text-white">{marksSectionFilter === 'all' ? 'All Sections' : marksSectionFilter}</span> for course <strong className="text-indigo-600 dark:text-indigo-400">{activeSubCode}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSubjectMarks()}
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save & Publish All Marks to Student Portal
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal: Grading Submission */}
        {gradingSubmission && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Grade Submission: {gradingSubmission.studentName}
                </h3>
                <button onClick={() => setGradingSubmission(null)} className="text-slate-400">✕</button>
              </div>
              <p className="text-xs text-slate-500 font-mono">File: {gradingSubmission.fileName}</p>
              <form onSubmit={handleSaveGrade} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Marks Awarded</label>
                  <input
                    type="number"
                    required
                    value={gradeMarks}
                    onChange={(e) => setGradeMarks(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Constructive Written Feedback</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide specific feedback on implementation correctness, code quality, and benchmarks..."
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setGradingSubmission(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm">Save Grade</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 1: Create / Edit Online Examination */}
        {showCreateExamModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {editingExam ? 'Edit Online Examination' : 'Create Online Examination'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define examination parameters, time windows, and target student cohort.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateExamModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              </div>

              {examFormError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  {examFormError}
                </div>
              )}

              <form onSubmit={handleSaveExamForm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Examination Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Consensus & Raft Protocol Objective Test"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions & Guidelines for Students
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instructions shown to student before clicking Start Examination..."
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Subject <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={examSubjectId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        setExamSubjectId(sid);
                        const s = allSubjects.find(sub => sub.id === sid);
                        if (s?.semester) setExamSemester(s.semester);
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      {assignedSubjects.map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Semester <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={examSemester}
                      onChange={(e) => setExamSemester(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Section <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={examSection}
                      onChange={(e) => setExamSection(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-semibold"
                    >
                      <option value="All">All Sections (Entire Cohort: CSE-A, CSE-B, CSE-C)</option>
                      {effectiveSections.map(sec => {
                        const studentCount = allStudents.filter(std => isMatchingSection(std.section, sec)).length;
                        return (
                          <option key={sec} value={sec}>
                            Section {sec} ({studentCount} enrolled student{studentCount === 1 ? '' : 's'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Examination Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={examDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExamDate(val);
                        const today = new Date().toISOString().split('T')[0];
                        if (val && val < today) {
                          setExamFormError('Date is invalid: Examination date cannot be before today. You can only select today or future dates.');
                        } else {
                          setExamFormError(null);
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                    {examDate && examDate < new Date().toISOString().split('T')[0] && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Date is invalid. Only today or future dates allowed.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={examStartTime}
                      onChange={(e) => setExamStartTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      End Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={examEndTime}
                      onChange={(e) => setExamEndTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Duration (Mins) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      max={300}
                      value={examDurationMinutes}
                      onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Total Marks <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={examTotalMarks}
                      onChange={(e) => setExamTotalMarks(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pass Marks <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={examPassMarks}
                      onChange={(e) => setExamPassMarks(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Negative Marking
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      max={10}
                      value={examNegativeMarking}
                      onChange={(e) => setExamNegativeMarking(Number(e.target.value))}
                      placeholder="e.g. 0.25 or 0"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Result Publication
                    </label>
                    <select
                      value={examResultPublication}
                      onChange={(e) => setExamResultPublication(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                    >
                      <option value="MANUAL_BY_FACULTY">Manual Release by Faculty</option>
                      <option value="IMMEDIATE_ON_SUBMIT">Immediate Upon Submission</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateExamModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingExam ? 'Update Examination' : 'Save as Draft & Add Questions'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Question Builder & Bank */}
        {showQuestionBuilderModal && activeExamForQuestions && (() => {
          const sumMarks = questionsDraft.reduce((acc, q) => acc + (q.marks || 0), 0);
          const isMarksAligned = sumMarks === activeExamForQuestions.totalMarks;
          const diff = activeExamForQuestions.totalMarks - sumMarks;

          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Question Bank & Editor: {activeExamForQuestions.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeExamForQuestions.subjectCode} · Semester {activeExamForQuestions.semester} · Section {activeExamForQuestions.section}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowQuestionBuilderModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Question and Marks Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Exam Target Marks</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{activeExamForQuestions.totalMarks} Marks</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Question Marks</span>
                      <span className={`font-mono font-bold ${isMarksAligned ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {sumMarks} Marks
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Questions Configured</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{questionsDraft.length} Questions</span>
                    </div>
                  </div>

                  <div>
                    {isMarksAligned ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marks Perfectly Balanced
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {diff > 0 ? `Need ${diff} more marks to balance` : `Exceeds target by ${Math.abs(diff)} marks`}
                      </span>
                    )}
                  </div>
                </div>

                {qFormError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    {qFormError}
                  </div>
                )}

                {/* Add / Edit Question Input Card */}
                <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {editingQIndex !== null ? `Edit Question #${editingQIndex + 1}` : `Add Question #${questionsDraft.length + 1}`}
                    </h4>
                    {editingQIndex !== null && (
                      <button
                        onClick={() => {
                          setEditingQIndex(null);
                          setQText('');
                          setQOptA('');
                          setQOptB('');
                          setQOptC('');
                          setQOptD('');
                          setQExplanation('');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Question Text <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Type multiple choice question prompt..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option A</label>
                      <input
                        type="text"
                        placeholder="Option A answer text..."
                        value={qOptA}
                        onChange={(e) => setQOptA(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option B</label>
                      <input
                        type="text"
                        placeholder="Option B answer text..."
                        value={qOptB}
                        onChange={(e) => setQOptB(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option C</label>
                      <input
                        type="text"
                        placeholder="Option C answer text..."
                        value={qOptC}
                        onChange={(e) => setQOptC(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option D</label>
                      <input
                        type="text"
                        placeholder="Option D answer text..."
                        value={qOptD}
                        onChange={(e) => setQOptD(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Correct Answer Key <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setQCorrect(opt)}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              qCorrect === opt
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Question Marks <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={qMarks}
                        onChange={(e) => setQMarks(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Negative Marks (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min={0}
                        value={qNegMarks}
                        onChange={(e) => setQNegMarks(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Explanation / Solution Notes (Revealed upon result release)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. In Raft consensus, heartbeat intervals prevent split votes and leader timeouts..."
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddOrUpdateQuestion}
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{editingQIndex !== null ? 'Update Question' : 'Add Question'}</span>
                    </button>
                  </div>
                </div>

                {/* Existing Questions List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Configured Questions ({questionsDraft.length})
                  </h4>

                  {questionsDraft.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                      No questions added yet. Use the form above to add multiple choice questions.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {questionsDraft.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                                  Q{idx + 1}
                                </span>
                                <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                                  {q.marks} Marks {q.negativeMarks ? `(-${q.negativeMarks})` : ''}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                                {q.questionText}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleReorderQuestion(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Move Up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderQuestion(idx, 'down')}
                                disabled={idx === questionsDraft.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Move Down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditQuestionInDraft(idx)}
                                className="p-1 text-slate-400 hover:text-indigo-600"
                                title="Edit Question"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Delete Question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Options pills */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                            {normalizeQuestionOptions(q.options).map(opt => {
                              const isCorrect = opt.key === q.correctAnswer;
                              return (
                                <div
                                  key={opt.key}
                                  className={`p-2 rounded-lg border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                  }`}>
                                    {opt.key}
                                  </span>
                                  <span className="truncate">{opt.text}</span>
                                  {isCorrect && <Check className="w-3 h-3 text-emerald-600 ml-auto shrink-0" />}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <p className="text-[11px] text-slate-500 italic pt-0.5">
                              Note: {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Toolbar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowQuestionBuilderModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Close
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveQuestionsDraft}
                      className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save as Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePublishFromBuilder}
                      className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Examination</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal 3: Faculty Results & Analytics */}
        {showAnalyticsModal && activeExamForQuestions && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Examination Submissions & Performance Analytics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeExamForQuestions.title} · {activeExamForQuestions.subjectCode} · Sem {activeExamForQuestions.semester} · Section {activeExamForQuestions.section}
                  </p>
                </div>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              </div>

              {analyticsLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">Loading live examination analytics from MongoDB...</div>
              ) : analyticsData ? (
                <div className="space-y-5">
                  {/* Result Release Banner */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    analyticsData.exam.resultsReleased
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                      : 'border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                  }`}>
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        {analyticsData.exam.resultsReleased ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Official Examination Results Are Released
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 text-blue-600" />
                            Results Are Pending Release (Hidden from Students)
                          </>
                        )}
                      </span>
                      <p className="text-[11px] opacity-80">
                        {analyticsData.exam.resultsReleased
                          ? 'Enrolled students can view their marks, breakdown, and question explanations in the Student Portal.'
                          : 'Review student performance and submission answers below. Click Release Results to make scores visible to students.'}
                      </p>
                    </div>

                    {!analyticsData.exam.resultsReleased && (
                      <button
                        onClick={() => handleReleaseResultsAction(analyticsData.exam.id)}
                        className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Release Results to Students</span>
                      </button>
                    )}
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[11px] text-slate-400 block">Eligible Students</span>
                      <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                        {analyticsData.totalEligibleStudents}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[11px] text-slate-400 block">Attended / Absent</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-emerald-600">{analyticsData.studentsAttended}</span>
                        <span className="text-xs text-slate-400">/ {analyticsData.studentsNotAttended} absent</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[11px] text-slate-400 block">Average Marks</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {analyticsData.averageMarks.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">/ {analyticsData.exam.totalMarks} M</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">High: {analyticsData.highestMarks} · Low: {analyticsData.lowestMarks}</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[11px] text-slate-400 block">Pass Rate</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold font-mono text-emerald-600">{analyticsData.passCount}</span>
                        <span className="text-xs text-slate-400">passed / {analyticsData.failCount} failed</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {analyticsData.studentsAttended > 0 ? ((analyticsData.passCount / analyticsData.studentsAttended) * 100).toFixed(0) : 0}% passing rate
                      </span>
                    </div>
                  </div>

                  {/* Student-wise Submissions Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Student Submissions Roster ({analyticsData.submittedAttempts.length})
                    </h4>
                    {analyticsData.submittedAttempts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                        No students have submitted this examination yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                            <tr>
                              <th className="py-2.5 px-3">Roll No</th>
                              <th className="py-2.5 px-3">Student Name</th>
                              <th className="py-2.5 px-3">Section</th>
                              <th className="py-2.5 px-3">Attendance</th>
                              <th className="py-2.5 px-3">Start Time</th>
                              <th className="py-2.5 px-3">Submit Time</th>
                              <th className="py-2.5 px-3 font-mono">Score</th>
                              <th className="py-2.5 px-3 font-mono">%</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {analyticsData.submittedAttempts.map(att => (
                              <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{att.studentRollNumber}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{att.studentName}</td>
                                <td className="py-2.5 px-3">{att.section}</td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Attended
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 text-[11px]">{new Date(att.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="py-2.5 px-3 text-slate-400 text-[11px]">{att.submitTime ? new Date(att.submitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  {att.totalMarksObtained} / {att.totalMaxMarks}
                                </td>
                                <td className="py-2.5 px-3 font-mono">{att.percentage?.toFixed(1)}%</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    att.isPassed
                                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                  }`}>
                                    {att.isPassed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Question-wise Performance Analysis */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Question-Wise Accuracy & Performance
                    </h4>
                    <div className="space-y-2">
                      {analyticsData.questionPerformance.map(qp => (
                        <div
                          key={qp.questionId}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                Q{qp.questionNumber}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {qp.questionText}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              Correct Key: <strong className="text-emerald-600 font-mono">{qp.correctAnswer}</strong> · {qp.correctCount} of {qp.totalAttempts} answered correctly
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${qp.accuracyPercentage >= 75 ? 'bg-emerald-500' : qp.accuracyPercentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${qp.accuracyPercentage}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right">
                              {qp.accuracyPercentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    );
  }

  // 5. STUDENT ANALYTICS & WEAK CONCEPTS
  if (currentPage === 'student-analytics') {
    const enrolledStudents = allStudents.filter(std =>
      assignedSubjects.some(sub => sub.departmentId === std.departmentId && sub.semester === std.currentSemester) ||
      (profile?.departmentId === std.departmentId && effectiveSections.some(sec => isMatchingSection(std.section, sec)))
    );

    const analyticsSections = Array.from(new Set(enrolledStudents.map(s => s.section))).filter(Boolean);

    const filteredStudents = enrolledStudents.filter(std =>
      analyticsSectionFilter === 'all' || isMatchingSection(std.section, analyticsSectionFilter)
    );

    const performanceData = filteredStudents.map(s => {
      const u = allUsers.find(user => user.id === s.userId);
      return {
        name: u?.name || s.rollNumber,
        section: s.section,
        attendance: s.attendancePercentage,
        cgpa: s.cgpa
      };
    });

    const avgAttendance = filteredStudents.length > 0
      ? Math.round(filteredStudents.reduce((acc, s) => acc + s.attendancePercentage, 0) / filteredStudents.length)
      : 0;

    const avgCgpa = filteredStudents.length > 0
      ? (filteredStudents.reduce((acc, s) => acc + s.cgpa, 0) / filteredStudents.length).toFixed(2)
      : '0.00';

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Student Analytics & Weak-Concept Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real performance tracking derived from actual recorded attendance sessions and student assessments.
          </p>
        </div>

        {/* Section Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Section View:</span>
            <button
              type="button"
              onClick={() => setAnalyticsSectionFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                analyticsSectionFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Sections ({enrolledStudents.length})
            </button>
            {analyticsSections.map(sec => {
              const count = enrolledStudents.filter(s => isMatchingSection(s.section, sec)).length;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setAnalyticsSectionFilter(sec)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    analyticsSectionFilter === sec
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sec} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">Avg Attendance: </span>
              <span className={`font-bold font-mono ${avgAttendance >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {avgAttendance}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Avg CGPA: </span>
              <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {avgCgpa}
              </span>
            </div>
          </div>
        </div>

        {enrolledStudents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 space-y-2">
            <LineChart className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No student assessment data recorded yet</p>
            <p>Once you record attendance and grade assignments for your assigned subjects, student performance curves will generate here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Student Attendance & Academic Compliance (%)
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Attendance percentage across {analyticsSectionFilter === 'all' ? 'all sections' : `Section ${analyticsSectionFilter}`} ({filteredStudents.length} students)
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="attendance" name="Attendance (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rule-Based Weak Concepts Explanations */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200">
              <span className="font-bold block mb-1">Pedagogical Weak-Concept Engine (Rule-Based Analytics)</span>
              <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed">
                Concepts where cohort assessment scores average below the 75% institutional mastery benchmark are automatically flagged with targeted interventions. Currently tracking {assignments.length} published assignments and {internalAssessments.length} internal tests.
              </p>
            </div>
          </div>
        )}

      </div>
    );
  }

  // 6. NOTIFICATIONS
  if (currentPage === 'notifications') {
    return (
      <div className="space-y-6 max-w-4xl">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Faculty Administrative Notices
        </h2>
        <p className="text-xs text-slate-500">
          Official notices targeted exclusively to Faculty members by Institutional Administration.
        </p>

        {announcements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            No administrative notices published for faculty right now.
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
                  <span>Published by: {ann.publishedBy}</span>
                  <span>{ann.publishedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div>Faculty Page Not Found</div>;
};
