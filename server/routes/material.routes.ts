import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToCohort, emitToRole, emitToAll } from '../socket';

const router = Router();

// GET /api/materials
router.get('/', (req: Request, res: Response) => {
  const { subjectId, semester, departmentId } = req.query;
  const data = dbStore.getData();

  let list = data.studyMaterials;
  if (subjectId) {
    list = list.filter(m => m.subjectId === subjectId);
  }
  if (semester) {
    list = list.filter(m => m.semester === Number(semester));
  }
  if (departmentId && departmentId !== 'all') {
    const deptSubjectIds = data.subjects.filter(s => s.departmentId === departmentId).map(s => s.id);
    list = list.filter(m => deptSubjectIds.includes(m.subjectId));
  }

  return res.json(list);
});

// POST /api/materials
router.post('/', (req: Request, res: Response) => {
  const { subjectId, title, description, type, url, fileSize, semester, section } = req.body;
  if (!subjectId || !title || !url) {
    return res.status(400).json({ error: 'Subject, Title, and Resource URL are required.' });
  }

  const data = dbStore.getData();
  const subject = data.subjects.find(s => s.id === subjectId);
  const user = (req as any).user;

  const newMaterial = {
    id: `mat_${Date.now()}`,
    subjectId,
    subjectCode: subject ? subject.code : 'CS401',
    subjectName: subject ? subject.name : 'Study Material',
    facultyId: user?.id || 'usr_fac_01',
    facultyName: user?.name || 'Prof. Marcus Vance',
    title,
    description: description || '',
    type: type || 'pdf',
    fileSize: fileSize || '2.4 MB',
    url,
    downloadCount: 0,
    uploadDate: new Date().toISOString().split('T')[0],
    semester: Number(semester) || (subject ? subject.semester : 6),
    section: section || 'All'
  };

  data.studyMaterials.unshift(newMaterial);
  dbStore.save();

  const deptId = subject ? subject.departmentId : 'dept_cse';
  emitToCohort(deptId, newMaterial.semester, newMaterial.section, 'material:created', newMaterial);
  emitToRole('student', 'material:created', newMaterial);
  emitToRole('faculty', 'material:created', newMaterial);
  emitToAll('material:created', newMaterial);

  dbStore.logAudit(
    'Study Material Uploaded',
    user?.name || 'Faculty',
    'faculty',
    `Material ${newMaterial.title}`,
    `Added ${newMaterial.type} for ${newMaterial.subjectCode}`
  );

  return res.status(201).json(newMaterial);
});

// DELETE /api/materials/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const material = data.studyMaterials.find(m => m.id === id);
  if (!material) {
    return res.status(404).json({ error: 'Study material not found.' });
  }

  data.studyMaterials = data.studyMaterials.filter(m => m.id !== id);
  dbStore.save();

  emitToRole('student', 'material:deleted', { id, title: material.title });
  emitToRole('faculty', 'material:deleted', { id, title: material.title });
  emitToAll('material:deleted', { id, title: material.title });

  dbStore.logAudit(
    'Study Material Removed',
    (req as any).user?.name || 'Faculty',
    'faculty',
    `Material ${material.title}`,
    `Deleted resource`
  );

  return res.json({ message: 'Study material deleted successfully', id });
});

// POST /api/materials/:id/download
router.post('/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const material = data.studyMaterials.find(m => m.id === id);
  if (!material) {
    return res.status(404).json({ error: 'Study material not found.' });
  }

  material.downloadCount = (material.downloadCount || 0) + 1;
  dbStore.save();
  return res.json({ downloadCount: material.downloadCount });
});

export default router;
