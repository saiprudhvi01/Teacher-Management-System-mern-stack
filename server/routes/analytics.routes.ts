import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';

const router = Router();

// GET /api/analytics/institution
router.get('/institution', (req: Request, res: Response) => {
  const data = dbStore.getData();

  const totalStudents = data.students.length;
  const totalFaculty = data.faculty.length;
  const totalDepartments = data.departments.length;
  const totalCourses = data.subjects.length;

  const totalSessions = data.attendanceSessions.length;
  const avgAttendance = totalStudents > 0
    ? Math.round((data.students.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / totalStudents) * 10) / 10
    : 0;

  const shortageStudents = data.students.filter(s => (s.attendancePercentage || 0) < 75).length;
  const lowGpaStudents = data.students.filter(s => (s.cgpa || 0) > 0 && (s.cgpa || 0) < 6.0).length;

  const departmentMetrics = data.departments.map(d => {
    const dStudents = data.students.filter(s => s.departmentId === d.id);
    const dFaculty = data.faculty.filter(f => f.departmentId === d.id);
    const dAttendance = dStudents.length > 0
      ? Math.round((dStudents.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / dStudents.length) * 10) / 10
      : 0;
    return {
      departmentId: d.id,
      code: d.code,
      name: d.name,
      students: dStudents.length,
      faculty: dFaculty.length,
      avgAttendance: dAttendance
    };
  });

  return res.json({
    totalStudents,
    totalFaculty,
    totalDepartments,
    totalCourses,
    totalSessions,
    avgAttendance,
    shortageStudents,
    lowGpaStudents,
    departmentMetrics
  });
});

// GET /api/analytics/weak-concepts
router.get('/weak-concepts', (req: Request, res: Response) => {
  const { departmentId, semester } = req.query;
  const data = dbStore.getData();

  // Aggregate concept performance from internal assessments
  const conceptsMap = new Map<string, {
    conceptName: string;
    subjectCode: string;
    subjectName: string;
    totalScores: number[];
    maxMarks: number;
  }>();

  data.internalAssessments.forEach(cia => {
    const tag = cia.topicTag || cia.title;
    const marks = data.assessmentMarks.filter(m => m.assessmentId === cia.id);
    if (marks.length > 0) {
      if (!conceptsMap.has(tag)) {
        conceptsMap.set(tag, {
          conceptName: tag,
          subjectCode: cia.subjectCode,
          subjectName: cia.subjectName,
          totalScores: [],
          maxMarks: cia.maxMarks
        });
      }
      const item = conceptsMap.get(tag)!;
      marks.forEach(m => {
        item.totalScores.push((m.marksObtained / (m.maxMarks || cia.maxMarks)) * 100);
      });
    }
  });

  const analytics = Array.from(conceptsMap.values()).map(c => {
    const avg = c.totalScores.length > 0
      ? Math.round((c.totalScores.reduce((a, b) => a + b, 0) / c.totalScores.length) * 10) / 10
      : 75;
    const belowThreshold = c.totalScores.filter(score => score < 60).length;
    const isWeak = avg < 65 || belowThreshold > 0;

    return {
      conceptId: `c_${c.conceptName.toLowerCase().replace(/\s+/g, '_')}`,
      conceptName: c.conceptName,
      subjectCode: c.subjectCode,
      subjectName: c.subjectName,
      averageScorePercentage: avg,
      benchmarkPercentage: 70,
      studentsBelowThreshold: belowThreshold,
      totalEvaluated: c.totalScores.length,
      isWeak,
      reason: isWeak
        ? `${belowThreshold} student(s) achieved below the 60% competency threshold in continuous evaluation.`
        : 'Cohort demonstrates satisfactory mastery of core fundamentals.',
      recommendedIntervention: isWeak
        ? 'Schedule supplementary hands-on recitation session and assign guided practice problem sets.'
        : 'Advance to higher-order design problems and advanced elective concepts.'
    };
  });

  return res.json(analytics);
});

// GET /api/analytics/audit-logs
router.get('/audit-logs', (req: Request, res: Response) => {
  const data = dbStore.getData();
  return res.json(data.auditLogs);
});

// POST /api/analytics/reset
router.post('/reset', (req: Request, res: Response) => {
  dbStore.resetToDefault();
  return res.json({ message: 'Database reset to default seed state' });
});

export default router;
