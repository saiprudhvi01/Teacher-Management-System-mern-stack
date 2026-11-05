import { Router, Request, Response } from 'express';
import { dbStore } from '../store/storage';
import { emitToStudent, emitToCohort, emitToFaculty, emitToRole, emitToAll } from '../socket';

const router = Router();

// GET /api/assignments
router.get('/', (req: Request, res: Response) => {
  const { subjectId, semester, section, facultyId } = req.query;
  const data = dbStore.getData();

  let list = data.assignments;
  if (subjectId) {
    list = list.filter(a => a.subjectId === subjectId);
  }
  if (semester) {
    list = list.filter(a => a.semester === Number(semester));
  }
  if (section && section !== 'all') {
    list = list.filter(a => a.section === section);
  }
  if (facultyId) {
    list = list.filter(a => a.facultyId === facultyId);
  }

  return res.json(list);
});

// POST /api/assignments
router.post('/', (req: Request, res: Response) => {
  const { title, subjectId, instructions, dueDate, maxMarks, topicTag, attachmentName, attachmentSize, section, semester } = req.body;
  if (!title || !subjectId || !dueDate) {
    return res.status(400).json({ error: 'Title, Subject, and Due Date are required.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (dueDate < todayStr) {
    return res.status(400).json({ error: 'Date is invalid: Due date cannot be in the past. Faculty must set today or a future date.' });
  }

  const data = dbStore.getData();
  const subject = data.subjects.find(s => s.id === subjectId);
  const user = (req as any).user;

  const newAssignment = {
    id: `asg_${Date.now()}`,
    title,
    subjectId,
    subjectCode: subject ? subject.code : 'CS401',
    subjectName: subject ? subject.name : 'Course Work',
    facultyId: user?.id || 'usr_fac_01',
    facultyName: user?.name || 'Prof. Marcus Vance',
    semester: Number(semester) || (subject ? subject.semester : 6),
    section: section || 'All',
    instructions: instructions || '',
    attachmentName: attachmentName || undefined,
    attachmentSize: attachmentSize || undefined,
    dueDate,
    maxMarks: Number(maxMarks) || 100,
    topicTag: topicTag || '',
    createdAt: new Date().toISOString().split('T')[0]
  };

  data.assignments.unshift(newAssignment);
  dbStore.save();

  const deptId = subject ? subject.departmentId : 'dept_cse';
  emitToCohort(deptId, newAssignment.semester, newAssignment.section, 'assignment:created', newAssignment);
  emitToRole('student', 'assignment:created', newAssignment);
  emitToRole('faculty', 'assignment:created', newAssignment);
  emitToAll('assignment:created', newAssignment);

  dbStore.logAudit(
    'Assignment Created',
    user?.name || 'Faculty',
    'faculty',
    `Assignment ${newAssignment.title}`,
    `Created for ${newAssignment.subjectCode}, Due: ${dueDate}`
  );

  return res.status(201).json(newAssignment);
});

// PUT /api/assignments/:id (Update deadline, instructions, etc.)
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, dueDate, instructions, maxMarks, topicTag } = req.body;
  const data = dbStore.getData();
  const assignment = data.assignments.find(a => a.id === id);

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  if (title) assignment.title = title;
  if (dueDate) assignment.dueDate = dueDate;
  if (instructions !== undefined) assignment.instructions = instructions;
  if (maxMarks) assignment.maxMarks = Number(maxMarks);
  if (topicTag !== undefined) assignment.topicTag = topicTag;

  dbStore.save();

  const subject = data.subjects.find(s => s.id === assignment.subjectId);
  const deptId = subject ? subject.departmentId : 'dept_cse';

  emitToCohort(deptId, assignment.semester, assignment.section, 'assignment:updated', assignment);
  emitToRole('student', 'assignment:updated', assignment);
  emitToRole('faculty', 'assignment:updated', assignment);

  dbStore.logAudit(
    'Assignment Updated',
    (req as any).user?.name || 'Faculty',
    'faculty',
    `Assignment ${assignment.title}`,
    `Updated deadline or details (Due: ${assignment.dueDate})`
  );

  return res.json(assignment);
});

// GET /api/assignments/:id/submissions
router.get('/:id/submissions', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = dbStore.getData();
  const list = data.submissions.filter(s => s.assignmentId === id);
  return res.json(list);
});

// GET /api/assignments/student/:studentId/submissions
router.get('/student/:studentId/submissions', (req: Request, res: Response) => {
  const { studentId } = req.params;
  const data = dbStore.getData();
  const list = data.submissions.filter(s => s.studentId === studentId);
  return res.json(list);
});

// POST /api/assignments/:id/submit
router.post('/:id/submit', (req: Request, res: Response) => {
  const { id } = req.params;
  const { studentId, studentName, rollNumber, fileName, fileSize, notes } = req.body;
  if (!studentId || !fileName) {
    return res.status(400).json({ error: 'Student ID and file name are required.' });
  }

  const data = dbStore.getData();
  const assignment = data.assignments.find(a => a.id === id);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  data.submissions = data.submissions.filter(s => !(s.assignmentId === id && s.studentId === studentId));

  const isLate = new Date() > new Date(assignment.dueDate + 'T23:59:59');

  const newSub = {
    id: `sub_${Date.now()}`,
    assignmentId: id,
    studentId,
    studentName: studentName || 'Student',
    rollNumber: rollNumber || 'CS2023-042',
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    fileName,
    fileSize: fileSize || '1.8 MB',
    notes: notes || '',
    status: isLate ? ('late' as const) : ('submitted' as const),
    marksAwarded: undefined,
    facultyFeedback: undefined,
    gradedAt: undefined
  };

  data.submissions.unshift(newSub);
  dbStore.save();

  // Notify faculty responsible for this assignment
  emitToFaculty(assignment.facultyId, 'submission:created', {
    submission: newSub,
    assignmentTitle: assignment.title,
    studentName: newSub.studentName,
    rollNumber: newSub.rollNumber
  });
  emitToRole('faculty', 'submission:created', {
    submission: newSub,
    assignmentTitle: assignment.title,
    studentName: newSub.studentName
  });

  dbStore.logAudit(
    'Assignment Submitted',
    studentName || 'Student',
    'student',
    `Assignment ${assignment.title}`,
    `Submitted file: ${fileName}`
  );

  return res.status(201).json(newSub);
});

// PUT /api/assignments/submissions/:subId/grade
router.put('/submissions/:subId/grade', (req: Request, res: Response) => {
  const { subId } = req.params;
  const { marksAwarded, facultyFeedback } = req.body;
  const data = dbStore.getData();

  const sub = data.submissions.find(s => s.id === subId);
  if (!sub) {
    return res.status(404).json({ error: 'Submission not found.' });
  }

  const assignment = data.assignments.find(a => a.id === sub.assignmentId);

  sub.marksAwarded = Number(marksAwarded);
  sub.facultyFeedback = facultyFeedback || '';
  sub.status = 'graded';
  sub.gradedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

  dbStore.save();

  // Notify student in real-time
  emitToStudent(sub.studentId, 'submission:evaluated', {
    submissionId: sub.id,
    assignmentId: sub.assignmentId,
    assignmentTitle: assignment?.title || 'Assignment',
    marksAwarded: sub.marksAwarded,
    maxMarks: assignment?.maxMarks || 100,
    feedback: sub.facultyFeedback,
    status: 'graded',
    gradedAt: sub.gradedAt
  });

  // Also emit marks:updated for student's grade summary
  emitToStudent(sub.studentId, 'marks:updated', {
    studentId: sub.studentId,
    assessmentId: sub.assignmentId,
    assessmentTitle: assignment?.title || 'Assignment Evaluation',
    marksObtained: sub.marksAwarded,
    maxMarks: assignment?.maxMarks || 100,
    feedback: sub.facultyFeedback
  });

  dbStore.logAudit(
    'Submission Graded',
    (req as any).user?.name || 'Faculty',
    'faculty',
    `Submission ${sub.id}`,
    `Awarded ${marksAwarded} marks to ${sub.studentName}`
  );

  return res.json(sub);
});

export default router;
