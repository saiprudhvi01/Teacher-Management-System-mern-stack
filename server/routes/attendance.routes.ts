import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToStudent, emitToCohort, emitToRole, emitToAll } from '../socket';

const router = Router();

// GET /api/attendance/sessions
router.get('/sessions', (req: Request, res: Response) => {
  const { subjectId, semester, section, date, facultyId } = req.query;
  const data = dbStore.getData();

  let list = data.attendanceSessions;
  if (subjectId) {
    list = list.filter(s => s.subjectId === subjectId);
  }
  if (semester) {
    list = list.filter(s => s.semester === Number(semester));
  }
  if (section && section !== 'all') {
    list = list.filter(s => s.section === section);
  }
  if (date) {
    list = list.filter(s => s.date === date);
  }
  if (facultyId) {
    list = list.filter(s => s.facultyId === facultyId);
  }

  return res.json(list);
});

// POST /api/attendance/sessions
router.post('/sessions', (req: Request, res: Response) => {
  const { subjectId, departmentId, semester, section, date, timeSlot, facultyId, records } = req.body;
  if (!subjectId || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Subject, date, and student attendance records are required.' });
  }

  const data = dbStore.getData();
  const subject = data.subjects.find(s => s.id === subjectId);
  const user = (req as any).user;

  const newSession = {
    id: `att_sess_${Date.now()}`,
    subjectId,
    subjectCode: subject ? subject.code : 'CS401',
    departmentId: departmentId || (subject ? subject.departmentId : 'dept_cse'),
    semester: Number(semester) || 1,
    section: section || 'A',
    date,
    timeSlot: timeSlot || '09:00 - 10:00',
    facultyId: facultyId || user?.id || 'usr_fac_01',
    records,
    createdAt: new Date().toISOString()
  };

  data.attendanceSessions.unshift(newSession);
  dbStore.save();

  const studentIds = records.map((r: any) => r.studentId);
  studentIds.forEach((sid: string) => {
    dbStore.recalculateAttendance(sid);
    const updatedStudent = dbStore.getData().students.find(s => s.id === sid);
    const calculatedPct = updatedStudent?.attendancePercentage ?? 100;
    emitToStudent(sid, 'attendance:updated', {
      studentId: sid,
      subjectId,
      date,
      overallAttendance: calculatedPct,
      attendancePercentage: calculatedPct,
      session: newSession
    });
  });

  emitToCohort(newSession.departmentId, newSession.semester, newSession.section, 'attendance:session_recorded', {
    session: newSession,
    subjectCode: newSession.subjectCode,
    date
  });

  emitToRole('admin', 'analytics:updated', { type: 'attendance', timestamp: new Date().toISOString() });
  emitToRole('faculty', 'attendance:updated', { sessionId: newSession.id });
  emitToRole('student', 'attendance:session_recorded', { session: newSession });
  emitToAll('attendance:session_recorded', { session: newSession });

  dbStore.logAudit(
    'Attendance Recorded',
    user?.name || 'Faculty',
    user?.role || 'faculty',
    `Subject ${newSession.subjectCode}`,
    `Recorded period attendance for ${records.length} students on ${date} (${section})`
  );

  return res.status(201).json(newSession);
});

export default router;
