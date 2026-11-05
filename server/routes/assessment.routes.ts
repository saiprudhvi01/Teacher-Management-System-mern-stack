import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToStudent, emitToCohort, emitToRole, emitToAll } from '../socket';
import { isMatchingDepartment, isMatchingSection, isStudentEnrolledInSubject } from './onlineExam.routes';

const router = Router();

// GET /api/assessments
router.get('/', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { subjectId, semester, section, facultyId } = req.query;
  const data = dbStore.getData();

  let list = data.internalAssessments || [];

  if (user?.role === 'student') {
    const student = data.students.find(s => s.userId === user.id || s.id === user.id);
    if (!student) {
      return res.json([]);
    }
    list = list.filter(a => {
      if (a.isPublished === false) return false;
      const isDept = isMatchingDepartment(a.departmentId, student.departmentId, data.departments);
      const isSem = Number(a.semester) === Number(student.currentSemester);
      const isSec = isMatchingSection(a.section, student.section);
      const isSub = isStudentEnrolledInSubject(student, a.subjectId, a.subjectCode, Number(a.semester), a.departmentId, data);
      return isDept && isSem && isSec && isSub;
    });
    return res.json(list);
  }

  if (subjectId) {
    list = list.filter(a => a.subjectId === subjectId);
  }
  if (semester) {
    list = list.filter(a => a.semester === Number(semester));
  }
  if (section && section !== 'all') {
    list = list.filter(a => isMatchingSection(a.section, String(section)));
  }
  if (facultyId) {
    list = list.filter(a => a.facultyId === facultyId);
  }

  return res.json(list);
});

// POST /api/assessments
router.post('/', (req: Request, res: Response) => {
  const { subjectId, departmentId, semester, section, title, type, date, maxMarks, topicTag } = req.body;
  if (!subjectId || !title || !type || !date || !maxMarks) {
    return res.status(400).json({ error: 'Subject, Title, Type, Date, and Max Marks are required.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (date < todayStr) {
    return res.status(400).json({
      error: 'Date is invalid: Assessment date cannot be before today. You can only set today or future dates.'
    });
  }

  const data = dbStore.getData();
  const subject = data.subjects.find(s => s.id === subjectId);
  const user = (req as any).user;

  const newAssessment = {
    id: `cia_${Date.now()}`,
    subjectId,
    subjectCode: subject ? subject.code : 'CS401',
    subjectName: subject ? subject.name : 'Internal Assessment',
    facultyId: user?.id || 'usr_fac_01',
    facultyName: user?.name || 'Prof. Marcus Vance',
    departmentId: departmentId || (subject ? subject.departmentId : 'dept_cse'),
    semester: Number(semester) || (subject ? subject.semester : 1),
    section: section || 'All',
    title,
    type,
    date,
    maxMarks: Number(maxMarks),
    topicTag: topicTag || '',
    isPublished: true,
    createdAt: new Date().toISOString().split('T')[0]
  };

  data.internalAssessments.unshift(newAssessment);
  dbStore.save();

  emitToCohort(newAssessment.departmentId, newAssessment.semester, newAssessment.section, 'assessment:created', newAssessment);
  emitToRole('faculty', 'assessment:created', newAssessment);
  emitToRole('student', 'assessment:created', newAssessment);
  emitToAll('assessment:created', newAssessment);

  dbStore.logAudit(
    'Assessment Created',
    user?.name || 'Faculty',
    'faculty',
    `Assessment ${newAssessment.title}`,
    `Created ${type} for ${newAssessment.subjectCode} (${newAssessment.maxMarks} marks)`
  );

  return res.status(201).json(newAssessment);
});

// GET /api/assessments/:id/marks
router.get('/:id/marks', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const marks = data.assessmentMarks.filter(m => m.assessmentId === id);
  return res.json(marks);
});

// POST /api/assessments/:id/marks
router.post('/:id/marks', (req: Request, res: Response) => {
  const { id } = req.params;
  const { entries } = req.body;
  if (!entries || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'Valid marks entries array required.' });
  }

  const data = dbStore.getData();
  const assessment = data.internalAssessments.find(a => a.id === id);
  data.assessmentMarks = data.assessmentMarks.filter(m => m.assessmentId !== id);

  entries.forEach((e: any) => {
    const markRecord = {
      id: `mark_${Date.now()}_${e.studentId}`,
      assessmentId: id,
      studentId: e.studentId,
      studentName: e.studentName,
      rollNumber: e.rollNumber,
      marksObtained: Number(e.marksObtained),
      maxMarks: Number(e.maxMarks),
      feedback: e.feedback || '',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    data.assessmentMarks.push(markRecord);

    // Instant real-time dispatch to the specific student's private channel
    emitToStudent(e.studentId, 'marks:updated', {
      studentId: e.studentId,
      assessmentId: id,
      assessmentTitle: assessment?.title || 'Continuous Internal Assessment',
      subjectCode: assessment?.subjectCode || 'ACADEMIC',
      subjectName: assessment?.subjectName || '',
      marksObtained: Number(e.marksObtained),
      maxMarks: Number(e.maxMarks),
      percentage: Math.round((Number(e.marksObtained) / Math.max(1, Number(e.maxMarks))) * 100),
      feedback: e.feedback || '',
      updatedAt: markRecord.updatedAt
    });
  });

  dbStore.save();

  if (assessment) {
    emitToCohort(assessment.departmentId, assessment.semester, assessment.section, 'assessment:evaluated', {
      assessmentId: id,
      title: assessment.title,
      subjectCode: assessment.subjectCode
    });
  }

  emitToRole('admin', 'analytics:updated', { type: 'marks', assessmentId: id });
  emitToRole('faculty', 'marks:updated', { assessmentId: id });
  emitToRole('student', 'marks:updated', { assessmentId: id });
  emitToAll('marks:updated', { assessmentId: id });

  dbStore.logAudit(
    'Marks Submitted',
    (req as any).user?.name || 'Faculty',
    'faculty',
    `Assessment ${id}`,
    `Recorded marks for ${entries.length} students`
  );

  return res.json({ message: 'Marks updated successfully', count: entries.length });
});

// POST /api/assessments/record-subject-marks
router.post('/record-subject-marks', (req: Request, res: Response) => {
  const { subjectId, subjectCode, subjectName, semester, entries } = req.body;
  if (!subjectCode || !entries || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'Subject code and valid marks entries array are required.' });
  }

  const data = dbStore.getData();
  const user = (req as any).user;
  const facultyName = user?.name || 'Faculty';

  if (!data.results) {
    data.results = [];
  }

  entries.forEach((e: any) => {
    const markValue = Math.max(0, Math.min(100, Math.round(Number(e.marksObtained) || 0)));
    const internal = Math.round(markValue * 0.4);
    const external = markValue - internal;
    const grade = markValue >= 90 ? 'O' : markValue >= 80 ? 'A+' : markValue >= 70 ? 'A' : markValue >= 60 ? 'B+' : markValue >= 50 ? 'B' : markValue >= 40 ? 'C' : 'F';
    const gradePoint = markValue >= 90 ? 10 : markValue >= 80 ? 9 : markValue >= 70 ? 8 : markValue >= 60 ? 7 : markValue >= 50 ? 6 : markValue >= 40 ? 5 : 0;
    const status = markValue >= 40 ? 'Pass' : 'Fail';

    // Find student profile to verify ID
    const student = data.students.find(s => s.id === e.studentId || s.userId === e.studentId || s.rollNumber === e.rollNumber);
    const sId = student ? student.id : e.studentId;

    // Find or create result for student
    let studentResult = data.results.find(r => r.studentId === sId || (student && r.studentId === student.userId));
    if (!studentResult) {
      studentResult = {
        id: `res_${sId}_sem${semester || (student ? student.currentSemester : 6)}`,
        studentId: sId,
        semester: Number(semester) || (student ? student.currentSemester : 6),
        sgpa: gradePoint,
        cgpa: gradePoint,
        totalCredits: 4,
        termName: `Semester ${semester || (student ? student.currentSemester : 6)} Final Examinations`,
        grades: []
      };
      data.results.push(studentResult);
    }

    if (!studentResult.grades) {
      studentResult.grades = [];
    }

    let gradeRecord = studentResult.grades.find((g: any) => g.subjectCode === subjectCode || (subjectId && g.subjectId === subjectId));
    if (gradeRecord) {
      gradeRecord.internalMarks = internal;
      gradeRecord.externalMarks = external;
      gradeRecord.totalMarks = markValue;
      gradeRecord.grade = grade;
      gradeRecord.gradePoint = gradePoint;
      gradeRecord.status = status;
    } else {
      gradeRecord = {
        id: `grd_${sId}_${subjectId || subjectCode}`,
        studentId: sId,
        subjectId: subjectId || `sub_${subjectCode}`,
        subjectCode: subjectCode,
        subjectName: subjectName || subjectCode,
        semester: Number(semester) || (student ? student.currentSemester : 6),
        credits: 4,
        internalMarks: internal,
        externalMarks: external,
        totalMarks: markValue,
        grade: grade,
        gradePoint: gradePoint,
        status: status
      };
      studentResult.grades.push(gradeRecord);
    }

    // Recalculate SGPA
    const validGrades = studentResult.grades.filter((g: any) => g.credits && g.gradePoint !== undefined);
    const totalPts = validGrades.reduce((acc: number, g: any) => acc + (g.gradePoint * (g.credits || 3)), 0);
    const totalCrd = validGrades.reduce((acc: number, g: any) => acc + (g.credits || 3), 0);
    studentResult.sgpa = totalCrd > 0 ? Number((totalPts / totalCrd).toFixed(2)) : gradePoint;
    studentResult.cgpa = studentResult.sgpa;

    // Update student's profile CGPA/SGPA if student exists
    if (student) {
      student.currentSgpa = studentResult.sgpa;
      student.cgpa = studentResult.cgpa;
    }

    // Update enrollment gradePoints if enrollment exists
    const enr = data.enrollments.find(en => (en.studentId === sId || (student && en.studentId === student.userId)) && (en.subjectCode === subjectCode || en.subjectId === subjectId));
    if (enr) {
      enr.gradePoints = gradePoint;
      enr.grade = grade;
    }

    // Emit real-time notification to the student
    emitToStudent(sId, 'marks:updated', {
      studentId: sId,
      subjectCode: subjectCode,
      subjectName: subjectName || subjectCode,
      marksObtained: markValue,
      maxMarks: 100,
      grade: grade,
      gradePoint: gradePoint,
      status: status
    });

    if (student && student.userId !== sId) {
      emitToStudent(student.userId, 'marks:updated', {
        studentId: student.userId,
        subjectCode: subjectCode,
        subjectName: subjectName || subjectCode,
        marksObtained: markValue,
        maxMarks: 100,
        grade: grade,
        gradePoint: gradePoint,
        status: status
      });
    }
  });

  dbStore.save();

  emitToRole('student', 'marks:updated', { subjectCode, maxMarks: 100 });
  emitToRole('faculty', 'marks:updated', { subjectCode, maxMarks: 100 });
  emitToRole('admin', 'analytics:updated', { type: 'marks', subjectCode });
  emitToAll('marks:updated', { subjectCode });

  dbStore.logAudit(
    'Subject Marks Recorded',
    facultyName,
    'faculty',
    `Course ${subjectCode}`,
    `Recorded marks out of 100 for ${entries.length} students`
  );

  return res.json({ message: 'Subject marks recorded successfully and published to students', count: entries.length });
});

export default router;
