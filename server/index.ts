/**
 * Edu Track - Node.js & Express REST Backend Entrypoint
 * Ready for MongoDB connection with Mongoose.
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Edu Track Academic Core API',
    database: 'MongoDB / Mongoose Connected',
    timestamp: new Date().toISOString()
  });
});

// REST Route Endpoints Contract
// POST /api/auth/login
// POST /api/auth/register
// GET  /api/departments
// POST /api/departments
// GET  /api/subjects
// POST /api/subjects
// GET  /api/students
// POST /api/students
// PUT  /api/students/:id/transfer
// GET  /api/faculty
// POST /api/faculty
// GET  /api/timetable/class
// POST /api/timetable/class (With conflict validation)
// GET  /api/timetable/exams
// POST /api/timetable/exams (With clash validation)
// POST /api/attendance/sessions
// GET  /api/assignments
// POST /api/assignments
// POST /api/assignments/:id/submit
// PUT  /api/submissions/:id/grade
// GET  /api/announcements (Audience filtered)
// POST /api/announcements
// GET  /api/analytics/institution

export default app;
