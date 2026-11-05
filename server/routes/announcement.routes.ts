import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToCohort, emitToRole, emitToAll } from '../socket';

const router = Router();

// GET /api/announcements
router.get('/', (req: Request, res: Response) => {
  const { audience, departmentId, semester } = req.query;
  const data = dbStore.getData();

  let list = data.announcements;
  if (audience) {
    list = list.filter(a => a.audience === audience || a.audience === 'ALL');
  }
  if (departmentId && departmentId !== 'all') {
    list = list.filter(a => !a.departmentId || a.departmentId === departmentId);
  }
  if (semester) {
    list = list.filter(a => !a.semester || a.semester === Number(semester));
  }

  return res.json(list);
});

// POST /api/announcements
router.post('/', (req: Request, res: Response) => {
  const { title, message, audience, departmentId, semester, section, priority } = req.body;
  if (!title || !message || !audience) {
    return res.status(400).json({ error: 'Title, message, and audience (STUDENTS | FACULTY | ALL) are required.' });
  }

  const data = dbStore.getData();
  const user = (req as any).user;

  const newAnn = {
    id: `ann_${Date.now()}`,
    title,
    message,
    audience,
    departmentId: departmentId || undefined,
    semester: semester ? Number(semester) : undefined,
    section: section || undefined,
    publishedBy: user?.name || 'Academic Administration',
    publishedAt: new Date().toISOString().split('T')[0],
    priority: priority || 'normal'
  };

  data.announcements.unshift(newAnn);
  dbStore.save();

  // Real-time synchronization to target groups
  if (newAnn.departmentId && newAnn.semester) {
    emitToCohort(newAnn.departmentId, newAnn.semester, newAnn.section || 'A', 'announcement:published', newAnn);
  }

  if (audience === 'ALL') {
    emitToAll('announcement:published', newAnn);
  } else if (audience === 'STUDENTS') {
    emitToRole('student', 'announcement:published', newAnn);
  } else if (audience === 'FACULTY') {
    emitToRole('faculty', 'announcement:published', newAnn);
  }
  emitToRole('admin', 'announcement:published', newAnn);

  dbStore.logAudit(
    'Announcement Broadcast',
    user?.name || 'Admin',
    user?.role || 'admin',
    `Notice ${newAnn.title}`,
    `Target: ${audience}, Priority: ${newAnn.priority}`
  );

  return res.status(201).json(newAnn);
});

// DELETE /api/announcements/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  data.announcements = data.announcements.filter(a => a.id !== id);
  dbStore.save();

  emitToAll('announcement:deleted', { id });
  dbStore.logAudit('Announcement Removed', (req as any).user?.name || 'Admin', 'admin', `Notice ${id}`, 'Removed circular');
  return res.json({ message: 'Announcement deleted.' });
});

export default router;
