import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';

const router = Router();

// GET /api/departments
router.get('/', (req: Request, res: Response) => {
  const data = dbStore.getData();
  const depts = data.departments.map(d => {
    const studentCount = data.students.filter(s => s.departmentId === d.id).length;
    const facultyCount = data.faculty.filter(f => f.departmentId === d.id).length;
    return {
      ...d,
      totalStudents: studentCount,
      totalFaculty: facultyCount
    };
  });
  return res.json(depts);
});

// POST /api/departments
router.post('/', (req: Request, res: Response) => {
  const { code, name, hodName, hodEmail, description, numberOfSections, hodFacultyId } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Code and Name are required.' });
  }

  const data = dbStore.getData();
  const cleanCode = code.trim().toUpperCase();

  if (data.departments.some(d => d.code === cleanCode)) {
    return res.status(409).json({ error: `Department code ${cleanCode} already exists.` });
  }

  const numSections = Math.min(Math.max(Number(numberOfSections) || 3, 1), 10);

  const newDept = {
    id: `dept_${Date.now()}`,
    code: cleanCode,
    name: name.trim(),
    hodName: hodName ? hodName.trim() : '',
    hodEmail: hodEmail ? hodEmail.trim() : '',
    description: description ? description.trim() : '',
    totalStudents: 0,
    totalFaculty: 0,
    totalSemesters: 8,
    numberOfSections: numSections
  };

  data.departments.push(newDept);

  // Automatically create the specified number of section records (e.g. CSE-A, CSE-B, CSE-C)
  if (!data.sections) data.sections = [];
  const sectionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  for (let i = 0; i < numSections; i++) {
    const letter = sectionLetters[i] || `Sec${i + 1}`;
    const secName = `${cleanCode}-${letter}`;
    data.sections.push({
      id: `sec_${Date.now()}_${cleanCode.toLowerCase()}_${letter.toLowerCase()}`,
      name: secName,
      sectionCode: letter,
      departmentId: newDept.id,
      departmentCode: cleanCode,
      capacity: 60, // default 60 capacity
      enrollmentCount: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  }

  // If HOD faculty member was specified, designate them as HOD
  if (hodFacultyId) {
    const fac = data.faculty.find(f => f.id === hodFacultyId || f.userId === hodFacultyId);
    if (fac) {
      fac.isHOD = true;
      fac.hodDepartmentId = newDept.id;
      const user = data.users.find(u => u.id === fac.userId);
      newDept.hodName = user ? user.name : fac.designation;
      newDept.hodEmail = user ? user.email : '';
    }
  }

  dbStore.save();
  dbStore.logAudit('Department Created', (req as any).user?.name || 'Admin', 'admin', `Dept ${newDept.code}`, `Created department "${newDept.name}" with ${numSections} sections`);

  return res.status(201).json(newDept);
});

// PUT /api/departments/:id
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const data = dbStore.getData();

  const idx = data.departments.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  data.departments[idx] = { ...data.departments[idx], ...updates };
  dbStore.save();
  dbStore.logAudit('Department Updated', (req as any).user?.name || 'Admin', 'admin', `Dept ${data.departments[idx].code}`, 'Updated department details');

  return res.json(data.departments[idx]);
});

// DELETE /api/departments/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();

  const dept = data.departments.find(d => d.id === id);
  if (!dept) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  const hasStudents = data.students.some(s => s.departmentId === id);
  if (hasStudents) {
    return res.status(400).json({ error: 'Cannot delete department with enrolled students.' });
  }

  data.departments = data.departments.filter(d => d.id !== id);
  dbStore.save();
  dbStore.logAudit('Department Deleted', (req as any).user?.name || 'Admin', 'admin', `Dept ${dept.code}`, `Removed department ${dept.name}`);

  return res.json({ message: 'Department successfully deleted.' });
});

export default router;
