import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore } from '../store/storage';
import { emitToAll, emitToRole } from '../socket';

const router = Router();

// GET /api/students
router.get('/', (req: Request, res: Response) => {
  const { departmentId, semester, section } = req.query;
  const data = dbStore.getData();

  let list = data.students;
  if (departmentId && departmentId !== 'all') {
    list = list.filter(s => s.departmentId === departmentId);
  }
  if (semester) {
    list = list.filter(s => s.currentSemester === Number(semester));
  }
  if (section && section !== 'all') {
    list = list.filter(s => s.section === section);
  }

  const populated = list.map(s => {
    const user = data.users.find(u => u.id === s.userId);
    return {
      ...s,
      name: user ? user.name : 'Unknown Student',
      email: user ? user.email : '',
      phone: user ? user.phone : ''
    };
  });

  return res.json(populated);
});

// GET /api/students/user/:userId
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = dbStore.getData();
  const profile = data.students.find(s => s.userId === userId);
  if (!profile) {
    return res.status(404).json({ error: 'Student profile not found for user.' });
  }
  dbStore.recalculateAttendance(profile.id);
  const updatedProfile = data.students.find(s => s.id === profile.id);
  return res.json(updatedProfile);
});

// GET /api/students/next-roll
router.get('/next-roll', (req: Request, res: Response) => {
  const nextRoll = dbStore.getNextRegisterNumber();
  return res.json({ nextRollNumber: nextRoll });
});

// GET /api/students/:id
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const profile = data.students.find(s => s.id === id);
  if (!profile) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }
  return res.json(profile);
});

// POST /api/students
router.post('/', (req: Request, res: Response) => {
  const { name, email, rollNumber, departmentId, departmentName, currentSemester, section, phone, academicYear, batch } = req.body;
  if (!name || !email || !departmentId || !currentSemester) {
    return res.status(400).json({ error: 'Name, email, department, and semester are required.' });
  }

  const data = dbStore.getData();
  const cleanEmail = email.trim().toLowerCase();

  const dept = data.departments.find(d => d.id === departmentId);
  if (!dept) {
    return res.status(404).json({ error: 'Selected department does not exist.' });
  }

  const semNum = Number(currentSemester);
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ error: 'Semester must be between 1 and 8.' });
  }

  // Register Number starting with 99
  let cleanRoll = rollNumber ? rollNumber.trim().toUpperCase() : '';
  if (!cleanRoll) {
    cleanRoll = dbStore.getNextRegisterNumber();
  } else if (!cleanRoll.startsWith('99')) {
    return res.status(400).json({ error: 'Register number must start with 99 (e.g. 990000001).' });
  }

  if (data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: 'User with this email already exists.' });
  }
  if (data.students.some(s => s.rollNumber.toUpperCase() === cleanRoll)) {
    return res.status(409).json({ error: `Register number ${cleanRoll} already assigned to another student.` });
  }

  // Validate section and capacity
  const targetSection = (section || `${dept.code}-A`).trim().toUpperCase();
  const capacityCheck = dbStore.checkSectionCapacity(departmentId, targetSection);
  if (!capacityCheck.allowed) {
    return res.status(400).json({ error: capacityCheck.error });
  }

  const user = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: cleanEmail,
    passwordHash: bcrypt.hashSync('student123', 10),
    role: 'student' as const,
    phone: phone || '',
    status: 'active' as const,
    createdAt: new Date().toISOString().split('T')[0]
  };
  data.users.push(user);

  const profile = {
    id: `std_${Date.now()}`,
    userId: user.id,
    rollNumber: cleanRoll,
    registrationNumber: cleanRoll,
    departmentId,
    departmentName: dept.name,
    currentSemester: semNum,
    section: targetSection,
    admissionYear: new Date().getFullYear(),
    academicYear: academicYear || '2026-2027',
    batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
    cgpa: 0,
    currentSgpa: 0,
    attendancePercentage: 0
  };
  data.students.push(profile);

  // Auto-enroll into all department + semester curriculum subjects
  const semesterSubjects = data.subjects.filter(
    s => s.departmentId === departmentId && s.semester === semNum && (s.status === 'active' || !s.status)
  );

  semesterSubjects.forEach(s => {
    data.enrollments.push({
      id: `enr_${Date.now()}_${s.id}`,
      studentId: profile.id,
      subjectId: s.id,
      subjectCode: s.code,
      subjectName: s.name,
      instructorName: s.assignedFacultyName || 'Unassigned',
      credits: s.credits,
      attendedClasses: 0,
      totalClasses: 0,
      attendancePercentage: 0,
      semester: s.semester,
      academicYear: '2026-2027'
    });
  });

  dbStore.save();
  dbStore.logAudit('Student Registered', (req as any).user?.name || 'Admin', 'admin', `Student ${name}`, `Register No: ${cleanRoll}, Dept: ${dept.code}, Section: ${targetSection}`);

  const { passwordHash: _, ...userSafe } = user;

  emitToAll('student:created', {
    student: profile,
    user: userSafe,
    sections: dbStore.getData().sections
  });
  emitToRole('admin', 'section:updated', {
    sections: dbStore.getData().sections
  });

  return res.status(201).json({ user: userSafe, profile });
});

// PUT /api/students/:id
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = dbStore.getData();

  const idx = data.students.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Prevent modifying register number
  delete updates.rollNumber;
  delete updates.registrationNumber;

  // If section changed, validate capacity of new section
  if (updates.section && updates.section !== data.students[idx].section) {
    const deptId = updates.departmentId || data.students[idx].departmentId;
    const capacityCheck = dbStore.checkSectionCapacity(deptId, updates.section);
    if (!capacityCheck.allowed) {
      return res.status(400).json({ error: capacityCheck.error });
    }
  }

  data.students[idx] = { ...data.students[idx], ...updates };
  dbStore.save();

  emitToAll('student:updated', {
    student: data.students[idx],
    sections: dbStore.getData().sections
  });

  return res.json(data.students[idx]);
});

// GET /api/students/enrollments/all
router.get('/enrollments/all', (req: Request, res: Response) => {
  const data = dbStore.getData();
  return res.json(data.enrollments || []);
});

// GET /api/students/results/all
router.get('/results/all', (req: Request, res: Response) => {
  const data = dbStore.getData();
  return res.json(data.results || []);
});

// GET /api/students/:id/enrollments
router.get('/:id/enrollments', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  dbStore.recalculateAttendance(id);
  const enrollments = data.enrollments.filter(e => e.studentId === id);
  return res.json(enrollments);
});

// GET /api/students/:id/results
router.get('/:id/results', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const student = data.students.find(s => s.id === id || s.userId === id || s.rollNumber === id);
  const targetId = student ? student.id : id;
  const results = (data.results || []).filter(r => r.studentId === targetId || (student && r.studentId === student.userId));
  return res.json(results);
});

export default router;
