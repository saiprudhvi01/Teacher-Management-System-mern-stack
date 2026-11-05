import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToCohort, emitToRole, emitToStudent, emitToAll } from '../socket';

const router = Router();

export const isMatchingDepartment = (d1?: string, d2?: string, departments?: any[]): boolean => {
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;
  const s1 = d1.trim().toLowerCase();
  const s2 = d2.trim().toLowerCase();
  if (s1 === s2) return true;
  const code1 = s1.replace(/^dept_/, '');
  const code2 = s2.replace(/^dept_/, '');
  if (code1 === code2) return true;

  if (departments && Array.isArray(departments)) {
    const deptObj1 = departments.find(
      d => d.id?.toLowerCase() === s1 || d.code?.toLowerCase() === s1 || d.name?.toLowerCase() === s1
    );
    const deptObj2 = departments.find(
      d => d.id?.toLowerCase() === s2 || d.code?.toLowerCase() === s2 || d.name?.toLowerCase() === s2
    );
    if (deptObj1 && deptObj2 && (deptObj1.id === deptObj2.id || deptObj1.code === deptObj2.code)) {
      return true;
    }
  }
  return false;
};

export const isMatchingSection = (secA?: string, secB?: string): boolean => {
  if (!secA || !secB) return false;
  const a = secA.trim().toUpperCase();
  const b = secB.trim().toUpperCase();
  if (a === 'ALL' || b === 'ALL' || a === 'ALL SECTIONS' || b === 'ALL SECTIONS') return true;
  if (a === b) return true;

  // Normalize: extract the core section letter or token (e.g., 'CSE-A' -> 'A', 'SEC_CSE_A' -> 'A', 'SECTION A' -> 'A', 'A' -> 'A')
  const cleanA = a.replace(/^(SEC_[A-Z0-9]+_|SECTION\s*|[A-Z0-9]+-)/i, '').trim();
  const cleanB = b.replace(/^(SEC_[A-Z0-9]+_|SECTION\s*|[A-Z0-9]+-)/i, '').trim();
  if (cleanA === 'ALL' || cleanB === 'ALL') return true;
  if (cleanA === cleanB) return true;

  if (a.endsWith(`-${cleanB}`) || b.endsWith(`-${cleanA}`)) return true;

  return false;
};

export const isStudentEnrolledInSubject = (
  student: any,
  subjectId: string,
  subjectCode: string | undefined,
  semester: number,
  departmentId: string,
  data: any
): boolean => {
  // 1. If explicit courseEnrollments exist for this student, check them
  const studentEnrollments = (data.courseEnrollments || []).filter(
    (e: any) => e.studentId === student.id || e.studentId === student.userId
  );
  if (studentEnrollments.length > 0) {
    const hasEnrollment = studentEnrollments.some(
      (e: any) => e.subjectId === subjectId || (subjectCode && e.subjectCode === subjectCode)
    );
    if (hasEnrollment) return true;
  }

  // 2. Default academic curriculum: Subject belongs to student's department and student's semester
  const sub = (data.subjects || []).find((s: any) => s.id === subjectId || (subjectCode && s.code === subjectCode));
  if (sub) {
    const isDept = isMatchingDepartment(sub.departmentId, student.departmentId, data.departments);
    const isSem = Number(sub.semester) === Number(student.currentSemester);
    if (isDept && isSem) return true;
  }

  // 3. Fallback: If exam itself specifies matching dept and sem
  const examDeptMatch = isMatchingDepartment(departmentId, student.departmentId, data.departments);
  const examSemMatch = Number(semester) === Number(student.currentSemester);
  return examDeptMatch && examSemMatch;
};

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

// GET /api/online-exams/attempts/all
// Retrieve exam attempts for synchronization
router.get('/attempts/all', (req: Request, res: Response) => {
  const { studentId, examId } = req.query;
  const data = dbStore.getData();
  let attempts = data.examAttempts || [];
  if (studentId) {
    attempts = attempts.filter(a => a.studentId === studentId);
  }
  if (examId) {
    attempts = attempts.filter(a => a.examId === examId);
  }
  return res.json(attempts);
});

// GET /api/online-exams
// List examinations with role & relationship filtering
router.get('/', (req: Request, res: Response) => {
  const user = (req as any).user;
  const data = dbStore.getData();
  const { facultyId, subjectId, semester, section, status } = req.query;

  let exams = [...(data.onlineExams || [])];

  if (user?.role === 'student') {
    // Find student profile
    const student = data.students.find(s => s.userId === user.id || s.id === user.id);
    if (!student) {
      return res.json([]);
    }

    // Only published/completed exams for student's department, semester, section, and enrolled subject
    exams = exams.filter(e => {
      const isStatusEligible = e.status === 'PUBLISHED' || e.status === 'COMPLETED';
      const isDeptEligible = isMatchingDepartment(e.departmentId, student.departmentId, data.departments);
      const isSemEligible = Number(e.semester) === Number(student.currentSemester);
      const isSecEligible = isMatchingSection(e.section, student.section);
      const isSubEligible = isStudentEnrolledInSubject(student, e.subjectId, e.subjectCode, Number(e.semester), e.departmentId, data);
      const isYearEligible = !e.academicYear || !student.academicYear || e.academicYear === student.academicYear;
      return isStatusEligible && isDeptEligible && isSemEligible && isSecEligible && isSubEligible && isYearEligible;
    });

    // Populate student's attempt status and sanitize questions if results not released
    const studentExams = exams.map(e => {
      const attempts = (data.examAttempts || []).filter(
        a => a.examId === e.id && (a.studentId === student.id || a.studentId === user.id)
      );
      const userAttempt = attempts[attempts.length - 1] || null;

      const sanitizedQuestions = (e.questions || []).map((q: any) => {
        const normalizedOpts = normalizeQuestionOptions(q.options);
        if (e.resultsReleased) {
          return { ...q, options: normalizedOpts };
        }
        // Do NOT expose correct answer or explanation to student before release
        const { correctAnswer, explanation, ...safeQuestion } = q;
        return { ...safeQuestion, options: normalizedOpts };
      });

      return {
        ...e,
        questions: sanitizedQuestions,
        attemptCount: attempts.length,
        userAttempt: userAttempt ? {
          ...userAttempt,
          // Hide evaluations if results not released
          questionEvaluations: e.resultsReleased ? userAttempt.questionEvaluations : undefined,
          score: e.resultsReleased ? userAttempt.score : undefined,
          percentage: e.resultsReleased ? userAttempt.percentage : undefined,
          passed: e.resultsReleased ? userAttempt.passed : undefined
        } : null
      };
    });

    return res.json(studentExams);
  }

  // Faculty / Admin view
  if (facultyId) {
    exams = exams.filter(e => e.facultyId === facultyId);
  } else if (user?.role === 'faculty') {
    // Show exams created by faculty or assigned to faculty's department/subjects
    exams = exams.filter(e => e.facultyId === user.id || e.facultyId === (user as any).facultyId);
  }

  if (subjectId) {
    exams = exams.filter(e => e.subjectId === subjectId);
  }
  if (semester) {
    exams = exams.filter(e => Number(e.semester) === Number(semester));
  }
  if (section && section !== 'all') {
    exams = exams.filter(e => isMatchingSection(e.section, String(section)));
  }
  if (status && status !== 'all') {
    exams = exams.filter(e => e.status === status);
  }

  // Attach submission counts and normalize questions for faculty cards
  const enrichedExams = exams.map(e => {
    const attempts = (data.examAttempts || []).filter(a => a.examId === e.id && a.status === 'SUBMITTED');
    return {
      ...e,
      questions: (e.questions || []).map((q: any) => ({
        ...q,
        options: normalizeQuestionOptions(q.options)
      })),
      attemptCount: attempts.length
    };
  });

  return res.json(enrichedExams);
});

// GET /api/online-exams/:id
// Get single exam details
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const data = dbStore.getData();

  const exam = (data.onlineExams || []).find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  if (user?.role === 'student') {
    const student = data.students.find(s => s.userId === user.id || s.id === user.id);
    if (!student) {
      return res.status(403).json({ error: 'Unauthorized: Student profile not found.' });
    }

    if (
      !isMatchingDepartment(exam.departmentId, student.departmentId, data.departments) ||
      Number(exam.semester) !== Number(student.currentSemester) ||
      !isMatchingSection(exam.section, student.section) ||
      !isStudentEnrolledInSubject(student, exam.subjectId, exam.subjectCode, Number(exam.semester), exam.departmentId, data)
    ) {
      return res.status(403).json({ error: 'You are not eligible for this examination.' });
    }

    const attempts = (data.examAttempts || []).filter(
      a => a.examId === exam.id && (a.studentId === student.id || a.studentId === user.id)
    );
    const userAttempt = attempts[attempts.length - 1] || null;

    const sanitizedQuestions = (exam.questions || []).map((q: any) => {
      const normalizedOpts = normalizeQuestionOptions(q.options);
      if (exam.resultsReleased) return { ...q, options: normalizedOpts };
      const { correctAnswer, explanation, ...safeQuestion } = q;
      return { ...safeQuestion, options: normalizedOpts };
    });

    return res.json({
      ...exam,
      questions: sanitizedQuestions,
      attemptCount: attempts.length,
      userAttempt: userAttempt ? {
        ...userAttempt,
        questionEvaluations: exam.resultsReleased ? userAttempt.questionEvaluations : undefined,
        score: exam.resultsReleased ? userAttempt.score : undefined,
        percentage: exam.resultsReleased ? userAttempt.percentage : undefined,
        passed: exam.resultsReleased ? userAttempt.passed : undefined
      } : null
    });
  }

  return res.json({
    ...exam,
    questions: (exam.questions || []).map((q: any) => ({
      ...q,
      options: normalizeQuestionOptions(q.options)
    }))
  });
});

// POST /api/online-exams
// Faculty creates an online examination
router.post('/', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role === 'student') {
    return res.status(403).json({ error: 'Access denied: Only faculty can create examinations.' });
  }

  const {
    title,
    description,
    instructions,
    departmentId,
    departmentName,
    subjectId,
    subjectCode,
    subjectName,
    semester,
    section,
    examDate,
    startTime,
    endTime,
    durationMinutes,
    totalMarks,
    passMarks,
    negativeMarking,
    negativeMarksPerQuestion,
    maxAttempts,
    resultPublication,
    status,
    questions
  } = req.body;

  if (!title || !subjectId || !examDate || !durationMinutes || !totalMarks) {
    return res.status(400).json({ error: 'Title, Subject, Date, Duration, and Total Marks are required.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (examDate < todayStr) {
    return res.status(400).json({
      error: 'Date is invalid: Examination date cannot be before today. You can only set today or future dates.'
    });
  }

  const data = dbStore.getData();
  const sub = data.subjects.find(s => s.id === subjectId || s.code === subjectCode);
  const dept = data.departments.find(d => d.id === departmentId || d.code === sub?.departmentId);

  const cleanQuestions = (questions || []).map((q: any, idx: number) => ({
    id: q.id || `q_${Date.now()}_${idx + 1}`,
    questionNumber: q.questionNumber || idx + 1,
    questionText: q.questionText || '',
    options: normalizeQuestionOptions(q.options),
    correctAnswer: q.correctAnswer || 'A',
    marks: Number(q.marks) || 1,
    negativeMarks: Number(q.negativeMarks) || 0,
    explanation: q.explanation || ''
  }));

  const initialStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

  // Validate question marks if publishing
  if (initialStatus === 'PUBLISHED') {
    if (cleanQuestions.length === 0) {
      return res.status(400).json({ error: 'Cannot publish examination without any questions.' });
    }
    const sumMarks = cleanQuestions.reduce((acc: number, q: any) => acc + q.marks, 0);
    if (sumMarks !== Number(totalMarks)) {
      return res.status(400).json({
        error: `Total question marks (${sumMarks}) must match configured examination total marks (${totalMarks}).`
      });
    }
  }

  const newExam = {
    id: `ox_${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : '',
    instructions: instructions ? instructions.trim() : '',
    departmentId: departmentId || sub?.departmentId || 'dept_cse',
    departmentName: departmentName || dept?.name || 'Computer Science & Engineering',
    subjectId: subjectId || sub?.id || 'sub_cs401',
    subjectCode: subjectCode || sub?.code || 'CS401',
    subjectName: subjectName || sub?.name || 'Course Examination',
    semester: Number(semester) || sub?.semester || 6,
    section: section || 'All',
    facultyId: user?.id || 'usr_fac_01',
    facultyName: user?.name || 'Faculty Instructor',
    examDate,
    startTime: startTime || '10:00',
    endTime: endTime || '11:00',
    durationMinutes: Number(durationMinutes) || 30,
    totalMarks: Number(totalMarks) || 50,
    passMarks: Number(passMarks) || 20,
    negativeMarking: Boolean(negativeMarking) || Number(negativeMarking) > 0,
    negativeMarksPerQuestion: Number(negativeMarking) || Number(negativeMarksPerQuestion) || 0,
    maxAttempts: Number(maxAttempts) || 1,
    resultPublication: resultPublication === 'IMMEDIATE' ? 'IMMEDIATE' : 'MANUAL_RELEASE',
    resultsReleased: resultPublication === 'IMMEDIATE',
    status: initialStatus,
    questions: cleanQuestions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!data.onlineExams) data.onlineExams = [];
  data.onlineExams.unshift(newExam);
  dbStore.save();

  if (initialStatus === 'PUBLISHED') {
    emitToCohort(newExam.departmentId, newExam.semester, newExam.section, 'online_exam:published', newExam);
    emitToRole('faculty', 'online_exam:published', newExam);
    emitToAll('online_exam:published', newExam);
  }

  dbStore.logAudit(
    'Online Exam Created',
    user?.name || 'Faculty',
    'faculty',
    `Exam ${newExam.title}`,
    `Created exam for ${newExam.subjectCode} (${newExam.section}, Sem ${newExam.semester}) [${initialStatus}]`
  );

  return res.status(201).json(newExam);
});

// PUT /api/online-exams/:id
// Faculty updates exam details or questions
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const data = dbStore.getData();

  const idx = (data.onlineExams || []).findIndex(e => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  const existing = data.onlineExams[idx];

  // Update fields
  const updates = req.body;

  if (updates.examDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (updates.examDate < todayStr) {
      return res.status(400).json({
        error: 'Date is invalid: Examination date cannot be before today. You can only set today or future dates.'
      });
    }
  }

  const updatedExam = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (updates.questions) {
    updatedExam.questions = updates.questions.map((q: any, i: number) => ({
      id: q.id || `q_${Date.now()}_${i + 1}`,
      questionNumber: q.questionNumber || i + 1,
      questionText: q.questionText || '',
      options: normalizeQuestionOptions(q.options),
      correctAnswer: q.correctAnswer || 'A',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negativeMarks) || 0,
      explanation: q.explanation || ''
    }));
  }

  // If publishing, validate
  if (updates.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    if (updatedExam.questions.length === 0) {
      return res.status(400).json({ error: 'Cannot publish examination without questions.' });
    }
    const sumMarks = updatedExam.questions.reduce((acc: number, q: any) => acc + q.marks, 0);
    if (sumMarks !== Number(updatedExam.totalMarks)) {
      return res.status(400).json({
        error: `Total question marks (${sumMarks}) must match configured examination total marks (${updatedExam.totalMarks}).`
      });
    }
    emitToCohort(updatedExam.departmentId, updatedExam.semester, updatedExam.section, 'online_exam:published', updatedExam);
    emitToRole('faculty', 'online_exam:published', updatedExam);
    emitToAll('online_exam:published', updatedExam);
  }

  data.onlineExams[idx] = updatedExam;
  dbStore.save();

  return res.json(updatedExam);
});

// DELETE /api/online-exams/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();

  const idx = (data.onlineExams || []).findIndex(e => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  data.onlineExams.splice(idx, 1);
  // Clean attempts
  data.examAttempts = (data.examAttempts || []).filter(a => a.examId !== id);
  dbStore.save();

  return res.json({ message: 'Online examination deleted successfully.' });
});

// POST /api/online-exams/:id/publish
router.post('/:id/publish', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();

  const exam = (data.onlineExams || []).find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  if (!exam.questions || exam.questions.length === 0) {
    return res.status(400).json({ error: 'Please add at least one question before publishing.' });
  }

  const sumMarks = exam.questions.reduce((acc: number, q: any) => acc + q.marks, 0);
  if (sumMarks !== Number(exam.totalMarks)) {
    return res.status(400).json({
      error: `Question marks sum (${sumMarks}) must match total examination marks (${exam.totalMarks}).`
    });
  }

  exam.status = 'PUBLISHED';
  exam.updatedAt = new Date().toISOString();
  dbStore.save();

  emitToCohort(exam.departmentId, exam.semester, exam.section, 'online_exam:published', exam);
  emitToRole('faculty', 'online_exam:published', exam);
  emitToAll('online_exam:published', exam);

  return res.json({ message: 'Examination published to student portals.', exam });
});

// POST /api/online-exams/:id/release-results
// Faculty authorizes student view of marks & explanations
router.post('/:id/release-results', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const data = dbStore.getData();

  const exam = (data.onlineExams || []).find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  exam.resultsReleased = true;
  exam.updatedAt = new Date().toISOString();

  // Find all submitted attempts for this exam and reflect in student semester grades
  const attempts = (data.examAttempts || []).filter(a => a.examId === id && a.status === 'SUBMITTED');
  if (!data.results) data.results = [];

  attempts.forEach(att => {
    const markValue = Math.min(100, Math.round(((att.score || 0) / (exam.totalMarks || 100)) * 100));
    const internal = Math.round(markValue * 0.4);
    const external = markValue - internal;
    const grade = markValue >= 90 ? 'O' : markValue >= 80 ? 'A+' : markValue >= 70 ? 'A' : markValue >= 60 ? 'B+' : markValue >= 50 ? 'B' : markValue >= 40 ? 'C' : 'F';
    const gradePoint = markValue >= 90 ? 10 : markValue >= 80 ? 9 : markValue >= 70 ? 8 : markValue >= 60 ? 7 : markValue >= 50 ? 6 : markValue >= 40 ? 5 : 0;
    const passStatus = markValue >= 40 ? 'Pass' : 'Fail';

    let studentResult = data.results.find((r: any) => r.studentId === att.studentId);
    if (!studentResult) {
      studentResult = {
        id: `res_${att.studentId}_sem${exam.semester}`,
        studentId: att.studentId,
        semester: exam.semester,
        sgpa: gradePoint,
        cgpa: gradePoint,
        totalCredits: 4,
        termName: `Semester ${exam.semester} Final Examinations`,
        grades: []
      };
      data.results.push(studentResult);
    }

    if (!studentResult.grades) studentResult.grades = [];

    const existingGrade = studentResult.grades.find((g: any) => g.subjectCode === exam.subjectCode);
    if (existingGrade) {
      existingGrade.totalMarks = markValue;
      existingGrade.internalMarks = internal;
      existingGrade.externalMarks = external;
      existingGrade.grade = grade;
      existingGrade.gradePoint = gradePoint;
      existingGrade.status = passStatus;
    } else {
      studentResult.grades.push({
        id: `grd_${att.studentId}_${exam.subjectCode}`,
        studentId: att.studentId,
        subjectId: exam.subjectId,
        subjectCode: exam.subjectCode,
        subjectName: exam.subjectName,
        semester: exam.semester,
        credits: 4,
        internalMarks: internal,
        externalMarks: external,
        totalMarks: markValue,
        grade,
        gradePoint,
        status: passStatus
      });
    }

    emitToStudent(att.studentId, 'online_exam:results_released', {
      examId: exam.id,
      examTitle: exam.title,
      score: att.score,
      totalMarks: exam.totalMarks,
      percentage: att.percentage,
      passed: att.passed
    });
  });

  dbStore.save();

  emitToCohort(exam.departmentId, exam.semester, exam.section, 'online_exam:results_released', { examId: id });
  emitToRole('faculty', 'online_exam:results_released', { examId: id });

  dbStore.logAudit(
    'Exam Results Released',
    user?.name || 'Faculty',
    'faculty',
    `Exam ${exam.title}`,
    `Released test results for ${attempts.length} student submissions`
  );

  return res.json({ message: 'Results successfully released to students.', exam });
});

// GET /api/online-exams/:id/results
// Faculty Analytics & Submission Roster
router.get('/:id/results', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();

  const exam = (data.onlineExams || []).find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  // Eligible students
  const eligibleStudents = (data.students || []).filter(s => {
    const isDept = isMatchingDepartment(s.departmentId, exam.departmentId, data.departments);
    const isSem = Number(s.currentSemester) === Number(exam.semester);
    const isSec = isMatchingSection(s.section, exam.section);
    const isSub = isStudentEnrolledInSubject(s, exam.subjectId, exam.subjectCode, Number(exam.semester), exam.departmentId, data);
    return isDept && isSem && isSec && isSub;
  });

  const submissions = (data.examAttempts || []).filter(a => a.examId === id && a.status === 'SUBMITTED');
  const attendedCount = submissions.length;
  const notAttendedCount = Math.max(0, eligibleStudents.length - attendedCount);

  const scores = submissions.map(s => Number(s.score) || 0);
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
  const averageScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;

  const passCount = submissions.filter(s => s.passed).length;
  const failCount = submissions.length - passCount;
  const passPercentage = submissions.length > 0 ? Number(((passCount / submissions.length) * 100).toFixed(1)) : 0;

  // Question-wise performance analytics
  const questionPerformance = (exam.questions || []).map((q: any, idx: number) => {
    let correctCount = 0;
    submissions.forEach(sub => {
      const studentEval = (sub.questionEvaluations || []).find((ev: any) => ev.questionId === q.id);
      if (studentEval && studentEval.isCorrect) {
        correctCount++;
      } else {
        const studentAns = sub.answers ? (Array.isArray(sub.answers) ? sub.answers.find((a: any) => a.questionId === q.id)?.selectedOption : sub.answers[q.id]) : undefined;
        if (studentAns === q.correctAnswer) {
          correctCount++;
        }
      }
    });

    const accuracyPercentage = submissions.length > 0 ? Number(((correctCount / submissions.length) * 100).toFixed(1)) : 0;

    return {
      questionId: q.id,
      questionNumber: q.questionNumber || idx + 1,
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      correctCount,
      totalAttempts: submissions.length,
      accuracyPercentage,
      marks: q.marks,
      correctRate: accuracyPercentage,
      attemptCount: submissions.length
    };
  });

  const formattedSubmissions = submissions.map(sub => ({
    ...sub,
    studentRollNumber: sub.studentRollNumber || sub.rollNumber || '',
    totalMarksObtained: sub.totalMarksObtained ?? sub.score ?? 0,
    totalMaxMarks: sub.totalMaxMarks ?? exam.totalMarks ?? 100,
    isPassed: sub.isPassed ?? sub.passed ?? false
  }));

  return res.json({
    exam,
    totalEligibleStudents: eligibleStudents.length,
    attendedCount,
    studentsAttended: attendedCount,
    notAttendedCount,
    studentsNotAttended: notAttendedCount,
    highestScore,
    highestMarks: highestScore,
    lowestScore,
    lowestMarks: lowestScore,
    averageScore,
    averageMarks: averageScore,
    passCount,
    failCount,
    passPercentage,
    questionAnalytics: questionPerformance,
    questionPerformance,
    submissions: formattedSubmissions,
    submittedAttempts: formattedSubmissions
  });
});

// POST /api/online-exams/:id/start
// Student starts an exam attempt with server-enforced countdown timer
router.post('/:id/start', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const data = dbStore.getData();

  const exam = (data.onlineExams || []).find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  if (exam.status !== 'PUBLISHED') {
    return res.status(400).json({ error: 'This examination is not currently published.' });
  }

  const student = (data.students || []).find(s => s.userId === user?.id || s.id === user?.id);
  if (!student) {
    return res.status(403).json({ error: 'Student profile required to attend examinations.' });
  }

  // Eligibility check
  if (
    !isMatchingDepartment(exam.departmentId, student.departmentId, data.departments) ||
    Number(exam.semester) !== Number(student.currentSemester) ||
    !isMatchingSection(exam.section, student.section) ||
    !isStudentEnrolledInSubject(student, exam.subjectId, exam.subjectCode, Number(exam.semester), exam.departmentId, data)
  ) {
    return res.status(403).json({ error: 'You are not eligible for this examination cohort.' });
  }

  // Check if examination has expired
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isPastDate = exam.examDate < todayStr;
  const isPastTime = exam.examDate === todayStr && exam.endTime && currentTimeStr > exam.endTime;
  if (isPastDate || isPastTime) {
    return res.status(400).json({ error: 'This examination has expired. Deadline has passed.' });
  }

  const studentAttempts = (data.examAttempts || []).filter(
    a => a.examId === id && (a.studentId === student.id || a.studentId === user.id)
  );

  const activeAttempt = studentAttempts.find(a => a.status === 'IN_PROGRESS');

  if (activeAttempt) {
    // Check if time expired
    const elapsedSeconds = Math.floor((Date.now() - new Date(activeAttempt.startTime).getTime()) / 1000);
    const totalAllowedSeconds = exam.durationMinutes * 60;

    if (elapsedSeconds >= totalAllowedSeconds) {
      // Auto submit expired attempt
      activeAttempt.status = 'EXPIRED';
      activeAttempt.submitTime = new Date().toISOString();
      activeAttempt.timeSpentSeconds = totalAllowedSeconds;
      dbStore.save();
      return res.status(400).json({ error: 'Examination duration has expired.' });
    }

    const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    // Sanitize questions (never expose correctAnswer during test) and normalize options
    const sanitizedQuestions = (exam.questions || []).map((q: any) => {
      const { correctAnswer, explanation, ...safeQ } = q;
      return {
        ...safeQ,
        options: normalizeQuestionOptions(q.options)
      };
    });

    return res.json({
      attempt: activeAttempt,
      exam: {
        ...exam,
        questions: sanitizedQuestions
      },
      remainingSeconds
    });
  }

  // Check attempt limit
  const submittedCount = studentAttempts.filter(a => a.status === 'SUBMITTED' || a.status === 'EXPIRED').length;
  if (submittedCount >= (exam.maxAttempts || 1)) {
    return res.status(400).json({
      error: `Maximum attempts reached (${submittedCount}/${exam.maxAttempts}). You cannot retake this examination.`
    });
  }

  // Create new active attempt with server-timestamped start
  const newAttempt = {
    id: `att_${Date.now()}_${student.id.replace('std_', '')}`,
    examId: exam.id,
    studentId: student.id,
    studentName: user.name || student.rollNumber,
    rollNumber: student.rollNumber,
    departmentId: student.departmentId,
    semester: student.currentSemester,
    section: student.section,
    attemptNumber: submittedCount + 1,
    startTime: new Date().toISOString(),
    status: 'IN_PROGRESS',
    answers: {},
    markedForReview: []
  };

  if (!data.examAttempts) data.examAttempts = [];
  data.examAttempts.push(newAttempt);
  dbStore.save();

  const sanitizedQuestions = (exam.questions || []).map((q: any) => {
    const { correctAnswer, explanation, ...safeQ } = q;
    return {
      ...safeQ,
      options: normalizeQuestionOptions(q.options)
    };
  });

  return res.status(201).json({
    attempt: newAttempt,
    exam: {
      ...exam,
      questions: sanitizedQuestions
    },
    remainingSeconds: exam.durationMinutes * 60
  });
});

// POST /api/online-exams/:id/save-answer
// Autosave individual answers during exam
router.post('/:id/save-answer', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const data = dbStore.getData();
  const { questionId, selectedOption, isMarkedForReview } = req.body;

  const attempt = (data.examAttempts || []).find(
    a => a.examId === id && (a.studentId === user?.id || (a as any).studentName === user?.name || (a.answers && a.status === 'IN_PROGRESS'))
  );

  if (!attempt || attempt.status !== 'IN_PROGRESS') {
    return res.status(400).json({ error: 'No active examination attempt found.' });
  }

  const exam = (data.onlineExams || []).find(e => e.id === id);
  if (exam) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000);
    const totalAllowedSeconds = exam.durationMinutes * 60 + 30; // 30s grace for network
    if (elapsedSeconds > totalAllowedSeconds) {
      attempt.status = 'EXPIRED';
      dbStore.save();
      return res.status(400).json({ error: 'Examination duration expired. Answer cannot be saved.' });
    }
  }

  if (!attempt.answers) attempt.answers = {};
  if (selectedOption !== undefined) {
    if (selectedOption === null || selectedOption === '') {
      delete attempt.answers[questionId];
    } else {
      attempt.answers[questionId] = selectedOption;
    }
  }

  if (isMarkedForReview !== undefined) {
    if (!attempt.markedForReview) attempt.markedForReview = [];
    if (isMarkedForReview) {
      if (!attempt.markedForReview.includes(questionId)) {
        attempt.markedForReview.push(questionId);
      }
    } else {
      attempt.markedForReview = attempt.markedForReview.filter((qid: string) => qid !== questionId);
    }
  }

  dbStore.save();
  return res.json({ success: true, savedAt: new Date().toISOString() });
});

// POST /api/online-exams/:id/submit
// Final submission with server-side automatic evaluation
router.post('/:id/submit', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const data = dbStore.getData();

  const exam = (data.onlineExams || []).find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: 'Online examination not found.' });
  }

  const student = (data.students || []).find(s => s.userId === user?.id || s.id === user?.id);
  const studentId = student ? student.id : user?.id;

  const attempt = (data.examAttempts || []).find(
    a => a.examId === id && (a.studentId === studentId || a.studentId === user?.id) && a.status === 'IN_PROGRESS'
  );

  if (!attempt) {
    // If already submitted, return existing attempt
    const existingSubmitted = (data.examAttempts || []).find(
      a => a.examId === id && (a.studentId === studentId || a.studentId === user?.id) && a.status === 'SUBMITTED'
    );
    if (existingSubmitted) {
      return res.json({
        message: 'Examination already submitted.',
        attempt: {
          ...existingSubmitted,
          questionEvaluations: exam.resultsReleased ? existingSubmitted.questionEvaluations : undefined
        }
      });
    }
    return res.status(400).json({ error: 'No active attempt to submit.' });
  }

  // Automatic Evaluation on Server
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalScoreEarned = 0;

  const evaluations = (exam.questions || []).map((q: any) => {
    const studentChoice = attempt.answers ? attempt.answers[q.id] : undefined;
    const isAnswered = studentChoice !== undefined && studentChoice !== '' && studentChoice !== null;
    const isCorrect = isAnswered && studentChoice === q.correctAnswer;

    let marksAwarded = 0;
    if (isCorrect) {
      marksAwarded = Number(q.marks) || 1;
      correctCount++;
    } else if (isAnswered) {
      marksAwarded = exam.negativeMarking ? -(Number(q.negativeMarks) || Number(exam.negativeMarksPerQuestion) || 0) : 0;
      incorrectCount++;
    } else {
      marksAwarded = 0;
      unansweredCount++;
    }

    totalScoreEarned += marksAwarded;

    return {
      questionId: q.id,
      selectedOption: studentChoice || '',
      correctOption: q.correctAnswer,
      isCorrect,
      marksAwarded,
      explanation: q.explanation || ''
    };
  });

  const finalScore = Math.max(0, totalScoreEarned);
  const percentage = exam.totalMarks > 0 ? Number(((finalScore / exam.totalMarks) * 100).toFixed(1)) : 0;
  const passed = finalScore >= (exam.passMarks || 0);
  const timeSpent = Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000);

  attempt.status = 'SUBMITTED';
  attempt.submitTime = new Date().toISOString();
  attempt.timeSpentSeconds = timeSpent;
  attempt.score = finalScore;
  attempt.totalMarks = exam.totalMarks;
  attempt.totalMarksObtained = finalScore;
  attempt.totalMaxMarks = exam.totalMarks;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.isPassed = passed;
  attempt.correctCount = correctCount;
  attempt.incorrectCount = incorrectCount;
  attempt.unansweredCount = unansweredCount;
  attempt.questionEvaluations = evaluations;

  // If immediate release
  if (exam.resultPublication === 'IMMEDIATE') {
    exam.resultsReleased = true;
  }

  dbStore.save();

  emitToRole('faculty', 'online_exam:submitted', {
    examId: exam.id,
    studentId: attempt.studentId,
    studentName: attempt.studentName,
    rollNumber: attempt.rollNumber,
    score: finalScore,
    totalMarks: exam.totalMarks,
    percentage,
    passed
  });

  dbStore.logAudit(
    'Exam Submitted',
    attempt.studentName,
    'student',
    `Exam ${exam.title}`,
    `Submitted exam (${correctCount} correct, ${incorrectCount} incorrect, ${unansweredCount} unanswered, score: ${finalScore}/${exam.totalMarks})`
  );

  return res.json({
    message: 'Examination submitted successfully!',
    attempt: {
      ...attempt,
      questionEvaluations: exam.resultsReleased ? evaluations : undefined,
      score: exam.resultsReleased ? finalScore : undefined,
      percentage: exam.resultsReleased ? percentage : undefined,
      passed: exam.resultsReleased ? passed : undefined
    },
    resultsReleased: exam.resultsReleased
  });
});

export default router;