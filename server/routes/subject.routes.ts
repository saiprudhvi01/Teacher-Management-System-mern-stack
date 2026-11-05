import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToAll } from '../socket';

const router = Router();

// GET /api/subjects
router.get('/', (req: Request, res: Response) => {
  const { departmentId, semester } = req.query;
  const data = dbStore.getData();

  let list = data.subjects;
  if (departmentId && departmentId !== 'all') {
    list = list.filter(s => s.departmentId === departmentId);
  }
  if (semester) {
    list = list.filter(s => s.semester === Number(semester));
  }

  return res.json(list);
});

// POST /api/subjects
router.post('/', (req: Request, res: Response) => {
  const {
    code,
    name,
    departmentId,
    semester,
    credits,
    type,
    academicYear,
    theoryDuration,
    labDuration,
    status,
    syllabus,
    assignedFacultyId,
    assignedFacultyName
  } = req.body;

  if (!code || !name || !departmentId || !semester || credits === undefined) {
    return res.status(400).json({ error: 'Subject code, name, department, semester (1-8), and credits are required.' });
  }

  const semNum = Number(semester);
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return res.status(400).json({ error: 'Semester must be between 1 and 8 for B.Tech/B.E. degree.' });
  }

  const data = dbStore.getData();
  const cleanCode = code.trim().toUpperCase();

  const dept = data.departments.find(d => d.id === departmentId);
  if (!dept) {
    return res.status(404).json({ error: 'Department does not exist.' });
  }

  // Check duplicate subject code in department
  if (data.subjects.some(s => s.code === cleanCode && s.departmentId === departmentId)) {
    return res.status(409).json({ error: `Subject ${cleanCode} already exists in ${dept.name}.` });
  }

  // Determine type and durations
  const normalizedType = type === 'Lab only' ? 'Lab only' : type === 'Theory + Lab' ? 'Theory + Lab' : 'Theory';
  const calculatedTheoryDuration = normalizedType === 'Lab only' ? 0 : 1; // 1 hour for theory
  const calculatedLabDuration = (normalizedType === 'Lab only' || normalizedType === 'Theory + Lab') ? 2 : 0; // 2 continuous hours for lab

  const newSubject = {
    id: `sub_${Date.now()}_${cleanCode.toLowerCase()}`,
    code: cleanCode,
    name: name.trim(),
    departmentId,
    departmentCode: dept.code,
    semester: semNum,
    credits: Number(credits) || 3,
    type: normalizedType,
    theoryDuration: theoryDuration !== undefined ? Number(theoryDuration) : calculatedTheoryDuration,
    labDuration: labDuration !== undefined ? Number(labDuration) : calculatedLabDuration,
    academicYear: academicYear || '2026-2027',
    status: status || 'active',
    syllabus: Array.isArray(syllabus) ? syllabus : (syllabus ? [syllabus] : []),
    assignedFacultyId: assignedFacultyId || undefined,
    assignedFacultyName: assignedFacultyName || undefined
  };

  data.subjects.push(newSubject);
  dbStore.save();

  emitToAll('academic:updated', { type: 'subject', subject: newSubject, subjects: data.subjects });
  emitToAll('subject:created', { subject: newSubject, subjects: data.subjects });

  dbStore.logAudit('Subject Created', (req as any).user?.name || 'Admin', 'admin', `Subject ${newSubject.code}`, `Added curriculum: ${newSubject.name} (${newSubject.type}, Sem ${semNum})`);

  return res.status(201).json(newSubject);
});

// PUT /api/subjects/:id
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = dbStore.getData();

  const idx = data.subjects.findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  data.subjects[idx] = { ...data.subjects[idx], ...updates };
  dbStore.save();

  emitToAll('academic:updated', { type: 'subject', subject: data.subjects[idx], subjects: data.subjects });
  emitToAll('subject:updated', { subject: data.subjects[idx], subjects: data.subjects });

  dbStore.logAudit('Subject Updated', (req as any).user?.name || 'Admin', 'admin', `Subject ${data.subjects[idx].code}`, 'Updated curriculum metadata');

  return res.json(data.subjects[idx]);
});

export default router;
