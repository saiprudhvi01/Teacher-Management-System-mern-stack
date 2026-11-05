import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToRole, emitToAll } from '../socket';

const router = Router();

// GET /api/sections
router.get('/', (req: Request, res: Response) => {
  const { departmentId, status } = req.query;
  const data = dbStore.getData();

  dbStore.recalculateSectionCounts();
  let list = data.sections || [];

  if (departmentId && departmentId !== 'all') {
    list = list.filter(s => s.departmentId === departmentId);
  }
  if (status) {
    list = list.filter(s => s.status === status);
  }

  return res.json(list);
});

// GET /api/sections/:id
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const section = (data.sections || []).find(s => s.id === id);
  if (!section) {
    return res.status(404).json({ error: 'Section not found.' });
  }
  return res.json(section);
});

// POST /api/sections
router.post('/', (req: Request, res: Response) => {
  const { name, sectionCode, departmentId, capacity, status } = req.body;
  if (!name || !departmentId) {
    return res.status(400).json({ error: 'Section name and department are required.' });
  }

  const data = dbStore.getData();
  const dept = data.departments.find(d => d.id === departmentId);
  if (!dept) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  const cleanName = name.trim().toUpperCase();
  const existing = (data.sections || []).find(
    s => s.departmentId === departmentId && s.name.toUpperCase() === cleanName
  );
  if (existing) {
    return res.status(409).json({ error: `Section "${cleanName}" already exists in ${dept.name}.` });
  }

  const newSection = {
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    sectionCode: (sectionCode || cleanName.replace(/.*-/, '') || 'A').toUpperCase().trim(),
    departmentId,
    departmentCode: dept.code,
    capacity: Number(capacity) || 60,
    enrollmentCount: 0,
    status: status || 'active',
    createdAt: new Date().toISOString()
  };

  if (!data.sections) data.sections = [];
  data.sections.push(newSection);
  dbStore.save();

  emitToAll('academic:updated', { type: 'section', section: newSection, sections: data.sections });
  emitToAll('section:created', { section: newSection, sections: data.sections });
  emitToAll('section:updated', { sections: data.sections });

  dbStore.logAudit(
    'Section Created',
    (req as any).user?.name || 'Admin',
    'admin',
    `Section ${newSection.name}`,
    `Created in ${dept.code} with capacity ${newSection.capacity}`
  );

  return res.status(201).json(newSection);
});

// PUT /api/sections/:id
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, capacity, status } = req.body;
  const data = dbStore.getData();

  const idx = (data.sections || []).findIndex(s => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Section not found.' });
  }

  const currentSec = data.sections[idx];

  if (capacity !== undefined) {
    const numCap = Number(capacity);
    if (numCap < currentSec.enrollmentCount) {
      return res.status(400).json({
        error: `Cannot reduce section capacity to ${numCap}. Currently ${currentSec.enrollmentCount} students are enrolled.`
      });
    }
    currentSec.capacity = numCap;
  }

  if (name && name.trim()) {
    const cleanName = name.trim().toUpperCase();
    const duplicate = data.sections.find(
      s => s.id !== id && s.departmentId === currentSec.departmentId && s.name.toUpperCase() === cleanName
    );
    if (duplicate) {
      return res.status(409).json({ error: `Section name "${cleanName}" already exists in this department.` });
    }
    currentSec.name = cleanName;
    currentSec.sectionCode = cleanName.replace(/.*-/, '') || currentSec.sectionCode;
  }

  if (status) {
    currentSec.status = status;
  }

  dbStore.save();
  emitToAll('academic:updated', { type: 'section', section: currentSec, sections: data.sections });
  emitToAll('section:updated', { section: currentSec, sections: data.sections });

  dbStore.logAudit(
    'Section Updated',
    (req as any).user?.name || 'Admin',
    'admin',
    `Section ${currentSec.name}`,
    `Updated capacity to ${currentSec.capacity}, status: ${currentSec.status}`
  );

  return res.json(currentSec);
});

// DELETE /api/sections/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();

  const sec = (data.sections || []).find(s => s.id === id);
  if (!sec) {
    return res.status(404).json({ error: 'Section not found.' });
  }

  if (sec.enrollmentCount > 0) {
    return res.status(400).json({
      error: `Cannot delete section "${sec.name}". It currently has ${sec.enrollmentCount} enrolled students.`
    });
  }

  data.sections = data.sections.filter(s => s.id !== id);
  dbStore.save();

  emitToAll('academic:updated', { type: 'section_deleted', id, sections: data.sections });
  emitToAll('section:updated', { deletedId: id, sections: data.sections });

  dbStore.logAudit(
    'Section Deleted',
    (req as any).user?.name || 'Admin',
    'admin',
    `Section ${sec.name}`,
    `Removed section from department`
  );

  return res.json({ message: 'Section removed successfully.' });
});

export default router;
