import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import subjectRoutes from './subject.routes';
import studentRoutes from './student.routes';
import facultyRoutes from './faculty.routes';
import timetableRoutes from './timetable.routes';
import attendanceRoutes from './attendance.routes';
import assignmentRoutes from './assignment.routes';
import assessmentRoutes from './assessment.routes';
import materialRoutes from './material.routes';
import announcementRoutes from './announcement.routes';
import analyticsRoutes from './analytics.routes';
import sectionRoutes from './section.routes';
import onlineExamRoutes from './onlineExam.routes';
import { isDbConnected, connectDB, getDbConnectionInfo } from '../db/connection';
import { dbStore } from '../store/storage';
import fs from 'fs';
import path from 'path';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  const dbInfo = getDbConnectionInfo();
  res.json({
    status: 'online',
    service: 'Edu Track Academic Core API (MERN Full-Stack)',
    database: isDbConnected() ? 'MongoDB (Mongoose Connected)' : 'Persistent Embedded Relational Store (Active)',
    mongoStatus: dbInfo,
    timestamp: new Date().toISOString()
  });
});

// Database status & configuration endpoint
apiRouter.get('/database/status', (req: Request, res: Response) => {
  const info = getDbConnectionInfo();
  const data = dbStore.getData();
  res.json({
    ...info,
    collections: 18,
    counts: {
      users: data.users?.length || 0,
      students: data.students?.length || 0,
      faculty: data.faculty?.length || 0,
      departments: data.departments?.length || 0,
      sections: data.sections?.length || 0,
      subjects: data.subjects?.length || 0,
      assignments: data.assignments?.length || 0,
      attendanceSessions: data.attendanceSessions?.length || 0,
      internalAssessments: data.internalAssessments?.length || 0,
      studyMaterials: data.studyMaterials?.length || 0,
      announcements: data.announcements?.length || 0
    }
  });
});

// Database connect / reconnect endpoint (accepts custom MongoDB URI or Atlas string)
apiRouter.post('/database/connect', async (req: Request, res: Response) => {
  const { uri } = req.body;
  const targetUri = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edutrack';

  try {
    const success = await connectDB(targetUri);
    if (success) {
      // Sync all current data to MongoDB collections immediately
      await dbStore.syncToMongoDB();

      // Persist URI in .env if valid
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
        if (envContent.includes('MONGODB_URI=')) {
          envContent = envContent.replace(/MONGODB_URI=.*/, `MONGODB_URI=${targetUri}`);
        } else {
          envContent += `\nMONGODB_URI=${targetUri}\n`;
        }
        fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
      } catch (e) {
        // Non-critical if env write fails
      }

      return res.json({
        success: true,
        message: 'Successfully connected to MongoDB and synchronized all entities.',
        info: getDbConnectionInfo()
      });
    } else {
      return res.status(503).json({
        success: false,
        message: 'Could not connect to specified MongoDB server. Dual-store fallback remains active.',
        info: getDbConnectionInfo()
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Database connection error'
    });
  }
});

// Mount modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/sections', sectionRoutes);
apiRouter.use('/subjects', subjectRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/faculty', facultyRoutes);
apiRouter.use('/timetable', timetableRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/assessments', assessmentRoutes);
apiRouter.use('/materials', materialRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/online-exams', onlineExamRoutes);

export default apiRouter;
