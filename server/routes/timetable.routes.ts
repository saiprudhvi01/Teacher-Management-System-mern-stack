import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToCohort, emitToFaculty, emitToRole } from '../socket';

const router = Router();

// Helper to normalize any time string (e.g. "09:00", "9:00 AM", "01:00 PM") to 24-hr "HH:MM"
function normalizeTo24Hour(timeStr: string): string {
  if (!timeStr) return '09:00';
  const clean = timeStr.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    const isPM = clean.includes('PM');
    const withoutPeriod = clean.replace(/[AP]M/, '').trim();
    const [h, m = '00'] = withoutPeriod.split(':');
    let hours = parseInt(h, 10);
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  const parts = clean.split(':');
  const h = parts[0].padStart(2, '0');
  const m = (parts[1] || '00').padStart(2, '0');
  return `${h}:${m}`;
}

function parseMinutes(t24: string): number {
  const [h, m] = t24.split(':').map(Number);
  return h * 60 + (m || 0);
}

function checkTimetableOverlap(
  candidate: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    facultyId: string;
    departmentId: string;
    semester: number;
    section: string;
    subjectId?: string;
    excludeId?: string;
  },
  existingList: any[],
  subjectsList: any[] = []
): { hasConflict: boolean; reason?: string } {
  const startNorm = normalizeTo24Hour(candidate.startTime);
  const endNorm = normalizeTo24Hour(candidate.endTime);

  const startMin = parseMinutes(startNorm);
  const endMin = parseMinutes(endNorm);

  if (endMin <= startMin) {
    return {
      hasConflict: true,
      reason: 'Invalid Timeslot: End time must be later than start time.'
    };
  }

  // 1. Working hours check: 9:00 AM (09:00 = 540 min) to 5:00 PM (17:00 = 1020 min)
  if (startMin < 9 * 60 || endMin > 17 * 60) {
    return {
      hasConflict: true,
      reason: `College Working Hours Violation: Classes can only be scheduled between 09:00 AM and 05:00 PM (Selected: ${startNorm} - ${endNorm}).`
    };
  }

  // 2. Lunch Break check: 12:00 PM (12:00 = 720 min) to 1:00 PM (13:00 = 780 min)
  const lunchStart = 12 * 60;
  const lunchEnd = 13 * 60;
  if (startMin < lunchEnd && endMin > lunchStart) {
    return {
      hasConflict: true,
      reason: `Lunch Period Conflict: 12:00 PM to 01:00 PM is reserved for College Lunch Break. Classes cannot overlap with lunch.`
    };
  }

  // 3. Duration check based on subject type
  if (candidate.subjectId) {
    const sub = subjectsList.find(s => s.id === candidate.subjectId || s.code === candidate.subjectId);
    if (sub) {
      const durationHours = (endMin - startMin) / 60;
      if (sub.type === 'Lab only' && durationHours !== 2) {
        return {
          hasConflict: true,
          reason: `Lab Duration Requirement: Practical/Lab courses must be scheduled for exactly 2 continuous hours (Current: ${durationHours} hr).`
        };
      }
      if (sub.type === 'Theory' && durationHours !== 1) {
        return {
          hasConflict: true,
          reason: `Theory Duration Requirement: Standard theory lecture periods must be exactly 1 hour (Current: ${durationHours} hr).`
        };
      }
    }
  }

  // 4. Overlap with existing timetable entries
  for (const item of existingList) {
    if (candidate.excludeId && item.id === candidate.excludeId) continue;
    if (item.dayOfWeek.toUpperCase() === candidate.dayOfWeek.toUpperCase()) {
      const itemStart = parseMinutes(normalizeTo24Hour(item.startTime));
      const itemEnd = parseMinutes(normalizeTo24Hour(item.endTime));

      const overlap = (startMin < itemEnd && endMin > itemStart);

      if (overlap) {
        if (item.room.toLowerCase().trim() === candidate.room.toLowerCase().trim()) {
          return {
            hasConflict: true,
            reason: `Room Conflict: ${candidate.room} is already booked on ${candidate.dayOfWeek} (${item.startTime} - ${item.endTime}) for ${item.subjectCode} (${item.facultyName}).`
          };
        }
        if (candidate.facultyId && item.facultyId === candidate.facultyId) {
          return {
            hasConflict: true,
            reason: `Faculty Double-Booking: Instructor is already assigned to lecture in ${item.room} on ${candidate.dayOfWeek} (${item.startTime} - ${item.endTime}).`
          };
        }
        if (
          item.departmentId === candidate.departmentId &&
          Number(item.semester) === Number(candidate.semester) &&
          item.section.toUpperCase() === candidate.section.toUpperCase()
        ) {
          return {
            hasConflict: true,
            reason: `Section Collision: Semester ${candidate.semester} Section ${candidate.section} already has ${item.subjectCode} scheduled at this period (${item.startTime} - ${item.endTime}).`
          };
        }
      }
    }
  }

  return { hasConflict: false };
}

// GET /api/timetable/class
router.get('/class', (req: Request, res: Response) => {
  const { departmentId, semester, section, facultyId } = req.query;
  const data = dbStore.getData();

  let list = data.classTimetable;
  if (departmentId && departmentId !== 'all') {
    list = list.filter(t => t.departmentId === departmentId);
  }
  if (semester) {
    list = list.filter(t => t.semester === Number(semester));
  }
  if (section && section !== 'all') {
    list = list.filter(t => t.section.toUpperCase() === (section as string).toUpperCase());
  }
  if (facultyId) {
    list = list.filter(t => t.facultyId === facultyId);
  }

  return res.json(list);
});

// POST /api/timetable/class/validate
router.post('/class/validate', (req: Request, res: Response) => {
  const candidate = req.body;
  const data = dbStore.getData();
  const conflict = checkTimetableOverlap(candidate, data.classTimetable, data.subjects);
  return res.json(conflict);
});

// POST /api/timetable/class
router.post('/class', (req: Request, res: Response) => {
  const { dayOfWeek, startTime, endTime, subjectId, departmentId, semester, section, room, facultyId } = req.body;
  if (!dayOfWeek || !startTime || !endTime || !subjectId || !room) {
    return res.status(400).json({ error: 'All timetable slot details are required.' });
  }

  const data = dbStore.getData();
  const subject = data.subjects.find(s => s.id === subjectId || s.code === subjectId);
  if (!subject) {
    return res.status(404).json({ error: 'Selected subject does not exist.' });
  }

  const facultyUser = data.users.find(u => u.id === facultyId);

  const startNorm = normalizeTo24Hour(startTime);
  const endNorm = normalizeTo24Hour(endTime);

  const conflictCheck = checkTimetableOverlap(
    {
      dayOfWeek,
      startTime: startNorm,
      endTime: endNorm,
      room,
      facultyId: facultyId || '',
      departmentId: departmentId || subject.departmentId,
      semester: Number(semester) || subject.semester,
      section: section || 'A',
      subjectId: subject.id
    },
    data.classTimetable,
    data.subjects
  );

  if (conflictCheck.hasConflict) {
    return res.status(409).json({ error: conflictCheck.reason });
  }

  const newEntry = {
    id: `tt_${Date.now()}`,
    dayOfWeek,
    startTime: startNorm,
    endTime: endNorm,
    subjectId: subject.id,
    subjectCode: subject.code,
    subjectName: subject.name,
    departmentId: departmentId || subject.departmentId,
    semester: Number(semester) || subject.semester,
    section: section || 'A',
    room,
    facultyId: facultyId || (subject.assignedFacultyId || ''),
    facultyName: facultyUser ? facultyUser.name : (subject.assignedFacultyName || 'Assigned Professor'),
    isPublished: true
  };

  data.classTimetable.push(newEntry);
  dbStore.save();

  emitToCohort(newEntry.departmentId, newEntry.semester, newEntry.section, 'timetable:updated', { type: 'class', entry: newEntry });
  if (newEntry.facultyId) {
    emitToFaculty(newEntry.facultyId, 'timetable:updated', { type: 'class', entry: newEntry });
  }
  emitToRole('student', 'timetable:updated', { type: 'class', entry: newEntry });
  emitToRole('faculty', 'timetable:updated', { type: 'class', entry: newEntry });
  emitToRole('student', 'timetable:updated', { type: 'class', entry: newEntry });
  emitToRole('faculty', 'timetable:updated', { type: 'class', entry: newEntry });

  dbStore.logAudit('Timetable Entry Created', (req as any).user?.name || 'Admin', 'admin', `Room ${room}`, `Scheduled ${newEntry.subjectCode} on ${dayOfWeek} (${startTime}-${endTime})`);

  return res.status(201).json(newEntry);
});

// DELETE /api/timetable/class/:id
router.delete('/class/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const entry = data.classTimetable.find(t => t.id === id);
  data.classTimetable = data.classTimetable.filter(t => t.id !== id);
  dbStore.save();

  if (entry) {
    emitToCohort(entry.departmentId, entry.semester, entry.section, 'timetable:updated', { type: 'class', deletedId: id });
    if (entry.facultyId) {
      emitToFaculty(entry.facultyId, 'timetable:updated', { type: 'class', deletedId: id });
    }
  }
  emitToRole('student', 'timetable:updated', { type: 'class', deletedId: id });
  emitToRole('faculty', 'timetable:updated', { type: 'class', deletedId: id });

  dbStore.logAudit('Timetable Entry Removed', (req as any).user?.name || 'Admin', 'admin', `Slot ${id}`, 'Deleted class period');
  return res.json({ message: 'Timetable entry removed successfully' });
});

// GET /api/timetable/exams
router.get('/exams', (req: Request, res: Response) => {
  const { departmentId, semester, section, publishedOnly } = req.query;
  const data = dbStore.getData();

  let list = data.examSchedules;
  if (publishedOnly === 'true') {
    list = list.filter(e => e.isPublished);
  }
  if (departmentId && departmentId !== 'all') {
    list = list.filter(e => e.departmentId === departmentId);
  }
  if (semester) {
    list = list.filter(e => e.semester === Number(semester));
  }
  if (section && section !== 'all') {
    list = list.filter(e => e.section === section);
  }

  return res.json(list);
});

// POST /api/timetable/exams
router.post('/exams', (req: Request, res: Response) => {
  const { departmentId, semester, section, examType, subjectId, examDate, startTime, endTime, room, instructions } = req.body;
  if (!examDate || !startTime || !endTime || !subjectId || !room) {
    return res.status(400).json({ error: 'Date, timeslot, subject, and room are required.' });
  }

  const data = dbStore.getData();
  const subject = data.subjects.find(s => s.id === subjectId);
  const dept = data.departments.find(d => d.id === departmentId);

  const clash = data.examSchedules.find(e => {
    if (e.examDate === examDate) {
      const overlap = (startTime <= e.startTime && endTime > e.startTime) ||
                      (startTime < e.endTime && endTime >= e.endTime);
      if (overlap) {
        if (e.room.toLowerCase().trim() === room.toLowerCase().trim()) return true;
        if (e.departmentId === departmentId && e.semester === Number(semester)) return true;
      }
    }
    return false;
  });

  if (clash) {
    return res.status(409).json({ error: `Examination Clash: Hall ${room} or cohort is already booked on ${examDate} (${clash.startTime} - ${clash.endTime}).` });
  }

  const newExam = {
    id: `exam_${Date.now()}`,
    departmentId: departmentId || (dept ? dept.id : 'dept_cse'),
    departmentName: dept ? dept.name : 'Engineering',
    semester: Number(semester) || 1,
    section: section || 'A',
    academicYear: '2026-2027',
    examType: examType || 'End-Semester Final',
    subjectId,
    subjectCode: subject ? subject.code : 'EXAM101',
    subjectName: subject ? subject.name : 'Final Examination',
    examDate,
    startTime,
    endTime,
    room,
    instructions: instructions || 'Reporting time 15 minutes prior to commencement.',
    isPublished: true
  };

  data.examSchedules.push(newExam);
  dbStore.save();

  emitToCohort(newExam.departmentId, newExam.semester, newExam.section, 'exam_timetable:updated', newExam);
  emitToRole('student', 'exam_timetable:updated', newExam);
  emitToRole('faculty', 'exam_timetable:updated', newExam);

  dbStore.logAudit('Exam Scheduled', (req as any).user?.name || 'Admin', 'admin', `Exam ${newExam.subjectCode}`, `Scheduled on ${examDate} at ${room}`);

  return res.status(201).json(newExam);
});

// PUT /api/timetable/exams/:id/publish
router.put('/exams/:id/publish', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const exam = data.examSchedules.find(e => e.id === id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam schedule not found.' });
  }

  exam.isPublished = !exam.isPublished;
  dbStore.save();

  emitToCohort(exam.departmentId, exam.semester, exam.section, 'exam_timetable:updated', exam);
  emitToRole('student', 'exam_timetable:updated', exam);
  emitToRole('faculty', 'exam_timetable:updated', exam);

  dbStore.logAudit('Exam Schedule Publish Toggled', (req as any).user?.name || 'Admin', 'admin', `Exam ${exam.subjectCode}`, `Set published to ${exam.isPublished}`);

  return res.json(exam);
});

export default router;
