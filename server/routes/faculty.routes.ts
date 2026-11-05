import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore } from '../store/storage';
import { emitToAll } from '../socket';

const router = Router();

// GET /api/faculty
router.get('/', (req: Request, res: Response) => {
  const { departmentId } = req.query;
  const data = dbStore.getData();

  let list = data.faculty;
  if (departmentId && departmentId !== 'all') {
    list = list.filter(f => f.departmentId === departmentId);
  }

  const populated = list.map(f => {
    const user = data.users.find(u => u.id === f.userId);
    return {
      ...f,
      name: user ? user.name : 'Unknown Faculty',
      email: user ? user.email : '',
      phone: user ? user.phone : ''
    };
  });

  return res.json(populated);
});

// GET /api/faculty/user/:userId
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const data = dbStore.getData();
  const profile = data.faculty.find(f => f.userId === userId);
  if (!profile) {
    return res.status(404).json({ error: 'Faculty profile not found for user.' });
  }
  return res.json(profile);
});

// GET /api/faculty/assignments
router.get('/assignments', (req: Request, res: Response) => {
  const { facultyId, departmentId, section } = req.query;
  const data = dbStore.getData();
  let list = data.teachingAssignments || [];
  if (facultyId) {
    list = list.filter(ta => ta.facultyId === facultyId || ta.facultyUserId === facultyId);
  }
  if (departmentId) {
    list = list.filter(ta => ta.departmentId === departmentId);
  }
  if (section) {
    list = list.filter(ta => ta.section === section);
  }
  return res.json(list);
});

// DELETE /api/faculty/assignments/:assignmentId
router.delete('/assignments/:assignmentId', (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const data = dbStore.getData();
  const initialLen = (data.teachingAssignments || []).length;
  data.teachingAssignments = (data.teachingAssignments || []).filter(ta => ta.id !== assignmentId);
  if (data.teachingAssignments.length < initialLen) {
    dbStore.save();
    return res.json({ message: 'Teaching assignment removed successfully.' });
  }
  return res.status(404).json({ error: 'Assignment not found.' });
});

// GET /api/faculty/:id
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const profile = data.faculty.find(f => f.id === id);
  if (!profile) {
    return res.status(404).json({ error: 'Faculty profile not found.' });
  }
  return res.json(profile);
});

// POST /api/faculty
router.post('/', (req: Request, res: Response) => {
  const {
    name,
    email,
    employeeId,
    designation,
    departmentId,
    departmentName,
    officeRoom,
    qualification,
    specialization,
    phone,
    semester,
    subjectId,
    assignedSubjectIds,
    assignedSections,
    isHOD
  } = req.body;

  if (!name || !email || !employeeId || !designation || !departmentId) {
    return res.status(400).json({ error: 'Name, email, employee ID (FAC...), designation, and department are required.' });
  }

  const data = dbStore.getData();
  const cleanEmail = email.trim().toLowerCase();
  const cleanEmpId = employeeId.trim().toUpperCase();

  const dept = data.departments.find(d => d.id === departmentId);
  if (!dept) {
    return res.status(404).json({ error: 'Department does not exist.' });
  }

  const existingUser = data.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    if (data.faculty.some(f => f.userId === existingUser.id)) {
      return res.status(409).json({ error: 'Faculty profile already exists for this email.' });
    }
  }
  if (data.faculty.some(f => f.employeeId.toUpperCase() === cleanEmpId)) {
    return res.status(409).json({ error: 'Faculty ID already assigned to another instructor.' });
  }

  // Validate assigned subject belongs to department
  const subIds: string[] = [];
  if (subjectId) subIds.push(subjectId);
  if (Array.isArray(assignedSubjectIds)) {
    assignedSubjectIds.forEach(sid => { if (!subIds.includes(sid)) subIds.push(sid); });
  }

  for (const sid of subIds) {
    const s = data.subjects.find(sub => sub.id === sid);
    if (s && s.departmentId !== departmentId) {
      return res.status(400).json({
        error: `Subject mismatch: "${s.name}" (${s.code}) belongs to another department, not ${dept.name}.`
      });
    }
  }

  // Validate sections belong to department
  const sectionsList: string[] = Array.isArray(assignedSections) ? assignedSections : (assignedSections ? [assignedSections] : []);
  for (const secName of sectionsList) {
    const validSec = (data.sections || []).find(
      sec => sec.departmentId === departmentId && (sec.name === secName || sec.sectionCode === secName)
    );
    if (!validSec) {
      // Check if it matches department code prefix
      const matchDept = secName.toUpperCase().startsWith(dept.code.toUpperCase()) || ['A', 'B', 'C', 'D'].includes(secName.toUpperCase());
      if (!matchDept) {
        return res.status(400).json({
          error: `Section "${secName}" does not belong to ${dept.name} (${dept.code}).`
        });
      }
    }
  }

  let user = existingUser;
  if (!user) {
    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: bcrypt.hashSync('faculty123', 10),
      role: 'faculty' as const,
      phone: phone || '',
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0]
    };
    data.users.push(user);
  } else {
    user.role = 'faculty';
    user.name = name.trim();
  }

  const profile = {
    id: `fac_${Date.now()}`,
    userId: user.id,
    employeeId: cleanEmpId,
    designation: designation.trim(),
    departmentId,
    departmentName: dept ? dept.name : (departmentName || 'Engineering'),
    qualification: qualification || 'M.Tech / Ph.D.',
    specialization: specialization || 'Core Engineering Curriculum',
    officeRoom: officeRoom || 'Faculty Cabin',
    totalClassesAssigned: 0,
    assignedSections: sectionsList.length > 0 ? sectionsList : [`${dept.code}-A`],
    assignedSubjectIds: subIds,
    isHOD: Boolean(isHOD),
    hodDepartmentId: isHOD ? departmentId : undefined
  };
  data.faculty.push(profile);

  // Recalculate department total faculty
  dept.totalFaculty = data.faculty.filter(f => f.departmentId === dept.id).length;

  // If designated as HOD, update department record
  if (isHOD) {
    dept.hodName = user.name;
    dept.hodEmail = user.email;
  }

  // Create teaching assignments
  if (!data.teachingAssignments) data.teachingAssignments = [];
  subIds.forEach(sid => {
    const sub = data.subjects.find(s => s.id === sid);
    if (sub) {
      sub.assignedFacultyId = user.id;
      sub.assignedFacultyName = user.name;

      profile.assignedSections.forEach(secName => {
        data.teachingAssignments.push({
          id: `ta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          facultyId: profile.id,
          facultyUserId: user.id,
          facultyName: user.name,
          departmentId,
          subjectId: sub.id,
          subjectCode: sub.code,
          subjectName: sub.name,
          semester: sub.semester,
          section: secName,
          academicYear: '2026-2027',
          status: 'active'
        });
      });
    }
  });

  dbStore.save();
  dbStore.logAudit('Faculty Registered', (req as any).user?.name || 'Admin', 'admin', `Faculty ${name}`, `ID: ${cleanEmpId}, Dept: ${dept.code}, Sections: ${profile.assignedSections.join(', ')}`);

  const { passwordHash: _, ...userSafe } = user;

  emitToAll('faculty:created', { user: userSafe, profile });
  emitToAll('academic:updated', { type: 'faculty' });

  return res.status(201).json({ user: userSafe, profile });
});

// GET /api/faculty/:id/teaching-assignments
router.get('/:id/teaching-assignments', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const assignments = (data.teachingAssignments || []).filter(
    ta => ta.facultyId === id || ta.facultyUserId === id
  );
  return res.json(assignments);
});

// POST /api/faculty/:id/allocate (Allocate subject & section)
router.post('/:id/allocate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { subjectId, section } = req.body;
  if (!subjectId || !section) {
    return res.status(400).json({ error: 'Subject and Section are required.' });
  }

  const data = dbStore.getData();
  const fac = data.faculty.find(f => f.id === id || f.userId === id);
  if (!fac) {
    return res.status(404).json({ error: 'Faculty not found.' });
  }

  const sub = data.subjects.find(s => s.id === subjectId);
  if (!sub) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  if (sub.departmentId !== fac.departmentId) {
    return res.status(400).json({ error: 'Faculty can only be allocated to subjects in their own department.' });
  }

  const facultyUser = data.users.find(u => u.id === fac.userId);

  if (!fac.assignedSections) fac.assignedSections = [];
  if (!fac.assignedSections.includes(section)) fac.assignedSections.push(section);

  if (!fac.assignedSubjectIds) fac.assignedSubjectIds = [];
  if (!fac.assignedSubjectIds.includes(subjectId)) fac.assignedSubjectIds.push(subjectId);

  sub.assignedFacultyId = fac.userId;
  sub.assignedFacultyName = facultyUser ? facultyUser.name : 'Faculty Instructor';

  if (!data.teachingAssignments) data.teachingAssignments = [];
  const exists = data.teachingAssignments.some(
    ta => (ta.facultyId === fac.id || ta.facultyUserId === fac.userId) && ta.subjectId === subjectId && ta.section === section
  );

  let newTA = null;
  if (!exists) {
    newTA = {
      id: `ta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      facultyId: fac.id,
      facultyUserId: fac.userId,
      facultyName: facultyUser ? facultyUser.name : 'Faculty Instructor',
      departmentId: fac.departmentId,
      subjectId: sub.id,
      subjectCode: sub.code,
      subjectName: sub.name,
      semester: sub.semester,
      section,
      academicYear: '2026-2027',
      status: 'active'
    };
    data.teachingAssignments.push(newTA);
  }

  dbStore.save();
  dbStore.logAudit('Faculty Allocation Updated', (req as any).user?.name || 'Admin', 'admin', `Faculty ${facultyUser?.name}`, `Allocated ${sub.code} for section ${section}`);

  emitToAll('faculty:updated', { faculty: fac, assignment: newTA });
  emitToAll('academic:updated', { type: 'allocation' });

  return res.json({ message: 'Subject allocated to faculty successfully.', faculty: fac, assignment: newTA });
});

// PUT /api/faculty/:id
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = dbStore.getData();

  const idx = data.faculty.findIndex(f => f.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Faculty profile not found.' });
  }

  // Handle HOD designation
  if (updates.isHOD !== undefined) {
    const fac = data.faculty[idx];
    const dept = data.departments.find(d => d.id === fac.departmentId);
    if (dept) {
      if (updates.isHOD) {
        fac.isHOD = true;
        fac.hodDepartmentId = dept.id;
        const u = data.users.find(user => user.id === fac.userId);
        dept.hodName = u ? u.name : fac.designation;
        dept.hodEmail = u ? u.email : '';
      } else {
        fac.isHOD = false;
        fac.hodDepartmentId = undefined;
      }
    }
  }

  data.faculty[idx] = { ...data.faculty[idx], ...updates };
  dbStore.save();

  emitToAll('faculty:updated', { profile: data.faculty[idx] });
  emitToAll('academic:updated', { type: 'faculty' });

  return res.json(data.faculty[idx]);
});

export default router;
