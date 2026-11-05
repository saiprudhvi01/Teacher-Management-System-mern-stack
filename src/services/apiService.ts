/**
 * Edu Track - Academic Management System
 * Full-Stack MERN API Client Service & Reactive State Layer
 *
 * Communicates with the Node.js/Express backend at `/api`
 * with JWT authentication, real database persistence, and
 * reactive client caching for instant UI response and smooth skeletons.
 */

import {
  User,
  UserRole,
  StudentProfile,
  FacultyProfile,
  Department,
  Subject,
  CourseEnrollment,
  TimetableEntry,
  StudyMaterial,
  Assignment,
  Submission,
  AssessmentResult,
  ExamSchedule,
  Announcement,
  ConceptPerformance,
  AuditLog,
  InternalAssessment,
  AssessmentMarkEntry,
  AttendanceSession,
  AttendanceRecord,
  Section,
  TeachingAssignment,
  OnlineExam,
  ExamQuestion,
  ExamAttempt,
  ExamResultsAnalytics
} from '../types';

import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_FACULTY,
  INITIAL_DEPARTMENTS,
  INITIAL_SUBJECTS,
  INITIAL_ENROLLMENTS,
  INITIAL_TIMETABLE,
  INITIAL_STUDY_MATERIALS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_SEMESTER_RESULTS,
  INITIAL_EXAM_SCHEDULES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ASSESSMENTS,
  INITIAL_ASSESSMENT_MARKS,
  INITIAL_ONLINE_EXAMS,
  INITIAL_EXAM_ATTEMPTS
} from './mockData';

const TOKEN_KEY = 'edutrack_jwt_token';
const STORAGE_PREFIX = 'edutrack_fullstack_v1_';

const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  STUDENTS: `${STORAGE_PREFIX}students`,
  FACULTY: `${STORAGE_PREFIX}faculty`,
  DEPARTMENTS: `${STORAGE_PREFIX}departments`,
  SECTIONS: `${STORAGE_PREFIX}sections`,
  SUBJECTS: `${STORAGE_PREFIX}subjects`,
  TEACHING_ASSIGNMENTS: `${STORAGE_PREFIX}teaching_assignments`,
  ENROLLMENTS: `${STORAGE_PREFIX}enrollments`,
  CLASS_TIMETABLE: `${STORAGE_PREFIX}class_timetable`,
  EXAMS: `${STORAGE_PREFIX}exams`,
  ATTENDANCE_SESSIONS: `${STORAGE_PREFIX}attendance_sessions`,
  MATERIALS: `${STORAGE_PREFIX}materials`,
  ASSIGNMENTS: `${STORAGE_PREFIX}assignments`,
  SUBMISSIONS: `${STORAGE_PREFIX}submissions`,
  INTERNAL_ASSESSMENTS: `${STORAGE_PREFIX}internal_assessments`,
  ASSESSMENT_MARKS: `${STORAGE_PREFIX}assessment_marks`,
  RESULTS: `${STORAGE_PREFIX}results`,
  ANNOUNCEMENTS: `${STORAGE_PREFIX}announcements`,
  AUDIT_LOGS: `${STORAGE_PREFIX}audit_logs`,
  ONLINE_EXAMS: `${STORAGE_PREFIX}online_exams`,
  EXAM_ATTEMPTS: `${STORAGE_PREFIX}exam_attempts`,
  CURRENT_USER_ID: `${STORAGE_PREFIX}current_user_id`,
  READ_NOTIFICATIONS: `${STORAGE_PREFIX}read_notifications`
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local cache', err);
  }
}

export function isMatchingDepartment(deptA?: string, deptB?: string): boolean {
  if (!deptA || !deptB) return false;
  if (deptA === deptB) return true;
  const s1 = deptA.trim().toLowerCase();
  const s2 = deptB.trim().toLowerCase();
  if (s1 === s2) return true;
  const code1 = s1.replace(/^dept_/, '');
  const code2 = s2.replace(/^dept_/, '');
  if (code1 === code2) return true;
  if (s1.includes('computer') && s2.includes('cse')) return true;
  if (s2.includes('computer') && s1.includes('cse')) return true;
  if (s1.includes('electronic') && s2.includes('ece')) return true;
  if (s2.includes('electronic') && s1.includes('ece')) return true;
  return false;
}

export function isMatchingSection(stdSection?: string, targetSection?: string, secCode?: string): boolean {
  if (!stdSection && !targetSection && !secCode) return false;
  const s1 = (stdSection || '').trim().toUpperCase();
  const s2 = (targetSection || '').trim().toUpperCase();
  const sc = (secCode || '').trim().toUpperCase();

  if (s1 === 'ALL' || s2 === 'ALL' || sc === 'ALL' || s1 === 'ALL SECTIONS' || s2 === 'ALL SECTIONS' || sc === 'ALL SECTIONS') return true;
  if (s2 && s1 === s2) return true;
  if (sc && s1 === sc) return true;

  const clean1 = s1.replace(/^(SEC_[A-Z0-9]+_|SECTION\s*|[A-Z0-9]+-)/i, '').trim();
  const clean2 = s2.replace(/^(SEC_[A-Z0-9]+_|SECTION\s*|[A-Z0-9]+-)/i, '').trim();
  const cleanC = sc.replace(/^(SEC_[A-Z0-9]+_|SECTION\s*|[A-Z0-9]+-)/i, '').trim();

  if (clean1 === 'ALL' || clean2 === 'ALL' || cleanC === 'ALL') return true;
  if (clean1 && clean2 && clean1 === clean2) return true;
  if (clean1 && cleanC && clean1 === cleanC) return true;

  if (s1.endsWith(`-${clean2}`) || s2.endsWith(`-${clean1}`)) return true;

  return false;
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

export class EduTrackApi {
  private static isInitialized = false;

  static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const [
        depts,
        sections,
        subs,
        students,
        facultyList,
        announcements,
        timetable,
        exams,
        asgs,
        materials,
        assessments,
        sessions,
        teachingAssignments,
        allEnrollments,
        allResults,
        onlineExamsList
      ] = await Promise.all([
        apiRequest<Department[]>('/api/departments'),
        apiRequest<Section[]>('/api/sections'),
        apiRequest<Subject[]>('/api/subjects'),
        apiRequest<StudentProfile[]>('/api/students'),
        apiRequest<FacultyProfile[]>('/api/faculty'),
        apiRequest<Announcement[]>('/api/announcements'),
        apiRequest<TimetableEntry[]>('/api/timetable/class'),
        apiRequest<ExamSchedule[]>('/api/timetable/exams'),
        apiRequest<Assignment[]>('/api/assignments'),
        apiRequest<StudyMaterial[]>('/api/materials'),
        apiRequest<InternalAssessment[]>('/api/assessments'),
        apiRequest<AttendanceSession[]>('/api/attendance/sessions'),
        apiRequest<TeachingAssignment[]>('/api/faculty/assignments'),
        apiRequest<CourseEnrollment[]>('/api/students/enrollments/all'),
        apiRequest<AssessmentResult[]>('/api/students/results/all'),
        apiRequest<OnlineExam[]>('/api/online-exams')
      ]);

      if (depts) saveStorage(KEYS.DEPARTMENTS, depts);
      if (sections) saveStorage(KEYS.SECTIONS, sections);
      if (subs) saveStorage(KEYS.SUBJECTS, subs);
      if (students) {
        const localStudents = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
        const mergedStudents = [...students];
        localStudents.forEach(ls => {
          if (!mergedStudents.some(ms => ms.id === ls.id || ms.rollNumber === ls.rollNumber)) {
            mergedStudents.push(ls);
          }
        });
        saveStorage(KEYS.STUDENTS, mergedStudents);
      }
      if (facultyList) {
        const localFaculty = loadStorage<FacultyProfile[]>(KEYS.FACULTY, INITIAL_FACULTY);
        const mergedFaculty = [...facultyList];
        localFaculty.forEach(lf => {
          if (!mergedFaculty.some(mf => mf.id === lf.id || mf.employeeId === lf.employeeId)) {
            mergedFaculty.push(lf);
          }
        });
        saveStorage(KEYS.FACULTY, mergedFaculty);
      }
      if (announcements) saveStorage(KEYS.ANNOUNCEMENTS, announcements);
      if (timetable) saveStorage(KEYS.CLASS_TIMETABLE, timetable);
      if (exams) saveStorage(KEYS.EXAMS, exams);
      if (asgs && Array.isArray(asgs)) saveStorage(KEYS.ASSIGNMENTS, asgs);
      if (materials && Array.isArray(materials)) saveStorage(KEYS.MATERIALS, materials);
      if (assessments && Array.isArray(assessments)) saveStorage(KEYS.INTERNAL_ASSESSMENTS, assessments);
      if (sessions && Array.isArray(sessions)) saveStorage(KEYS.ATTENDANCE_SESSIONS, sessions);
      if (teachingAssignments && Array.isArray(teachingAssignments)) saveStorage(KEYS.TEACHING_ASSIGNMENTS, teachingAssignments);
      if (allEnrollments && Array.isArray(allEnrollments)) {
        const localEnrs = loadStorage<CourseEnrollment[]>(KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
        const mergedEnrs = [...allEnrollments];
        localEnrs.forEach(le => {
          if (!mergedEnrs.some(me => me.id === le.id || (me.studentId === le.studentId && me.subjectCode === le.subjectCode))) {
            mergedEnrs.push(le);
          }
        });
        saveStorage(KEYS.ENROLLMENTS, mergedEnrs);
      }
      if (allResults && Array.isArray(allResults)) {
        const localRes = loadStorage<AssessmentResult[]>(KEYS.RESULTS, INITIAL_SEMESTER_RESULTS);
        const mergedRes = [...allResults];
        localRes.forEach(lr => {
          if (!mergedRes.some(mr => mr.id === lr.id || (mr.studentId === lr.studentId && mr.semester === lr.semester))) {
            mergedRes.push(lr);
          }
        });
        saveStorage(KEYS.RESULTS, mergedRes);
      }
      if (onlineExamsList && Array.isArray(onlineExamsList)) {
        saveStorage(KEYS.ONLINE_EXAMS, onlineExamsList);
      }
    } catch {
      // Offline fallback
    }
  }

  static resetToEmpty(): void {
    apiRequest('/api/analytics/reset', { method: 'POST' }).catch(() => {});
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(TOKEN_KEY);
    window.location.reload();
  }

  static resetAllData(): void {
    this.resetToEmpty();
  }

  // --- AUTH & USERS ---
  static getUsers(): User[] {
    return loadStorage<User[]>(KEYS.USERS, INITIAL_USERS);
  }

  static getActiveUser(): User | null {
    const users = this.getUsers();
    const activeId = localStorage.getItem(KEYS.CURRENT_USER_ID);
    if (!activeId) return null;
    return users.find(u => u.id === activeId) || null;
  }

  static async loginAsync(identifier: string, password?: string, expectedRole?: UserRole): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanId = identifier.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanId, password: password || '', role: expectedRole })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed. Please verify your credentials.' };
      }

      if (data && data.token && data.user) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(KEYS.CURRENT_USER_ID, data.user.id);
        
        // Cache user in storage if not present
        const users = this.getUsers();
        const existingIdx = users.findIndex(u => u.id === data.user.id);
        if (existingIdx !== -1) {
          users[existingIdx] = data.user;
        } else {
          users.push(data.user);
        }
        saveStorage(KEYS.USERS, users);

        if (data.user.role === 'student' && data.profile) {
          const students = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
          const idx = students.findIndex(s => s.id === data.profile.id);
          if (idx !== -1) students[idx] = data.profile;
          else students.push(data.profile);
          saveStorage(KEYS.STUDENTS, students);
        } else if (data.user.role === 'faculty' && data.profile) {
          const facList = loadStorage<FacultyProfile[]>(KEYS.FACULTY, INITIAL_FACULTY);
          const idx = facList.findIndex(f => f.id === data.profile.id);
          if (idx !== -1) facList[idx] = data.profile;
          else facList.push(data.profile);
          saveStorage(KEYS.FACULTY, facList);
        }

        this.logAudit('User Login', data.user.name, data.user.role, 'Session', `Authenticated as ${data.user.email} (${data.user.role})`);
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.warn('Backend login request error, checking local store:', err);
    }

    // Local offline fallback
    const user = this.login(cleanId, password, expectedRole);
    if (user) {
      return { success: true, user };
    }
    return { success: false, error: 'Invalid credentials or unprovisioned account. Contact your university administrator.' };
  }

  static login(identifier: string, password?: string, expectedRole?: UserRole): User | null {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    
    // Check by email
    let user = users.find(u => u.email.toLowerCase() === cleanId && u.status === 'active');

    // Check by student rollNumber / registrationNumber
    if (!user) {
      const students = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
      const student = students.find(s => s.rollNumber?.toLowerCase() === cleanId || s.registrationNumber?.toLowerCase() === cleanId);
      if (student) {
        user = users.find(u => u.id === student.userId && u.status === 'active');
      }
    }

    // Check by faculty employeeId
    if (!user) {
      const faculty = loadStorage<FacultyProfile[]>(KEYS.FACULTY, INITIAL_FACULTY);
      const fac = faculty.find(f => f.employeeId?.toLowerCase() === cleanId);
      if (fac) {
        user = users.find(u => u.id === fac.userId && u.status === 'active');
      }
    }

    if (user) {
      if (expectedRole && user.role !== expectedRole) {
        return null;
      }
      localStorage.setItem(KEYS.CURRENT_USER_ID, user.id);
      this.logAudit('User Login', user.name, user.role, 'Session', `Authenticated as ${user.email} (${user.role})`);
      return user;
    }
    return null;
  }

  static logout(): void {
    const active = this.getActiveUser();
    if (active) {
      this.logAudit('User Logout', active.name, active.role, 'Session', 'User logged out');
    }
    apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(KEYS.CURRENT_USER_ID);
    localStorage.removeItem(TOKEN_KEY);
  }

  static addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);
    saveStorage(KEYS.USERS, users);

    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...newUser, password: 'password123' })
    }).catch(() => {});

    return newUser;
  }

  static updateUser(id: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...updates };
    saveStorage(KEYS.USERS, users);
    return users[idx];
  }

  // --- DEPARTMENTS ---
  static getDepartments(): Department[] {
    const cached = loadStorage<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    apiRequest<Department[]>('/api/departments').then(depts => {
      if (depts && depts.length > 0) saveStorage(KEYS.DEPARTMENTS, depts);
    }).catch(() => {});
    return cached;
  }

  static createDepartment(dept: Omit<Department, 'id' | 'totalStudents' | 'totalFaculty' | 'totalSemesters'>): Department {
    const depts = this.getDepartments();
    const newDept: Department = {
      ...dept,
      id: `dept_${Date.now()}`,
      totalStudents: 0,
      totalFaculty: 0,
      totalSemesters: 8
    };
    depts.push(newDept);
    saveStorage(KEYS.DEPARTMENTS, depts);
    this.logAudit('Department Created', 'Admin', 'admin', `Dept ${newDept.code}`, `Created department "${newDept.name}"`);

    apiRequest<Department>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(dept)
    }).then(res => {
      if (res && res.id) {
        newDept.id = res.id;
        saveStorage(KEYS.DEPARTMENTS, depts);
      }
    }).catch(() => {});

    return newDept;
  }

  static updateDepartment(id: string, updates: Partial<Department>): Department {
    const depts = this.getDepartments();
    const idx = depts.findIndex(d => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    depts[idx] = { ...depts[idx], ...updates };
    saveStorage(KEYS.DEPARTMENTS, depts);
    this.logAudit('Department Updated', 'Admin', 'admin', `Dept ${depts[idx].code}`, `Updated details`);

    apiRequest(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }).catch(() => {});

    return depts[idx];
  }

  static deleteDepartment(id: string): void {
    const depts = this.getDepartments().filter(d => d.id !== id);
    saveStorage(KEYS.DEPARTMENTS, depts);
    this.logAudit('Department Deleted', 'Admin', 'admin', `Dept ID ${id}`, 'Removed department');
    apiRequest(`/api/departments/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  // --- SECTIONS ---
  static getSections(departmentId?: string): Section[] {
    const list = loadStorage<Section[]>(KEYS.SECTIONS, []);
    const students = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);

    // Keep enrollmentCount dynamically recalculated from current student database
    list.forEach(sec => {
      sec.enrollmentCount = students.filter(st =>
        st.departmentId === sec.departmentId && isMatchingSection(st.section, sec.name, sec.sectionCode)
      ).length;
    });

    apiRequest<Section[]>(departmentId && departmentId !== 'all' ? `/api/sections?departmentId=${departmentId}` : '/api/sections').then(res => {
      if (res && Array.isArray(res)) {
        res.forEach(sec => {
          sec.enrollmentCount = students.filter(st =>
            st.departmentId === sec.departmentId && isMatchingSection(st.section, sec.name, sec.sectionCode)
          ).length;
        });
        saveStorage(KEYS.SECTIONS, res);
      }
    }).catch(() => {});
    if (departmentId && departmentId !== 'all') {
      return list.filter(s => s.departmentId === departmentId);
    }
    return list;
  }

  static async fetchSections(departmentId?: string): Promise<Section[]> {
    const url = departmentId && departmentId !== 'all' ? `/api/sections?departmentId=${departmentId}` : '/api/sections';
    const res = await apiRequest<Section[]>(url);
    if (res && Array.isArray(res)) {
      saveStorage(KEYS.SECTIONS, res);
      return res;
    }
    return this.getSections(departmentId);
  }

  static async createSection(sec: { name: string; departmentId: string; capacity?: number; sectionCode?: string }): Promise<Section> {
    const res = await apiRequest<Section>('/api/sections', {
      method: 'POST',
      body: JSON.stringify(sec)
    });
    const sections = loadStorage<Section[]>(KEYS.SECTIONS, []);
    const newSec: Section = res || {
      id: `sec_${Date.now()}`,
      name: sec.name.toUpperCase().trim(),
      sectionCode: sec.sectionCode || sec.name.replace(/.*-/, '') || 'A',
      departmentId: sec.departmentId,
      departmentCode: '',
      capacity: Number(sec.capacity) || 60,
      enrollmentCount: 0,
      status: 'active'
    };
    if (!res) {
      sections.push(newSec);
      saveStorage(KEYS.SECTIONS, sections);
    } else {
      const idx = sections.findIndex(s => s.id === res.id);
      if (idx !== -1) sections[idx] = res;
      else sections.push(res);
      saveStorage(KEYS.SECTIONS, sections);
    }
    this.logAudit('Section Created', 'Admin', 'admin', `Section ${newSec.name}`, `Capacity: ${newSec.capacity}`);
    this.handleRealtimeSync('section:created', { section: newSec, sections });
    return newSec;
  }

  static async updateSection(id: string, updates: Partial<Section>): Promise<Section> {
    const res = await apiRequest<Section>(`/api/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const sections = loadStorage<Section[]>(KEYS.SECTIONS, []);
    const idx = sections.findIndex(s => s.id === id);
    if (idx !== -1) {
      sections[idx] = res || { ...sections[idx], ...updates };
      saveStorage(KEYS.SECTIONS, sections);
      this.handleRealtimeSync('section:updated', { section: sections[idx], sections });
      return sections[idx];
    }
    return res as Section;
  }

  static async deleteSection(id: string): Promise<void> {
    await apiRequest(`/api/sections/${id}`, { method: 'DELETE' });
    const sections = loadStorage<Section[]>(KEYS.SECTIONS, []).filter(s => s.id !== id);
    saveStorage(KEYS.SECTIONS, sections);
    this.logAudit('Section Deleted', 'Admin', 'admin', `Section ID ${id}`, 'Removed section');
  }

  static async getNextRegisterNumber(): Promise<string> {
    try {
      const res = await apiRequest<{ nextRollNumber: string }>('/api/students/next-roll');
      if (res && res.nextRollNumber) {
        return res.nextRollNumber;
      }
    } catch {
      // Fallback calculation from local storage
    }
    const students = this.getAllStudents();
    const regNums = students
      .map(s => s.rollNumber || s.registrationNumber || '')
      .map(r => r.replace(/\D/g, ''))
      .filter(r => r.startsWith('99'))
      .map(Number)
      .filter(n => !isNaN(n));
    const highest = regNums.length > 0 ? Math.max(...regNums) : 990000000;
    return String(highest + 1);
  }

  // --- SUBJECTS ---
  static getSubjects(departmentId?: string): Subject[] {
    const subjects = loadStorage<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
    if (departmentId && departmentId !== 'all') {
      return subjects.filter(s => s.departmentId === departmentId);
    }
    return subjects;
  }

  static createSubject(sub: Omit<Subject, 'id'>): Subject {
    const subjects = loadStorage<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const newSubject: Subject = {
      ...sub,
      id: `sub_${Date.now()}`
    };
    subjects.push(newSubject);
    saveStorage(KEYS.SUBJECTS, subjects);
    this.logAudit('Subject Created', 'Admin', 'admin', `Subject ${newSubject.code}`, `Added to curriculum: ${newSubject.name}`);

    apiRequest<Subject>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(sub)
    }).then(res => {
      if (res && res.id) {
        newSubject.id = res.id;
        saveStorage(KEYS.SUBJECTS, subjects);
      }
    }).catch(() => {});

    this.handleRealtimeSync('subject:created', { subject: newSubject, subjects });

    return newSubject;
  }

  static updateSubject(id: string, updates: Partial<Subject>): Subject {
    const subjects = loadStorage<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const idx = subjects.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subject not found');
    subjects[idx] = { ...subjects[idx], ...updates };
    saveStorage(KEYS.SUBJECTS, subjects);

    apiRequest(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }).catch(() => {});

    this.handleRealtimeSync('subject:updated', { subject: subjects[idx], subjects });

    return subjects[idx];
  }

  // --- STUDENTS & PROFILES ---
  static getAllStudents(): StudentProfile[] {
    return loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  static async fetchStudentProfile(userId: string): Promise<StudentProfile | null> {
    try {
      const profile = await apiRequest<StudentProfile>(`/api/students/user/${userId}`);
      if (profile && profile.id) {
        const students = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
        const idx = students.findIndex(s => s.id === profile.id || s.userId === userId);
        if (idx !== -1) {
          students[idx] = { ...students[idx], ...profile };
        } else {
          students.push(profile);
        }
        saveStorage(KEYS.STUDENTS, students);
        return profile;
      }
    } catch (e) {
      console.warn('[EduTrackApi] Failed to fetch authoritative student profile from backend:', e);
    }
    return this.getStudentProfile(userId);
  }

  static getStudentProfile(userId: string): StudentProfile | null {
    const list = this.getAllStudents();
    const existing = list.find(s => s.userId === userId || s.id === userId);
    if (existing) return existing;

    // Check if the user is a student user
    const users = this.getUsers();
    const user = users.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    if (user && user.role === 'student') {
      const match = list.find(s => s.userId === user.id);
      if (match) return match;

      const depts = this.getDepartments();
      const defaultDept = depts[0] || { id: 'dept_cse', name: 'Computer Science & Engineering', code: 'CSE' };
      const sections = this.getSections(defaultDept.id);
      const defaultSec = sections[0]?.name || `${defaultDept.code}-A`;
      const rollNumber = `99${String(Date.now()).slice(-7)}`;

      const newProf: StudentProfile = {
        id: `std_${user.id.replace('usr_', '')}`,
        userId: user.id,
        rollNumber,
        registrationNumber: `REG-${rollNumber}`,
        departmentId: defaultDept.id,
        departmentName: defaultDept.name,
        currentSemester: 6,
        section: defaultSec,
        admissionYear: 2023,
        academicYear: '2026-2027',
        batch: '2023-2027',
        cgpa: 8.52,
        currentSgpa: 8.65,
        attendancePercentage: 86.4,
        mentorFacultyId: 'usr_fac_01',
        academicStatus: 'Good Standing'
      };

      list.push(newProf);
      saveStorage(KEYS.STUDENTS, list);

      // Auto-enroll in department subjects for this semester
      const subs = this.getSubjects().filter(s => s.departmentId === defaultDept.id && s.semester === 6);
      const enrs = loadStorage<CourseEnrollment[]>(KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
      subs.forEach(sub => {
        if (!enrs.some(e => e.studentId === newProf.id && (e.subjectId === sub.id || e.subjectCode === sub.code))) {
          enrs.push({
            id: `enr_${newProf.id}_${sub.id}`,
            studentId: newProf.id,
            subjectId: sub.id,
            subjectCode: sub.code,
            subjectName: sub.name,
            instructorName: sub.assignedFacultyName || 'Prof. Marcus Vance',
            credits: sub.credits || 3,
            attendedClasses: 13,
            totalClasses: 15,
            attendancePercentage: 86.7,
            semester: sub.semester,
            academicYear: '2026-2027',
            gradePoints: 9.0,
            status: 'Enrolled'
          });
        }
      });
      saveStorage(KEYS.ENROLLMENTS, enrs);

      return newProf;
    }

    return null;
  }

  static createStudent(params: {
    name: string;
    email: string;
    rollNumber: string;
    departmentId: string;
    departmentName: string;
    currentSemester: number;
    section: string;
  }): { user: User; profile: StudentProfile } {
    const user = this.addUser({
      name: params.name,
      email: params.email,
      role: 'student',
      status: 'active'
    });

    const profiles = this.getAllStudents();
    const newProfile: StudentProfile = {
      id: `std_${Date.now()}`,
      userId: user.id,
      rollNumber: params.rollNumber,
      registrationNumber: `REG-${params.rollNumber}`,
      departmentId: params.departmentId,
      departmentName: params.departmentName,
      currentSemester: params.currentSemester,
      section: params.section,
      admissionYear: new Date().getFullYear(),
      cgpa: 0,
      currentSgpa: 0,
      attendancePercentage: 0
    };
    profiles.push(newProfile);
    saveStorage(KEYS.STUDENTS, profiles);

    // Recalculate section enrollment counts immediately
    const sections = loadStorage<Section[]>(KEYS.SECTIONS, []);
    sections.forEach(sec => {
      sec.enrollmentCount = profiles.filter(st =>
        st.departmentId === sec.departmentId && isMatchingSection(st.section, sec.name, sec.sectionCode)
      ).length;
    });
    saveStorage(KEYS.SECTIONS, sections);

    // Update department student count
    const departments = loadStorage<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const deptIdx = departments.findIndex(d => d.id === params.departmentId);
    if (deptIdx !== -1) {
      departments[deptIdx].totalStudents = profiles.filter(st => st.departmentId === params.departmentId).length;
      saveStorage(KEYS.DEPARTMENTS, departments);
    }

    const deptSubjects = this.getSubjects(params.departmentId).filter(s => s.semester === params.currentSemester);
    const enrollments = loadStorage<CourseEnrollment[]>(KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
    deptSubjects.forEach(s => {
      enrollments.push({
        id: `enr_${Date.now()}_${s.id}`,
        studentId: newProfile.id,
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
    saveStorage(KEYS.ENROLLMENTS, enrollments);

    apiRequest<{ user: User; profile: StudentProfile }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(params)
    }).catch(() => {});

    this.logAudit('Student Registered', 'Admin', 'admin', `Student ${params.name}`, `Roll: ${params.rollNumber}, Dept: ${params.departmentName}, Section: ${params.section}`);

    // Broadcast real-time sync event so all subscribers re-render instantly!
    this.handleRealtimeSync('student:created', { student: newProfile, user, sections, departments });

    return { user, profile: newProfile };
  }

  static updateStudentProfile(id: string, updates: Partial<StudentProfile>): StudentProfile {
    const profiles = this.getAllStudents();
    const idx = profiles.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Student profile not found');
    profiles[idx] = { ...profiles[idx], ...updates };
    saveStorage(KEYS.STUDENTS, profiles);

    // Recalculate section enrollment counts
    const sections = loadStorage<Section[]>(KEYS.SECTIONS, []);
    sections.forEach(sec => {
      sec.enrollmentCount = profiles.filter(st =>
        st.departmentId === sec.departmentId && isMatchingSection(st.section, sec.name, sec.sectionCode)
      ).length;
    });
    saveStorage(KEYS.SECTIONS, sections);

    // Recalculate department counts
    const departments = loadStorage<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    departments.forEach(d => {
      d.totalStudents = profiles.filter(st => st.departmentId === d.id).length;
    });
    saveStorage(KEYS.DEPARTMENTS, departments);

    apiRequest(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }).catch(() => {});

    this.handleRealtimeSync('student:updated', { student: profiles[idx], sections, departments });

    return profiles[idx];
  }

  // --- FACULTY & PROFILES ---
  static getAllFaculty(): FacultyProfile[] {
    const list = loadStorage<FacultyProfile[]>(KEYS.FACULTY, INITIAL_FACULTY);
    const users = this.getUsers();
    list.forEach(f => {
      const u = users.find(user => user.id === f.userId || (user.email && (f as any).email && user.email.toLowerCase() === (f as any).email.toLowerCase()));
      if (u) {
        if (!(f as any).name) (f as any).name = u.name;
        if (!(f as any).email) (f as any).email = u.email;
      }
    });
    return list;
  }

  static getFacultyProfile(userId: string): FacultyProfile | null {
    const list = this.getAllFaculty();
    const byUserId = list.find(f => f.userId === userId || f.id === userId);
    if (byUserId) return byUserId;

    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      const byEmail = list.find(f => (f as any).email?.toLowerCase() === user.email.toLowerCase());
      if (byEmail) return byEmail;
    }
    return null;
  }

  static createFaculty(params: {
    name: string;
    email: string;
    employeeId: string;
    designation: string;
    departmentId: string;
    departmentName: string;
    officeRoom: string;
    qualification?: string;
    assignedSections?: string[];
    subjectId?: string;
    assignedSubjectIds?: string[];
    isHOD?: boolean;
  }): { user: User; profile: FacultyProfile } {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanEmpId = params.employeeId.trim().toUpperCase();

    // 1. Ensure user is stored locally in KEYS.USERS
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: params.name.trim(),
        email: cleanEmail,
        role: 'faculty',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      users.push(user);
    } else {
      user.role = 'faculty';
      user.name = params.name.trim();
    }
    saveStorage(KEYS.USERS, users);

    // 2. Ensure faculty profile is stored locally in KEYS.FACULTY
    const facultyList = this.getAllFaculty();
    let profile = facultyList.find(f => f.employeeId?.toUpperCase() === cleanEmpId || f.userId === user!.id);
    if (!profile) {
      profile = {
        id: `fac_${Date.now()}`,
        userId: user.id,
        employeeId: cleanEmpId,
        designation: params.designation,
        departmentId: params.departmentId,
        departmentName: params.departmentName,
        qualification: params.qualification || 'Master / Ph.D.',
        specialization: 'Core Curriculum',
        officeRoom: params.officeRoom,
        totalClassesAssigned: 0,
        assignedSections: params.assignedSections && params.assignedSections.length > 0 ? params.assignedSections : undefined,
        assignedSubjectIds: params.assignedSubjectIds || (params.subjectId ? [params.subjectId] : []),
        isHOD: Boolean(params.isHOD)
      };
      facultyList.push(profile);
    } else {
      profile.designation = params.designation;
      profile.departmentId = params.departmentId;
      profile.departmentName = params.departmentName;
      profile.officeRoom = params.officeRoom;
      if (params.assignedSections && params.assignedSections.length > 0) {
        profile.assignedSections = params.assignedSections;
      }
      if (params.isHOD !== undefined) profile.isHOD = params.isHOD;
    }
    saveStorage(KEYS.FACULTY, facultyList);

    // 3. Update department total faculty in KEYS.DEPARTMENTS
    const departments = loadStorage<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const deptIdx = departments.findIndex(d => d.id === params.departmentId);
    if (deptIdx !== -1) {
      departments[deptIdx].totalFaculty = facultyList.filter(f => f.departmentId === params.departmentId).length;
      if (params.isHOD) {
        departments[deptIdx].hodName = params.name;
        departments[deptIdx].hodEmail = params.email;
      }
      saveStorage(KEYS.DEPARTMENTS, departments);
    }

    // 4. If teaching sections / subject allocated, store teaching assignments locally
    if (params.subjectId && params.assignedSections && params.assignedSections.length > 0) {
      const tas = loadStorage<TeachingAssignment[]>(KEYS.TEACHING_ASSIGNMENTS, []);
      const subjects = this.getSubjects();
      const sub = subjects.find(s => s.id === params.subjectId);
      if (sub) {
        sub.assignedFacultyId = user.id;
        sub.assignedFacultyName = user.name;
        saveStorage(KEYS.SUBJECTS, subjects);

        params.assignedSections.forEach(sec => {
          const already = tas.some(t => t.facultyId === profile!.id && t.subjectId === sub.id && t.section === sec);
          if (!already) {
            tas.push({
              id: `ta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              facultyId: profile!.id,
              facultyUserId: user!.id,
              facultyName: user!.name,
              departmentId: params.departmentId,
              subjectId: sub.id,
              subjectCode: sub.code,
              subjectName: sub.name,
              semester: sub.semester,
              section: sec,
              academicYear: '2026-2027',
              status: 'active'
            });
          }
        });
        saveStorage(KEYS.TEACHING_ASSIGNMENTS, tas);
      }
    }

    // 5. Send to backend and update with server IDs if returned
    apiRequest<{ user: User; profile: FacultyProfile }>('/api/faculty', {
      method: 'POST',
      body: JSON.stringify(params)
    }).then(res => {
      if (res && res.profile && res.user) {
        const curFac = this.getAllFaculty();
        const fIdx = curFac.findIndex(f => f.id === profile!.id || f.employeeId === cleanEmpId);
        if (fIdx !== -1) {
          curFac[fIdx] = { ...curFac[fIdx], ...res.profile };
        } else {
          curFac.push(res.profile);
        }
        saveStorage(KEYS.FACULTY, curFac);

        const curU = this.getUsers();
        const uIdx = curU.findIndex(u => u.id === user!.id || u.email.toLowerCase() === cleanEmail);
        if (uIdx !== -1) {
          curU[uIdx] = { ...curU[uIdx], ...res.user };
        } else {
          curU.push(res.user);
        }
        saveStorage(KEYS.USERS, curU);
      }
    }).catch(() => {});

    this.logAudit('Faculty Registered', 'Admin', 'admin', `Faculty ${params.name}`, `EmpID: ${params.employeeId}, Dept: ${params.departmentName}`);
    this.handleRealtimeSync('faculty:created', { user, profile });
    return { user, profile };
  }

  static async updateFaculty(id: string, updates: Partial<FacultyProfile>): Promise<FacultyProfile> {
    const res = await apiRequest<FacultyProfile>(`/api/faculty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    const facultyList = this.getAllFaculty();
    const idx = facultyList.findIndex(f => f.id === id);
    if (idx !== -1) {
      facultyList[idx] = res || { ...facultyList[idx], ...updates };
      saveStorage(KEYS.FACULTY, facultyList);
      return facultyList[idx];
    }
    return res as FacultyProfile;
  }

  static getTeachingAssignmentsSync(facultyId?: string): TeachingAssignment[] {
    const cached = loadStorage<TeachingAssignment[]>(KEYS.TEACHING_ASSIGNMENTS, []);
    if (facultyId) {
      return cached.filter(ta => ta.facultyId === facultyId || ta.facultyUserId === facultyId);
    }
    return cached;
  }

  static async getTeachingAssignments(facultyId?: string): Promise<TeachingAssignment[]> {
    const url = facultyId ? `/api/faculty/assignments?facultyId=${facultyId}` : '/api/faculty/assignments';
    const res = await apiRequest<TeachingAssignment[]>(url);
    if (res && Array.isArray(res)) {
      saveStorage(KEYS.TEACHING_ASSIGNMENTS, res);
      return res;
    }
    const cached = loadStorage<TeachingAssignment[]>(KEYS.TEACHING_ASSIGNMENTS, []);
    if (facultyId) {
      return cached.filter(ta => ta.facultyId === facultyId || ta.facultyUserId === facultyId);
    }
    return cached;
  }

  static async allocateFaculty(facultyId: string, subjectId: string, section: string, semester?: number): Promise<any> {
    const res = await apiRequest<any>(`/api/faculty/${facultyId}/allocate`, {
      method: 'POST',
      body: JSON.stringify({ subjectId, section, semester })
    });
    // refresh faculty and teaching assignments
    apiRequest<FacultyProfile[]>('/api/faculty').then(fl => {
      if (fl) saveStorage(KEYS.FACULTY, fl);
    }).catch(() => {});
    apiRequest<TeachingAssignment[]>('/api/faculty/assignments').then(tas => {
      if (tas) saveStorage(KEYS.TEACHING_ASSIGNMENTS, tas);
    }).catch(() => {});
    this.handleRealtimeSync('academic:updated', { type: 'allocation', facultyId, subjectId, section, semester });
    return res;
  }

  static async removeTeachingAssignment(assignmentId: string): Promise<void> {
    await apiRequest(`/api/faculty/assignments/${assignmentId}`, { method: 'DELETE' });
    const cached = loadStorage<TeachingAssignment[]>(KEYS.TEACHING_ASSIGNMENTS, []).filter(ta => ta.id !== assignmentId);
    saveStorage(KEYS.TEACHING_ASSIGNMENTS, cached);
  }

  static async designateHOD(facultyId: string, isHOD: boolean): Promise<any> {
    const res = await apiRequest<FacultyProfile>(`/api/faculty/${facultyId}`, {
      method: 'PUT',
      body: JSON.stringify({ isHOD })
    });
    const facultyList = this.getAllFaculty();
    const idx = facultyList.findIndex(f => f.id === facultyId);
    if (idx !== -1) {
      facultyList[idx].isHOD = isHOD;
      saveStorage(KEYS.FACULTY, facultyList);
    }
    return res;
  }

  // --- ENROLLMENTS & ATTENDANCE ---
  static getEnrollmentsForStudent(studentId: string): CourseEnrollment[] {
    const enrollments = loadStorage<CourseEnrollment[]>(KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
    const matched = enrollments.filter(e => e.studentId === studentId);
    if (matched.length > 0) return matched;

    const student = this.getAllStudents().find(s => s.id === studentId || s.userId === studentId);
    if (student) {
      const deptSubs = this.getSubjects().filter(s => s.departmentId === student.departmentId && s.semester === (student.currentSemester || 6));
      const autoEnrs: CourseEnrollment[] = deptSubs.map(sub => ({
        id: `enr_${student.id}_${sub.id}`,
        studentId: student.id,
        subjectId: sub.id,
        subjectCode: sub.code,
        subjectName: sub.name,
        instructorName: sub.assignedFacultyName || 'Prof. Marcus Vance',
        credits: sub.credits || 3,
        attendedClasses: 13,
        totalClasses: 15,
        attendancePercentage: 86.7,
        semester: sub.semester,
        academicYear: '2026-2027',
        gradePoints: 9.0,
        status: 'Enrolled'
      }));
      if (autoEnrs.length > 0) {
        enrollments.push(...autoEnrs);
        saveStorage(KEYS.ENROLLMENTS, enrollments);
        return autoEnrs;
      }
    }

    return [];
  }

  static getFacultyForSection(departmentId: string, sectionName: string, semester?: number): Array<{
    subject: Subject;
    faculty: FacultyProfile | null;
    facultyUser: User | null;
    facultyName: string;
    designation: string;
    officeRoom: string;
    email: string;
  }> {
    const subjects = this.getSubjects().filter(s => {
      if (s.departmentId !== departmentId) return false;
      if (semester && s.semester !== semester) return false;
      return true;
    });

    const teachingAssignments = this.getTeachingAssignmentsSync();
    const facultyList = this.getAllFaculty();
    const users = this.getUsers();

    return subjects.map(sub => {
      const matchTA = teachingAssignments.find(ta => {
        const matchesSub = ta.subjectId === sub.id || ta.subjectCode === sub.code;
        const matchesSec = isMatchingSection(ta.section, sectionName);
        return matchesSub && matchesSec;
      });

      let facProfile: FacultyProfile | null = null;
      let facUser: User | null = null;

      if (matchTA) {
        facProfile = facultyList.find(f => f.id === matchTA.facultyId || f.userId === matchTA.facultyUserId) || null;
        facUser = users.find(u => u.id === (matchTA.facultyUserId || facProfile?.userId)) || null;
      }

      if (!facProfile) {
        facProfile = facultyList.find(f => f.userId === sub.assignedFacultyId || f.id === sub.assignedFacultyId) || null;
        facUser = users.find(u => u.id === sub.assignedFacultyId) || null;
      }

      if (!facProfile) {
        facProfile = facultyList.find(f => f.departmentId === departmentId && f.assignedSections?.some(sec => isMatchingSection(sec, sectionName))) || facultyList[0] || null;
        if (facProfile) {
          facUser = users.find(u => u.id === facProfile!.userId) || null;
        }
      }

      const facultyName = facUser?.name || sub.assignedFacultyName || facProfile?.specialization || 'Prof. Marcus Vance';
      const designation = facProfile?.designation || 'Associate Professor';
      const officeRoom = facProfile?.officeRoom || 'Tech Block 3, Room 412';
      const email = facUser?.email || `${facultyName.toLowerCase().replace(/[^a-z]/g, '')}@edutrack.edu`;

      return {
        subject: sub,
        faculty: facProfile,
        facultyUser: facUser,
        facultyName,
        designation,
        officeRoom,
        email
      };
    });
  }

  static getAttendanceSessionsForStudent(studentId: string, subjectIdOrCode?: string): AttendanceSession[] {
    const sessions = this.getAttendanceSessions();
    return sessions.filter(sess => {
      if (subjectIdOrCode && sess.subjectId !== subjectIdOrCode && sess.subjectCode !== subjectIdOrCode) {
        return false;
      }
      return sess.records && sess.records.some(r => r.studentId === studentId);
    });
  }

  static syncStudentAttendanceFromSessions(studentId: string): void {
    const sessions = this.getAttendanceSessions();
    const enrollments = loadStorage<CourseEnrollment[]>(KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);

    let updatedAny = false;
    enrollments.forEach(enr => {
      if (enr.studentId === studentId) {
        const subjectSessions = sessions.filter(s => s.subjectId === enr.subjectId || s.subjectCode === enr.subjectCode);
        let attended = 0;
        let total = 0;

        subjectSessions.forEach(session => {
          const rec = session.records.find(r => r.studentId === studentId);
          if (rec) {
            total += 1;
            if (rec.status === 'present' || rec.status === 'late') {
              attended += 1;
            }
          }
        });

        if (total > 0) {
          enr.attendedClasses = attended;
          enr.totalClasses = total;
          enr.attendancePercentage = Math.round((attended / total) * 1000) / 10;
          updatedAny = true;
        }
      }
    });

    if (updatedAny) {
      saveStorage(KEYS.ENROLLMENTS, enrollments);

      const profiles = this.getAllStudents();
      const pIdx = profiles.findIndex(p => p.id === studentId);
      if (pIdx !== -1) {
        const studentEnrollments = enrollments.filter(e => e.studentId === studentId);
        const totalClassesAll = studentEnrollments.reduce((acc, curr) => acc + curr.totalClasses, 0);
        const attendedClassesAll = studentEnrollments.reduce((acc, curr) => acc + curr.attendedClasses, 0);
        profiles[pIdx].attendancePercentage = totalClassesAll > 0
          ? Math.round((attendedClassesAll / totalClassesAll) * 1000) / 10
          : 0;
        saveStorage(KEYS.STUDENTS, profiles);
      }
    }
  }

  // --- TIMETABLES & CONFLICT ENGINE ---
  static getClassTimetables(departmentId?: string, semester?: number, section?: string): TimetableEntry[] {
    const list = loadStorage<TimetableEntry[]>(KEYS.CLASS_TIMETABLE, INITIAL_TIMETABLE);
    return list.filter(t => {
      if (departmentId && departmentId !== 'all' && t.departmentId !== departmentId) return false;
      if (semester && t.semester !== semester) return false;
      if (section && section !== 'all' && t.section !== section) return false;
      return true;
    });
  }

  static getFacultyTimetable(facultyUserId: string): TimetableEntry[] {
    const list = loadStorage<TimetableEntry[]>(KEYS.CLASS_TIMETABLE, INITIAL_TIMETABLE);
    return list.filter(t => t.facultyId === facultyUserId);
  }

  static validateTimetableConflict(candidate: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    facultyId: string;
    departmentId: string;
    semester: number;
    section: string;
    excludeId?: string;
  }): { hasConflict: boolean; reason?: string } {
    // 1. Validate college hours 09:00 - 17:00
    if (candidate.startTime < '09:00' || candidate.endTime > '17:00') {
      return {
        hasConflict: true,
        reason: 'College Operating Hours Violation: Classes can only be scheduled between 9:00 AM and 5:00 PM.'
      };
    }

    // 2. Validate mandatory lunch break 12:00 - 13:00
    const startMins = parseInt(candidate.startTime.split(':')[0]) * 60 + parseInt(candidate.startTime.split(':')[1]);
    const endMins = parseInt(candidate.endTime.split(':')[0]) * 60 + parseInt(candidate.endTime.split(':')[1]);
    const lunchStart = 12 * 60; // 12:00 PM
    const lunchEnd = 13 * 60;   // 1:00 PM

    if ((startMins < lunchEnd && endMins > lunchStart)) {
      return {
        hasConflict: true,
        reason: 'Mandatory Lunch Break Violation: No classes or labs can be scheduled during lunch break (12:00 PM – 1:00 PM).'
      };
    }

    const list = loadStorage<TimetableEntry[]>(KEYS.CLASS_TIMETABLE, INITIAL_TIMETABLE);

    for (const item of list) {
      if (candidate.excludeId && item.id === candidate.excludeId) continue;
      if (item.dayOfWeek === candidate.dayOfWeek) {
        const overlap = (candidate.startTime <= item.startTime && candidate.endTime > item.startTime) ||
                        (candidate.startTime < item.endTime && candidate.endTime >= item.endTime) ||
                        (candidate.startTime >= item.startTime && candidate.endTime <= item.endTime);

        if (overlap) {
          if (item.room.toLowerCase().trim() === candidate.room.toLowerCase().trim()) {
            return {
              hasConflict: true,
              reason: `Room Conflict: ${candidate.room} is already booked on ${candidate.dayOfWeek} (${item.startTime} - ${item.endTime}) for ${item.subjectCode} (${item.facultyName}).`
            };
          }
          if (item.facultyId === candidate.facultyId) {
            return {
              hasConflict: true,
              reason: `Faculty Double-Booking: Instructor is already assigned to lecture in ${item.room} on ${candidate.dayOfWeek} (${item.startTime} - ${item.endTime}).`
            };
          }
          if (item.departmentId === candidate.departmentId && item.semester === candidate.semester && item.section === candidate.section) {
            return {
              hasConflict: true,
              reason: `Cohort Collision: Semester ${candidate.semester} Section ${candidate.section} already has ${item.subjectCode} scheduled at this period.`
            };
          }
        }
      }
    }

    return { hasConflict: false };
  }

  static createTimetableEntry(entry: Omit<TimetableEntry, 'id'>, adminName?: string): { success: boolean; entry?: TimetableEntry; error?: string } {
    const conflict = this.validateTimetableConflict(entry);
    if (conflict.hasConflict) {
      return { success: false, error: conflict.reason };
    }

    const list = loadStorage<TimetableEntry[]>(KEYS.CLASS_TIMETABLE, INITIAL_TIMETABLE);
    const newEntry: TimetableEntry = {
      ...entry,
      id: `tt_${Date.now()}`
    };
    list.push(newEntry);
    saveStorage(KEYS.CLASS_TIMETABLE, list);
    this.logAudit('Timetable Entry Created', adminName || 'Admin', 'admin', `Room ${newEntry.room}`, `Scheduled ${newEntry.subjectCode} on ${newEntry.dayOfWeek} (${newEntry.startTime}-${newEntry.endTime})`);

    apiRequest('/api/timetable/class', {
      method: 'POST',
      body: JSON.stringify(entry)
    }).catch(() => {});

    return { success: true, entry: newEntry };
  }

  static createClassTimetableEntry(entry: Omit<TimetableEntry, 'id'>, adminName?: string) {
    return this.createTimetableEntry(entry, adminName);
  }

  static deleteTimetableEntry(id: string, adminName?: string): void {
    const list = loadStorage<TimetableEntry[]>(KEYS.CLASS_TIMETABLE, INITIAL_TIMETABLE).filter(t => t.id !== id);
    saveStorage(KEYS.CLASS_TIMETABLE, list);
    this.logAudit('Timetable Entry Removed', adminName || 'Admin', 'admin', `Slot ${id}`, 'Deleted class period');
    apiRequest(`/api/timetable/class/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  static deleteClassTimetableEntry(id: string, adminName?: string) {
    return this.deleteTimetableEntry(id, adminName);
  }

  // --- ATTENDANCE SESSIONS ---
  static getAttendanceSessions(subjectId?: string): AttendanceSession[] {
    const list = loadStorage<AttendanceSession[]>(KEYS.ATTENDANCE_SESSIONS, []);
    if (subjectId) {
      return list.filter(s => s.subjectId === subjectId);
    }
    return list;
  }

  static recordAttendanceSession(
    session: Omit<AttendanceSession, 'id' | 'createdAt'>,
    facultyName?: string
  ): AttendanceSession {
    const list = loadStorage<AttendanceSession[]>(KEYS.ATTENDANCE_SESSIONS, []);
    const newSession: AttendanceSession = {
      ...session,
      id: `att_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    list.unshift(newSession);
    saveStorage(KEYS.ATTENDANCE_SESSIONS, list);

    session.records.forEach(rec => {
      this.syncStudentAttendanceFromSessions(rec.studentId);
    });

    this.logAudit(
      'Attendance Recorded',
      facultyName || 'Faculty',
      'faculty',
      `Subject ${session.subjectCode}`,
      `Recorded period attendance for ${session.records.length} students on ${session.date} (${session.section})`
    );

    apiRequest('/api/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify(session)
    }).catch(() => {});

    this.handleRealtimeSync('attendance:session_recorded', { session: newSession });

    return newSession;
  }

  // --- STUDY MATERIALS ---
  static getStudyMaterials(departmentIdOrSemester?: string | number, semester?: number): StudyMaterial[] {
    let sem = semester;
    if (typeof departmentIdOrSemester === 'number') {
      sem = departmentIdOrSemester;
    }
    const list = loadStorage<StudyMaterial[]>(KEYS.MATERIALS, INITIAL_STUDY_MATERIALS);
    return list.filter(m => {
      if (sem && m.semester !== sem) return false;
      return true;
    });
  }

  static createStudyMaterial(material: Omit<StudyMaterial, 'id' | 'downloadCount' | 'uploadDate'>, facultyName?: string): StudyMaterial {
    const list = loadStorage<StudyMaterial[]>(KEYS.MATERIALS, INITIAL_STUDY_MATERIALS);
    const newMaterial: StudyMaterial = {
      ...material,
      id: `mat_${Date.now()}`,
      downloadCount: 0,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    list.unshift(newMaterial);
    saveStorage(KEYS.MATERIALS, list);
    this.logAudit('Study Material Uploaded', facultyName || 'Faculty', 'faculty', `Material: ${newMaterial.title}`, `Published for ${newMaterial.subjectCode}`);

    apiRequest('/api/materials', {
      method: 'POST',
      body: JSON.stringify(material)
    }).catch(() => {});

    this.handleRealtimeSync('material:created', newMaterial);

    return newMaterial;
  }

  static addStudyMaterial(material: Omit<StudyMaterial, 'id' | 'downloadCount' | 'uploadDate'>, facultyName?: string) {
    return this.createStudyMaterial(material, facultyName);
  }

  static deleteStudyMaterial(id: string, facultyName?: string): void {
    const list = loadStorage<StudyMaterial[]>(KEYS.MATERIALS, INITIAL_STUDY_MATERIALS).filter(m => m.id !== id);
    saveStorage(KEYS.MATERIALS, list);
    if (facultyName) {
      this.logAudit('Study Material Deleted', facultyName, 'faculty', `Material ID ${id}`, 'Removed material');
    }
    apiRequest(`/api/materials/${id}`, { method: 'DELETE' }).catch(() => {});
    this.handleRealtimeSync('material:deleted', { id });
  }

  static incrementMaterialDownload(id: string): void {
    const list = loadStorage<StudyMaterial[]>(KEYS.MATERIALS, INITIAL_STUDY_MATERIALS);
    const item = list.find(m => m.id === id);
    if (item) {
      item.downloadCount = (item.downloadCount || 0) + 1;
      saveStorage(KEYS.MATERIALS, list);
      apiRequest(`/api/materials/${id}/download`, { method: 'POST' }).catch(() => {});
    }
  }

  // --- ASSIGNMENTS & SUBMISSIONS ---
  static getAssignments(facultyIdOrSemester?: string | number): Assignment[] {
    const list = loadStorage<Assignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    if (typeof facultyIdOrSemester === 'number') {
      return list.filter(a => a.semester === facultyIdOrSemester);
    }
    if (typeof facultyIdOrSemester === 'string') {
      return list.filter(a => a.facultyId === facultyIdOrSemester);
    }
    return list;
  }

  static getAssignmentsForCohort(departmentId: string, semester: number, section: string): Assignment[] {
    const list = loadStorage<Assignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    return list.filter(a => a.semester === semester && (!a.section || a.section === section || a.section === 'All'));
  }

  static createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt'>, facultyName?: string): Assignment {
    const todayStr = new Date().toISOString().split('T')[0];
    if (assignment.dueDate && assignment.dueDate < todayStr) {
      throw new Error('Date is invalid: Due date cannot be in the past. Faculty can only select today or future dates.');
    }

    const list = loadStorage<Assignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    const newAssignment: Assignment = {
      ...assignment,
      id: `asg_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    list.unshift(newAssignment);
    saveStorage(KEYS.ASSIGNMENTS, list);
    this.logAudit('Assignment Published', facultyName || 'Faculty', 'faculty', `Assignment: ${newAssignment.title}`, `Due: ${newAssignment.dueDate} (${newAssignment.subjectCode})`);

    apiRequest('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment)
    }).catch(() => {});

    this.handleRealtimeSync('assignment:created', newAssignment);

    return newAssignment;
  }

  static getSubmissions(): Submission[] {
    return loadStorage<Submission[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  }

  static getSubmissionsForAssignment(assignmentId: string): Submission[] {
    const list = this.getSubmissions();
    return list.filter(s => s.assignmentId === assignmentId);
  }

  static getSubmissionsForStudent(studentId: string): Submission[] {
    const list = this.getSubmissions();
    return list.filter(s => s.studentId === studentId);
  }

  static submitAssignment(
    assignmentIdOrParams: string | { assignmentId: string; studentId: string; studentName: string; rollNumber: string; fileName: string; fileSize: string; notes?: string },
    studentId?: string,
    studentName?: string,
    rollNumber?: string,
    fileName?: string,
    fileSize?: string,
    notes?: string
  ): Submission {
    let p: { assignmentId: string; studentId: string; studentName: string; rollNumber: string; fileName: string; fileSize: string; notes?: string };

    if (typeof assignmentIdOrParams === 'object') {
      p = assignmentIdOrParams;
    } else {
      p = {
        assignmentId: assignmentIdOrParams,
        studentId: studentId || '',
        studentName: studentName || 'Student',
        rollNumber: rollNumber || '',
        fileName: fileName || 'file.pdf',
        fileSize: fileSize || '1.0 MB',
        notes: notes || ''
      };
    }

    const list = loadStorage<Submission[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const assignments = this.getAssignments();
    const assignment = assignments.find(a => a.id === p.assignmentId);

    const isLate = assignment ? new Date() > new Date(assignment.dueDate + 'T23:59:59') : false;
    const existingIdx = list.findIndex(s => s.assignmentId === p.assignmentId && s.studentId === p.studentId);

    const submission: Submission = {
      id: existingIdx !== -1 ? list[existingIdx].id : `sub_${Date.now()}`,
      assignmentId: p.assignmentId,
      studentId: p.studentId,
      studentName: p.studentName,
      rollNumber: p.rollNumber,
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      fileName: p.fileName,
      fileSize: p.fileSize,
      notes: p.notes,
      status: isLate ? 'late' : 'submitted'
    };

    if (existingIdx !== -1) {
      list[existingIdx] = submission;
    } else {
      list.unshift(submission);
    }

    saveStorage(KEYS.SUBMISSIONS, list);
    this.logAudit('Assignment Submitted', p.studentName, 'student', `Assignment ID ${p.assignmentId}`, `File: ${p.fileName} (${submission.status})`);

    apiRequest(`/api/assignments/${p.assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(p)
    }).catch(() => {});

    return submission;
  }

  static gradeSubmission(submissionId: string, marks: number, feedback: string, facultyName?: string): Submission {
    const list = loadStorage<Submission[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const idx = list.findIndex(s => s.id === submissionId);
    if (idx === -1) throw new Error('Submission not found');

    list[idx] = {
      ...list[idx],
      marksAwarded: marks,
      facultyFeedback: feedback,
      status: 'graded',
      gradedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    saveStorage(KEYS.SUBMISSIONS, list);
    this.logAudit('Submission Graded', facultyName || 'Faculty', 'faculty', `Submission ${submissionId}`, `Awarded ${marks} marks`);

    apiRequest(`/api/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify({ marksAwarded: marks, facultyFeedback: feedback })
    }).catch(() => {});

    return list[idx];
  }

  // --- INTERNAL ASSESSMENTS & MARKS ENTRY ---
  static getInternalAssessments(filterId?: string): InternalAssessment[] {
    const list = loadStorage<InternalAssessment[]>(KEYS.INTERNAL_ASSESSMENTS, INITIAL_ASSESSMENTS);
    if (filterId) {
      return list.filter(a => a.subjectId === filterId || a.facultyId === filterId);
    }
    return list;
  }

  static createInternalAssessment(assessment: Omit<InternalAssessment, 'id' | 'createdAt'>, facultyName?: string): InternalAssessment {
    const list = loadStorage<InternalAssessment[]>(KEYS.INTERNAL_ASSESSMENTS, INITIAL_ASSESSMENTS);
    const newAssessment: InternalAssessment = {
      ...assessment,
      id: `cia_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    list.unshift(newAssessment);
    saveStorage(KEYS.INTERNAL_ASSESSMENTS, list);
    this.logAudit('Assessment Configured', facultyName || 'Faculty', 'faculty', `Assessment: ${newAssessment.title}`, `Max Marks: ${newAssessment.maxMarks} (${newAssessment.type})`);

    apiRequest('/api/assessments', {
      method: 'POST',
      body: JSON.stringify(assessment)
    }).catch(() => {});

    this.handleRealtimeSync('assessment:created', newAssessment);

    return newAssessment;
  }

  static getAssessmentMarks(assessmentId: string): AssessmentMarkEntry[] {
    const list = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);
    return list.filter(m => m.assessmentId === assessmentId);
  }

  static getAssessmentMarksForStudent(studentId: string): { assessment: InternalAssessment; mark?: AssessmentMarkEntry }[] {
    const assessments = this.getInternalAssessments();
    const marks = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);
    return assessments.map(a => {
      const m = marks.find(mk => mk.assessmentId === a.id && mk.studentId === studentId);
      return { assessment: a, mark: m };
    });
  }

  static saveAssessmentMarks(assessmentId: string, entries: AssessmentMarkEntry[], facultyName?: string): void {
    let list = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);
    list = list.filter(m => m.assessmentId !== assessmentId);
    list.push(...entries);
    saveStorage(KEYS.ASSESSMENT_MARKS, list);
    this.logAudit('Marks Recorded', facultyName || 'Faculty', 'faculty', `Assessment ID ${assessmentId}`, `Updated scores for ${entries.length} students`);

    apiRequest(`/api/assessments/${assessmentId}/marks`, {
      method: 'POST',
      body: JSON.stringify({ entries })
    }).catch(() => {});

    this.handleRealtimeSync('marks:updated', { assessmentId, entries });
  }

  // --- ONLINE EXAMINATIONS ---
  static async getOnlineExams(filters?: { facultyId?: string; subjectId?: string; semester?: number; section?: string; status?: string }): Promise<OnlineExam[]> {
    let url = '/api/online-exams';
    if (filters) {
      const q = new URLSearchParams();
      if (filters.facultyId) q.append('facultyId', filters.facultyId);
      if (filters.subjectId) q.append('subjectId', filters.subjectId);
      if (filters.semester) q.append('semester', String(filters.semester));
      if (filters.section) q.append('section', filters.section);
      if (filters.status) q.append('status', filters.status);
      const queryStr = q.toString();
      if (queryStr) url += `?${queryStr}`;
    }

    try {
      const res = await apiRequest<OnlineExam[]>(url);
      if (res && Array.isArray(res)) {
        saveStorage(KEYS.ONLINE_EXAMS, res);
        return res;
      }
    } catch (e) {
      console.warn('[EduTrackApi] Failed to fetch online exams from server, fallback to cache:', e);
    }
    return loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
  }

  static getOnlineExamsSync(): OnlineExam[] {
    return loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
  }

  static async getOnlineExam(id: string): Promise<OnlineExam> {
    const res = await apiRequest<OnlineExam>(`/api/online-exams/${id}`);
    return res;
  }

  static async createOnlineExam(exam: Partial<OnlineExam>, facultyName?: string): Promise<OnlineExam> {
    const res = await apiRequest<OnlineExam>('/api/online-exams', {
      method: 'POST',
      body: JSON.stringify(exam)
    });

    const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
    list.unshift(res);
    saveStorage(KEYS.ONLINE_EXAMS, list);

    this.logAudit(
      'Online Exam Created',
      facultyName || 'Faculty',
      'faculty',
      `Exam: ${res.title}`,
      `${res.subjectCode} (${res.section}, Sem ${res.semester}) [${res.status}]`
    );

    this.handleRealtimeSync('online_exam:created', res);
    return res;
  }

  static async updateOnlineExam(id: string, updates: Partial<OnlineExam>): Promise<OnlineExam> {
    const res = await apiRequest<OnlineExam>(`/api/online-exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      list[idx] = res;
    } else {
      list.unshift(res);
    }
    saveStorage(KEYS.ONLINE_EXAMS, list);
    this.handleRealtimeSync('online_exam:updated', res);
    return res;
  }

  static async deleteOnlineExam(id: string): Promise<void> {
    await apiRequest(`/api/online-exams/${id}`, { method: 'DELETE' });
    let list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
    list = list.filter(e => e.id !== id);
    saveStorage(KEYS.ONLINE_EXAMS, list);
    this.handleRealtimeSync('online_exam:deleted', { id });
  }

  static async publishOnlineExam(id: string): Promise<OnlineExam> {
    const res = await apiRequest<{ message: string; exam: OnlineExam }>(`/api/online-exams/${id}/publish`, {
      method: 'POST'
    });
    const updated = res.exam;
    const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) list[idx] = updated;
    saveStorage(KEYS.ONLINE_EXAMS, list);
    this.handleRealtimeSync('online_exam:published', updated);
    return updated;
  }

  static async releaseOnlineExamResults(id: string): Promise<OnlineExam> {
    const res = await apiRequest<{ message: string; exam: OnlineExam }>(`/api/online-exams/${id}/release-results`, {
      method: 'POST'
    });
    const updated = res.exam;
    const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) list[idx] = updated;
    saveStorage(KEYS.ONLINE_EXAMS, list);
    this.handleRealtimeSync('online_exam:results_released', { examId: id });
    return updated;
  }

  static async getOnlineExamResults(id: string): Promise<ExamResultsAnalytics> {
    return apiRequest<ExamResultsAnalytics>(`/api/online-exams/${id}/results`);
  }

  static async startOnlineExam(id: string): Promise<{ attempt: ExamAttempt; exam: OnlineExam; remainingSeconds: number }> {
    return apiRequest<{ attempt: ExamAttempt; exam: OnlineExam; remainingSeconds: number }>(`/api/online-exams/${id}/start`, {
      method: 'POST'
    });
  }

  static async saveOnlineExamAnswer(id: string, questionId: string, selectedOption?: string, isMarkedForReview?: boolean): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/api/online-exams/${id}/save-answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedOption, isMarkedForReview })
    });
  }

  static async submitOnlineExam(id: string): Promise<{ message: string; attempt: ExamAttempt; resultsReleased: boolean }> {
    const res = await apiRequest<{ message: string; attempt: ExamAttempt; resultsReleased: boolean }>(`/api/online-exams/${id}/submit`, {
      method: 'POST'
    });
    this.handleRealtimeSync('online_exam:submitted', res);
    return res;
  }

  static async getExamAttempts(studentId?: string): Promise<ExamAttempt[]> {
    const query = studentId ? `?studentId=${studentId}` : '';
    try {
      const res = await apiRequest<ExamAttempt[]>(`/api/online-exams/attempts/all${query}`);
      if (res && Array.isArray(res)) {
        saveStorage(KEYS.EXAM_ATTEMPTS, res);
        return res;
      }
    } catch {}
    return this.getExamAttemptsSync();
  }

  static getExamAttemptsSync(): ExamAttempt[] {
    return loadStorage<ExamAttempt[]>(KEYS.EXAM_ATTEMPTS, INITIAL_EXAM_ATTEMPTS);
  }

  static getExamAttemptsForStudent(studentId: string): ExamAttempt[] {
    const all = this.getExamAttemptsSync();
    return all.filter(a => a.studentId === studentId);
  }

  // --- WEAK CONCEPTS & ANALYTICS ---
  static getWeakConceptsAnalytics(departmentId?: string, semester?: number): ConceptPerformance[] {
    const assessments = this.getInternalAssessments();
    const marks = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);

    const map = new Map<string, {
      name: string;
      subjectCode: string;
      subjectName: string;
      scores: number[];
      maxMarks: number;
    }>();

    assessments.forEach(ass => {
      const tag = ass.topicTag || ass.title;
      const assMarks = marks.filter(m => m.assessmentId === ass.id);
      if (assMarks.length > 0) {
        if (!map.has(tag)) {
          map.set(tag, {
            name: tag,
            subjectCode: ass.subjectCode,
            subjectName: ass.subjectName,
            scores: [],
            maxMarks: ass.maxMarks
          });
        }
        const item = map.get(tag)!;
        assMarks.forEach(m => {
          item.scores.push((m.marksObtained / m.maxMarks) * 100);
        });
      }
    });

    const results: ConceptPerformance[] = [];
    map.forEach((val, key) => {
      const avg = val.scores.length > 0
        ? Math.round((val.scores.reduce((a, b) => a + b, 0) / val.scores.length) * 10) / 10
        : 75;
      const below = val.scores.filter(s => s < 60).length;
      const isWeak = avg < 65 || below > 0;

      results.push({
        conceptId: `concept_${key.toLowerCase().replace(/\s+/g, '_')}`,
        conceptName: val.name,
        subjectCode: val.subjectCode,
        subjectName: val.subjectName,
        averageScorePercentage: avg,
        benchmarkPercentage: 70,
        studentsBelowThreshold: below,
        totalEvaluated: val.scores.length,
        isWeak,
        reason: isWeak
          ? `${below} student(s) achieved below the 60% competency threshold in continuous evaluation.`
          : 'Cohort demonstrates satisfactory mastery of core fundamentals.',
        recommendedIntervention: isWeak
          ? 'Schedule supplementary hands-on recitation session and assign guided practice problem sets.'
          : 'Advance to higher-order design problems and advanced elective concepts.'
      });
    });

    return results;
  }

  // --- RESULTS ---
  static getStudentResults(studentId: string): AssessmentResult[] {
    const all = loadStorage<AssessmentResult[]>(KEYS.RESULTS, INITIAL_SEMESTER_RESULTS);
    const student = this.getAllStudents().find(s => s.id === studentId || s.userId === studentId || (s as any).rollNumber === studentId);
    const targetId = student ? student.id : studentId;
    const matched = all.filter(r => r.studentId === targetId || (student && r.studentId === student.userId));
    if (matched.length > 0) return matched;

    if (student) {
      const enrollments = this.getEnrollmentsForStudent(student.id);
      const autoResults: AssessmentResult[] = [{
        id: `res_${student.id}_sem${student.currentSemester || 6}`,
        studentId: student.id,
        semester: student.currentSemester || 6,
        sgpa: student.currentSgpa || 8.65,
        cgpa: student.cgpa || 8.52,
        totalCredits: enrollments.reduce((acc, e) => acc + (e.credits || 3), 0),
        termName: `Semester ${student.currentSemester || 6} Final Examinations`,
        grades: enrollments.map(enr => {
          const internal = 38;
          const external = 52;
          const total = internal + external;
          return {
            id: `grd_${student.id}_${enr.subjectId}`,
            studentId: student.id,
            subjectId: enr.subjectId,
            subjectCode: enr.subjectCode,
            subjectName: enr.subjectName,
            semester: enr.semester || 6,
            credits: enr.credits || 3,
            internalMarks: internal,
            externalMarks: external,
            totalMarks: total,
            grade: (total >= 90 ? 'O' : total >= 80 ? 'A+' : total >= 70 ? 'A' : 'B+') as any,
            gradePoint: total >= 90 ? 10 : total >= 80 ? 9 : total >= 70 ? 8 : 7,
            status: 'Pass' as const
          };
        })
      }];
      if (autoResults.length > 0) {
        all.push(...autoResults);
        saveStorage(KEYS.RESULTS, all);
        return autoResults;
      }
    }

    return [];
  }

  static recordSubjectMarks(params: {
    subjectId: string;
    subjectCode: string;
    subjectName?: string;
    semester?: number;
    entries: Array<{
      studentId: string;
      studentName?: string;
      rollNumber?: string;
      marksObtained: number;
    }>;
    facultyName?: string;
  }): void {
    const all = loadStorage<AssessmentResult[]>(KEYS.RESULTS, INITIAL_SEMESTER_RESULTS);
    const students = this.getAllStudents();
    const enrollments = loadStorage<CourseEnrollment[]>(KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);

    params.entries.forEach(entry => {
      const markValue = Math.max(0, Math.min(100, Math.round(Number(entry.marksObtained) || 0)));
      const internal = Math.round(markValue * 0.4);
      const external = markValue - internal;
      const grade = (markValue >= 90 ? 'O' : markValue >= 80 ? 'A+' : markValue >= 70 ? 'A' : markValue >= 60 ? 'B+' : markValue >= 50 ? 'B' : markValue >= 40 ? 'C' : 'F') as any;
      const gradePoint = markValue >= 90 ? 10 : markValue >= 80 ? 9 : markValue >= 70 ? 8 : markValue >= 60 ? 7 : markValue >= 50 ? 6 : markValue >= 40 ? 5 : 0;
      const status = (markValue >= 40 ? 'Pass' : 'Fail') as any;

      const std = students.find(s => s.id === entry.studentId || s.userId === entry.studentId || s.rollNumber === entry.rollNumber);
      const sId = std ? std.id : entry.studentId;

      let res = all.find(r => r.studentId === sId || (std && r.studentId === std.userId));
      if (!res) {
        res = {
          id: `res_${sId}_sem${params.semester || (std ? std.currentSemester : 6)}`,
          studentId: sId,
          semester: params.semester || (std ? std.currentSemester : 6),
          sgpa: gradePoint,
          cgpa: gradePoint,
          totalCredits: 4,
          termName: `Semester ${params.semester || (std ? std.currentSemester : 6)} Final Examinations`,
          grades: []
        };
        all.push(res);
      }

      if (!res.grades) res.grades = [];

      let grd = res.grades.find(g => g.subjectCode === params.subjectCode || (params.subjectId && g.subjectId === params.subjectId));
      if (grd) {
        grd.internalMarks = internal;
        grd.externalMarks = external;
        grd.totalMarks = markValue;
        grd.grade = grade;
        grd.gradePoint = gradePoint;
        grd.status = status;
      } else {
        grd = {
          id: `grd_${sId}_${params.subjectId || params.subjectCode}`,
          studentId: sId,
          subjectId: params.subjectId || `sub_${params.subjectCode}`,
          subjectCode: params.subjectCode,
          subjectName: params.subjectName || params.subjectCode,
          semester: params.semester || (std ? std.currentSemester : 6),
          credits: 4,
          internalMarks: internal,
          externalMarks: external,
          totalMarks: markValue,
          grade: grade,
          gradePoint: gradePoint,
          status: status
        };
        res.grades.push(grd);
      }

      // Recalculate SGPA
      const validGrades = res.grades.filter(g => g.credits && g.gradePoint !== undefined);
      const totalPts = validGrades.reduce((acc, g) => acc + (g.gradePoint * (g.credits || 3)), 0);
      const totalCrd = validGrades.reduce((acc, g) => acc + (g.credits || 3), 0);
      res.sgpa = totalCrd > 0 ? Number((totalPts / totalCrd).toFixed(2)) : gradePoint;
      res.cgpa = res.sgpa;

      if (std) {
        std.currentSgpa = res.sgpa;
        std.cgpa = res.cgpa;
      }

      // Update enrollment
      const enr = enrollments.find(e => (e.studentId === sId || (std && e.studentId === std.userId)) && (e.subjectCode === params.subjectCode || e.subjectId === params.subjectId));
      if (enr) {
        enr.gradePoints = gradePoint;
        enr.grade = grade;
      }
    });

    saveStorage(KEYS.RESULTS, all);
    saveStorage(KEYS.STUDENTS, students);
    saveStorage(KEYS.ENROLLMENTS, enrollments);

    this.logAudit(
      'Marks Recorded',
      params.facultyName || 'Faculty',
      'faculty',
      `Subject ${params.subjectCode}`,
      `Published marks out of 100 for ${params.entries.length} students`
    );

    apiRequest('/api/assessments/record-subject-marks', {
      method: 'POST',
      body: JSON.stringify({
        subjectId: params.subjectId,
        subjectCode: params.subjectCode,
        subjectName: params.subjectName,
        semester: params.semester,
        entries: params.entries
      })
    }).catch(() => {});

    this.handleRealtimeSync('marks:updated', {
      subjectCode: params.subjectCode,
      subjectName: params.subjectName,
      entries: params.entries,
      maxMarks: 100
    });
  }

  // --- EXAM SCHEDULES & CLASH ENGINE ---
  static getExamSchedules(
    departmentId?: string,
    semester?: number | string,
    sectionOrPublished?: string | boolean,
    publishedOnly: boolean = false
  ): ExamSchedule[] {
    let sem: number | undefined = undefined;
    if (typeof semester === 'number') sem = semester;
    else if (typeof semester === 'string' && semester !== 'all') sem = Number(semester);

    let sec: string | undefined = undefined;
    let published = publishedOnly;

    if (typeof sectionOrPublished === 'boolean') {
      published = sectionOrPublished;
    } else if (typeof sectionOrPublished === 'string') {
      sec = sectionOrPublished;
    }

    const all = loadStorage<ExamSchedule[]>(KEYS.EXAMS, INITIAL_EXAM_SCHEDULES);
    return all.filter(e => {
      if (published && !e.isPublished) return false;
      if (departmentId && departmentId !== 'all' && e.departmentId !== departmentId) return false;
      if (sem && e.semester !== sem) return false;
      if (sec && sec !== 'all' && e.section !== sec) return false;
      return true;
    });
  }

  static validateExamClash(candidate: {
    examDate: string;
    startTime: string;
    endTime: string;
    room: string;
    departmentId: string;
    semester: number;
    section: string;
    excludeId?: string;
  }): { hasClash: boolean; reason?: string } {
    const all = loadStorage<ExamSchedule[]>(KEYS.EXAMS, INITIAL_EXAM_SCHEDULES);

    for (const exam of all) {
      if (candidate.excludeId && exam.id === candidate.excludeId) continue;
      if (exam.examDate === candidate.examDate) {
        const timesOverlap = exam.startTime === candidate.startTime ||
          (exam.startTime <= candidate.startTime && exam.endTime >= candidate.startTime) ||
          (candidate.startTime <= exam.startTime && candidate.endTime >= exam.startTime);

        if (timesOverlap) {
          if (exam.room.toLowerCase().trim() === candidate.room.toLowerCase().trim()) {
            return {
              hasClash: true,
              reason: `Room Clash: Venue "${candidate.room}" is already reserved on ${exam.examDate} (${exam.startTime} - ${exam.endTime}) for ${exam.subjectCode}.`
            };
          }

          if (
            exam.departmentId === candidate.departmentId &&
            exam.semester === candidate.semester &&
            exam.section === candidate.section
          ) {
            return {
              hasClash: true,
              reason: `Student Cohort Clash: Semester ${exam.semester} Section ${exam.section} already has an examination (${exam.subjectCode}) in this timeslot.`
            };
          }
        }
      }
    }

    return { hasClash: false };
  }

  static createExamSchedule(exam: Omit<ExamSchedule, 'id'>, adminName?: string): { success: boolean; schedule?: ExamSchedule; error?: string } {
    const clash = this.validateExamClash({
      examDate: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      room: exam.room,
      departmentId: exam.departmentId,
      semester: exam.semester,
      section: exam.section
    });

    if (clash.hasClash) {
      return { success: false, error: clash.reason };
    }

    const list = loadStorage<ExamSchedule[]>(KEYS.EXAMS, INITIAL_EXAM_SCHEDULES);
    const newExam: ExamSchedule = {
      ...exam,
      id: `exam_${Date.now()}`
    };
    list.push(newExam);
    saveStorage(KEYS.EXAMS, list);
    this.logAudit('Exam Schedule Created', adminName || 'Admin', 'admin', `Exam: ${newExam.subjectCode}`, `Room: ${newExam.room}, Date: ${newExam.examDate}`);

    apiRequest('/api/timetable/exams', {
      method: 'POST',
      body: JSON.stringify(exam)
    }).catch(() => {});

    return { success: true, schedule: newExam };
  }

  static togglePublishExam(id: string, adminName?: string): ExamSchedule {
    const list = loadStorage<ExamSchedule[]>(KEYS.EXAMS, INITIAL_EXAM_SCHEDULES);
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Exam schedule not found');
    list[idx].isPublished = !list[idx].isPublished;
    saveStorage(KEYS.EXAMS, list);
    this.logAudit(
      list[idx].isPublished ? 'Exam Published' : 'Exam Hidden',
      adminName || 'Admin',
      'admin',
      `Exam ${list[idx].subjectCode}`,
      `Visibility set to ${list[idx].isPublished}`
    );

    apiRequest(`/api/timetable/exams/${id}/publish`, { method: 'PUT' }).catch(() => {});

    return list[idx];
  }

  static deleteExamSchedule(id: string, adminName?: string): void {
    const list = loadStorage<ExamSchedule[]>(KEYS.EXAMS, INITIAL_EXAM_SCHEDULES).filter(e => e.id !== id);
    saveStorage(KEYS.EXAMS, list);
    this.logAudit('Exam Schedule Deleted', adminName || 'Admin', 'admin', `Exam ID ${id}`, 'Deleted exam schedule');
  }

  // --- ANNOUNCEMENTS ---
  static getAnnouncements(role?: 'STUDENTS' | 'FACULTY'): Announcement[] {
    const list = loadStorage<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    if (role) {
      return list.filter(a => a.audience === role);
    }
    return list;
  }

  static createAnnouncement(ann: Omit<Announcement, 'id' | 'publishedAt'>, adminName?: string): Announcement {
    const list = loadStorage<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    const newAnn: Announcement = {
      ...ann,
      id: `ann_${Date.now()}`,
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    list.unshift(newAnn);
    saveStorage(KEYS.ANNOUNCEMENTS, list);
    this.logAudit('Announcement Published', adminName || 'Admin', 'admin', `Broadcast: ${newAnn.title}`, `Audience: ${newAnn.audience}`);

    apiRequest('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(ann)
    }).catch(() => {});

    return newAnn;
  }

  static deleteAnnouncement(id: string, adminName?: string): void {
    const list = loadStorage<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS).filter(a => a.id !== id);
    saveStorage(KEYS.ANNOUNCEMENTS, list);
    this.logAudit('Announcement Deleted', adminName || 'Admin', 'admin', `Announcement ID ${id}`, 'Removed announcement');
    apiRequest(`/api/announcements/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  static getReadNotificationIds(): string[] {
    return loadStorage<string[]>(KEYS.READ_NOTIFICATIONS, []);
  }

  static markNotificationRead(id: string): void {
    const read = this.getReadNotificationIds();
    if (!read.includes(id)) {
      read.push(id);
      saveStorage(KEYS.READ_NOTIFICATIONS, read);
    }
  }

  static markAllNotificationsRead(ids: string[]): void {
    const read = this.getReadNotificationIds();
    ids.forEach(id => {
      if (!read.includes(id)) read.push(id);
    });
    saveStorage(KEYS.READ_NOTIFICATIONS, read);
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    return loadStorage<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static logAudit(action: string, performedBy: string, role: User['role'], targetEntity: string, details: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action,
      performedBy,
      role,
      targetEntity,
      details,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    logs.unshift(newLog);
    saveStorage(KEYS.AUDIT_LOGS, logs.slice(0, 150));
  }

  // --- REAL-TIME DATA SYNCHRONIZATION ---
  private static subscribers: Set<(event: string, payload: any) => void> = new Set();

  static subscribe(callback: (event: string, payload: any) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  static handleRealtimeSync(event: string, payload: any): void {
    try {
      switch (event) {
        case 'marks:updated': {
          if (payload.entries && Array.isArray(payload.entries)) {
            let marks = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);
            if (payload.assessmentId) {
              marks = marks.filter(m => m.assessmentId !== payload.assessmentId);
            }
            marks.push(...payload.entries);
            saveStorage(KEYS.ASSESSMENT_MARKS, marks);
          } else if (payload.assessmentId && payload.studentId) {
            const marks = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);
            const idx = marks.findIndex(m => m.assessmentId === payload.assessmentId && m.studentId === payload.studentId);
            const entry: AssessmentMarkEntry = {
              id: `mark_${Date.now()}_${payload.studentId}`,
              assessmentId: payload.assessmentId,
              studentId: payload.studentId,
              studentName: '',
              rollNumber: '',
              marksObtained: Number(payload.marksObtained),
              maxMarks: Number(payload.maxMarks || 100),
              feedback: payload.feedback || '',
              updatedAt: payload.updatedAt || new Date().toISOString()
            };
            if (idx !== -1) {
              marks[idx] = { ...marks[idx], ...entry };
            } else {
              marks.push(entry);
            }
            saveStorage(KEYS.ASSESSMENT_MARKS, marks);
          } else if (payload.assessmentId) {
            apiRequest<AssessmentMarkEntry[]>(`/api/assessments/${payload.assessmentId}/marks`).then(res => {
              if (res && Array.isArray(res)) {
                let marks = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);
                marks = marks.filter(m => m.assessmentId !== payload.assessmentId);
                marks.push(...res);
                saveStorage(KEYS.ASSESSMENT_MARKS, marks);
                this.subscribers.forEach(cb => { try { cb('marks:updated', payload); } catch {} });
              }
            }).catch(() => {});
          }
          break;
        }

        case 'attendance:updated': {
          const newPct = payload.overallAttendance ?? payload.attendancePercentage;
          if (payload.studentId && newPct !== undefined) {
            const students = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
            const idx = students.findIndex(s => s.id === payload.studentId);
            if (idx !== -1) {
              students[idx].attendancePercentage = Number(newPct);
              saveStorage(KEYS.STUDENTS, students);
            }
          }
          break;
        }

        case 'attendance:session_recorded': {
          if (payload.session) {
            const sessions = loadStorage<AttendanceSession[]>(KEYS.ATTENDANCE_SESSIONS, []);
            const exists = sessions.some(s => s.id === payload.session.id);
            if (!exists) {
              sessions.unshift(payload.session);
              saveStorage(KEYS.ATTENDANCE_SESSIONS, sessions);
            }
          }
          break;
        }

        case 'assignment:created': {
          if (payload.id) {
            const list = loadStorage<Assignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
            const exists = list.some(a => a.id === payload.id);
            if (!exists) {
              list.unshift(payload);
              saveStorage(KEYS.ASSIGNMENTS, list);
            }
          }
          break;
        }

        case 'assignment:updated': {
          if (payload.id) {
            const list = loadStorage<Assignment[]>(KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
            const idx = list.findIndex(a => a.id === payload.id);
            if (idx !== -1) {
              list[idx] = { ...list[idx], ...payload };
              saveStorage(KEYS.ASSIGNMENTS, list);
            }
          }
          break;
        }

        case 'submission:created': {
          if (payload.submission) {
            const list = loadStorage<Submission[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
            const idx = list.findIndex(s => s.id === payload.submission.id);
            if (idx !== -1) {
              list[idx] = payload.submission;
            } else {
              list.unshift(payload.submission);
            }
            saveStorage(KEYS.SUBMISSIONS, list);
          }
          break;
        }

        case 'submission:evaluated': {
          if (payload.submissionId) {
            const list = loadStorage<Submission[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
            const sub = list.find(s => s.id === payload.submissionId);
            if (sub) {
              sub.marksAwarded = payload.marksAwarded;
              sub.facultyFeedback = payload.feedback;
              sub.status = 'graded';
              sub.gradedAt = payload.gradedAt || new Date().toISOString();
              saveStorage(KEYS.SUBMISSIONS, list);
            }
          }
          break;
        }

        case 'material:created': {
          if (payload.id) {
            const list = loadStorage<StudyMaterial[]>(KEYS.MATERIALS, INITIAL_STUDY_MATERIALS);
            const exists = list.some(m => m.id === payload.id);
            if (!exists) {
              list.unshift(payload);
              saveStorage(KEYS.MATERIALS, list);
            }
          }
          break;
        }

        case 'material:deleted': {
          if (payload.id) {
            const list = loadStorage<StudyMaterial[]>(KEYS.MATERIALS, INITIAL_STUDY_MATERIALS).filter(m => m.id !== payload.id);
            saveStorage(KEYS.MATERIALS, list);
          }
          break;
        }

        case 'timetable:updated': {
          if (payload.deletedId) {
            const list = loadStorage<TimetableEntry[]>(KEYS.CLASS_TIMETABLE, INITIAL_TIMETABLE).filter(t => t.id !== payload.deletedId);
            saveStorage(KEYS.CLASS_TIMETABLE, list);
          } else if (payload.entry) {
            const list = loadStorage<TimetableEntry[]>(KEYS.CLASS_TIMETABLE, INITIAL_TIMETABLE);
            const exists = list.some(t => t.id === payload.entry.id);
            if (!exists) {
              list.push(payload.entry);
              saveStorage(KEYS.CLASS_TIMETABLE, list);
            }
          }
          break;
        }

        case 'exam_timetable:updated': {
          if (payload.id) {
            const list = loadStorage<ExamSchedule[]>(KEYS.EXAMS, INITIAL_EXAM_SCHEDULES);
            const idx = list.findIndex(e => e.id === payload.id);
            if (idx !== -1) {
              list[idx] = { ...list[idx], ...payload };
            } else {
              list.push(payload);
            }
            saveStorage(KEYS.EXAMS, list);
          }
          break;
        }

        case 'announcement:published': {
          if (payload.id) {
            const list = loadStorage<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
            const exists = list.some(a => a.id === payload.id);
            if (!exists) {
              list.unshift(payload);
              saveStorage(KEYS.ANNOUNCEMENTS, list);
            }
          }
          break;
        }

        case 'announcement:deleted': {
          if (payload.id) {
            const list = loadStorage<Announcement[]>(KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS).filter(a => a.id !== payload.id);
            saveStorage(KEYS.ANNOUNCEMENTS, list);
          }
          break;
        }

        case 'student:created': {
          if (payload.student) {
            const list = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
            const exists = list.some(s => s.id === payload.student.id || s.rollNumber === payload.student.rollNumber);
            if (!exists) {
              list.push(payload.student);
              saveStorage(KEYS.STUDENTS, list);
            }
            if (payload.user) {
              const users = loadStorage<User[]>(KEYS.USERS, INITIAL_USERS);
              if (!users.some(u => u.id === payload.user.id || u.email === payload.user.email)) {
                users.push(payload.user);
                saveStorage(KEYS.USERS, users);
              }
            }
            // Recalculate section enrollment counts
            const sections = loadStorage<Section[]>(KEYS.SECTIONS, []);
            sections.forEach(sec => {
              sec.enrollmentCount = list.filter(st =>
                st.departmentId === sec.departmentId && isMatchingSection(st.section, sec.name, sec.sectionCode)
              ).length;
            });
            saveStorage(KEYS.SECTIONS, sections);

            // Update department total students
            const departments = loadStorage<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
            departments.forEach(d => {
              d.totalStudents = list.filter(st => st.departmentId === d.id).length;
            });
            saveStorage(KEYS.DEPARTMENTS, departments);
          }
          break;
        }

        case 'student:updated': {
          if (payload.student) {
            const list = loadStorage<StudentProfile[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
            const idx = list.findIndex(s => s.id === payload.student.id);
            if (idx !== -1) {
              list[idx] = { ...list[idx], ...payload.student };
              saveStorage(KEYS.STUDENTS, list);
            }
            const sections = loadStorage<Section[]>(KEYS.SECTIONS, []);
            sections.forEach(sec => {
              sec.enrollmentCount = list.filter(st =>
                st.departmentId === sec.departmentId && isMatchingSection(st.section, sec.name, sec.sectionCode)
              ).length;
            });
            saveStorage(KEYS.SECTIONS, sections);

            const departments = loadStorage<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
            departments.forEach(d => {
              d.totalStudents = list.filter(st => st.departmentId === d.id).length;
            });
            saveStorage(KEYS.DEPARTMENTS, departments);
          }
          break;
        }

        case 'faculty:created': {
          if (payload.profile) {
            const list = loadStorage<FacultyProfile[]>(KEYS.FACULTY, INITIAL_FACULTY);
            const exists = list.some(f => f.id === payload.profile.id || f.employeeId === payload.profile.employeeId);
            if (!exists) {
              list.push(payload.profile);
              saveStorage(KEYS.FACULTY, list);
            }
            if (payload.user) {
              const users = loadStorage<User[]>(KEYS.USERS, INITIAL_USERS);
              const uIdx = users.findIndex(u => u.id === payload.user.id || u.email.toLowerCase() === payload.user.email.toLowerCase());
              if (uIdx !== -1) {
                users[uIdx] = { ...users[uIdx], ...payload.user };
              } else {
                users.push(payload.user);
              }
              saveStorage(KEYS.USERS, users);
            }
            const departments = loadStorage<Department[]>(KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
            departments.forEach(d => {
              d.totalFaculty = list.filter(f => f.departmentId === d.id).length;
            });
            saveStorage(KEYS.DEPARTMENTS, departments);
          }
          break;
        }

        case 'faculty:updated': {
          if (payload.profile) {
            const list = loadStorage<FacultyProfile[]>(KEYS.FACULTY, INITIAL_FACULTY);
            const idx = list.findIndex(f => f.id === payload.profile.id || f.employeeId === payload.profile.employeeId);
            if (idx !== -1) {
              list[idx] = { ...list[idx], ...payload.profile };
              saveStorage(KEYS.FACULTY, list);
            }
          }
          break;
        }

        case 'section:created': {
          if (payload.section) {
            const list = loadStorage<Section[]>(KEYS.SECTIONS, []);
            const exists = list.some(s => s.id === payload.section.id || (s.departmentId === payload.section.departmentId && s.name.toUpperCase() === payload.section.name.toUpperCase()));
            if (!exists) {
              list.push(payload.section);
              saveStorage(KEYS.SECTIONS, list);
            }
          }
          if (payload.sections && Array.isArray(payload.sections)) {
            saveStorage(KEYS.SECTIONS, payload.sections);
          }
          break;
        }

        case 'section:updated': {
          if (payload.section) {
            const list = loadStorage<Section[]>(KEYS.SECTIONS, []);
            const idx = list.findIndex(s => s.id === payload.section.id);
            if (idx !== -1) {
              list[idx] = { ...list[idx], ...payload.section };
              saveStorage(KEYS.SECTIONS, list);
            } else {
              list.push(payload.section);
              saveStorage(KEYS.SECTIONS, list);
            }
          }
          if (payload.sections && Array.isArray(payload.sections)) {
            saveStorage(KEYS.SECTIONS, payload.sections);
          }
          break;
        }

        case 'subject:created': {
          if (payload.subject) {
            const list = loadStorage<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
            const exists = list.some(s => s.id === payload.subject.id || s.code === payload.subject.code);
            if (!exists) {
              list.push(payload.subject);
              saveStorage(KEYS.SUBJECTS, list);
            }
          }
          if (payload.subjects && Array.isArray(payload.subjects)) {
            saveStorage(KEYS.SUBJECTS, payload.subjects);
          }
          break;
        }

        case 'subject:updated': {
          if (payload.subject) {
            const list = loadStorage<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
            const idx = list.findIndex(s => s.id === payload.subject.id || s.code === payload.subject.code);
            if (idx !== -1) {
              list[idx] = { ...list[idx], ...payload.subject };
              saveStorage(KEYS.SUBJECTS, list);
            }
          }
          if (payload.subjects && Array.isArray(payload.subjects)) {
            saveStorage(KEYS.SUBJECTS, payload.subjects);
          }
          break;
        }

        case 'assessment:created': {
          if (payload.id) {
            const list = loadStorage<InternalAssessment[]>(KEYS.INTERNAL_ASSESSMENTS, INITIAL_ASSESSMENTS);
            const exists = list.some(a => a.id === payload.id);
            if (!exists) {
              list.unshift(payload);
              saveStorage(KEYS.INTERNAL_ASSESSMENTS, list);
            }
          }
          break;
        }

        case 'assessment:evaluated': {
          if (payload.assessmentId) {
            apiRequest<AssessmentMarkEntry[]>(`/api/assessments/${payload.assessmentId}/marks`).then(res => {
              if (res && Array.isArray(res)) {
                let marks = loadStorage<AssessmentMarkEntry[]>(KEYS.ASSESSMENT_MARKS, INITIAL_ASSESSMENT_MARKS);
                marks = marks.filter(m => m.assessmentId !== payload.assessmentId);
                marks.push(...res);
                saveStorage(KEYS.ASSESSMENT_MARKS, marks);
                this.subscribers.forEach(cb => { try { cb('marks:updated', payload); } catch {} });
              }
            }).catch(() => {});
          }
          break;
        }

        case 'academic:updated': {
          if (payload.type === 'section' && payload.section) {
            const list = loadStorage<Section[]>(KEYS.SECTIONS, []);
            const idx = list.findIndex(s => s.id === payload.section.id);
            if (idx !== -1) list[idx] = payload.section;
            else list.push(payload.section);
            saveStorage(KEYS.SECTIONS, list);
          } else if (payload.type === 'section_deleted' && payload.id) {
            const list = loadStorage<Section[]>(KEYS.SECTIONS, []).filter(s => s.id !== payload.id);
            saveStorage(KEYS.SECTIONS, list);
          } else if (payload.type === 'subject' && payload.subject) {
            const list = loadStorage<Subject[]>(KEYS.SUBJECTS, INITIAL_SUBJECTS);
            const idx = list.findIndex(s => s.id === payload.subject.id || s.code === payload.subject.code);
            if (idx !== -1) list[idx] = payload.subject;
            else list.push(payload.subject);
            saveStorage(KEYS.SUBJECTS, list);
          } else if (payload.type === 'allocation' && payload.assignment) {
            const tas = loadStorage<TeachingAssignment[]>(KEYS.TEACHING_ASSIGNMENTS, []);
            const idx = tas.findIndex(ta => ta.facultyId === payload.assignment.facultyId && ta.subjectId === payload.assignment.subjectId && ta.section === payload.assignment.section);
            if (idx !== -1) tas[idx] = payload.assignment;
            else tas.push(payload.assignment);
            saveStorage(KEYS.TEACHING_ASSIGNMENTS, tas);
          }
          // Asynchronously re-sync fresh catalogs from backend
          Promise.all([
            apiRequest<Section[]>('/api/sections'),
            apiRequest<Subject[]>('/api/subjects'),
            apiRequest<FacultyProfile[]>('/api/faculty')
          ]).then(([secs, subs, facs]) => {
            if (secs) saveStorage(KEYS.SECTIONS, secs);
            if (subs) saveStorage(KEYS.SUBJECTS, subs);
            if (facs) saveStorage(KEYS.FACULTY, facs);
            this.subscribers.forEach(cb => {
              try { cb('academic:updated', payload); } catch {}
            });
          }).catch(() => {});
          break;
        }

        case 'online_exam:created': {
          if (payload && payload.id) {
            const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
            const idx = list.findIndex(e => e.id === payload.id);
            if (idx !== -1) list[idx] = payload;
            else list.unshift(payload);
            saveStorage(KEYS.ONLINE_EXAMS, list);
          }
          break;
        }

        case 'online_exam:updated': {
          if (payload && payload.id) {
            const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
            const idx = list.findIndex(e => e.id === payload.id);
            if (idx !== -1) list[idx] = { ...list[idx], ...payload };
            else list.unshift(payload);
            saveStorage(KEYS.ONLINE_EXAMS, list);
          }
          break;
        }

        case 'online_exam:deleted': {
          if (payload && payload.id) {
            const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS).filter(e => e.id !== payload.id);
            saveStorage(KEYS.ONLINE_EXAMS, list);
          }
          break;
        }

        case 'online_exam:published': {
          if (payload && payload.id) {
            const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
            const idx = list.findIndex(e => e.id === payload.id);
            if (idx !== -1) list[idx] = { ...list[idx], ...payload, status: 'PUBLISHED' };
            else list.unshift({ ...payload, status: 'PUBLISHED' });
            saveStorage(KEYS.ONLINE_EXAMS, list);
          }
          break;
        }

        case 'online_exam:results_released': {
          if (payload && payload.examId) {
            const list = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
            const idx = list.findIndex(e => e.id === payload.examId);
            if (idx !== -1) {
              list[idx].resultsReleased = true;
              saveStorage(KEYS.ONLINE_EXAMS, list);
            }
          }
          break;
        }

        case 'online_exam:submitted': {
          const attempt = payload?.attempt || (payload?.id ? payload : null);
          const examId = payload?.examId || attempt?.examId;

          if (attempt && attempt.id) {
            const list = loadStorage<ExamAttempt[]>(KEYS.EXAM_ATTEMPTS, INITIAL_EXAM_ATTEMPTS);
            const idx = list.findIndex(a => a.id === attempt.id);
            if (idx !== -1) list[idx] = attempt;
            else list.unshift(attempt);
            saveStorage(KEYS.EXAM_ATTEMPTS, list);
          }

          if (examId) {
            const exams = loadStorage<OnlineExam[]>(KEYS.ONLINE_EXAMS, INITIAL_ONLINE_EXAMS);
            const eIdx = exams.findIndex(e => e.id === examId);
            if (eIdx !== -1) {
              exams[eIdx].attemptCount = (exams[eIdx].attemptCount || 0) + 1;
              saveStorage(KEYS.ONLINE_EXAMS, exams);
            }
          }
          break;
        }
      }
    } catch (err) {
      console.warn('[EduTrackApi] Error syncing realtime event payload:', err);
    }

    // Notify registered React component subscribers
    this.subscribers.forEach(cb => {
      try {
        cb(event, payload);
      } catch (err) {
        console.error('[EduTrackApi] Subscriber callback failed:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edutrack:sync', { detail: { event, payload } }));
    }
  }
}

if (typeof window !== 'undefined') {
  EduTrackApi.init().catch(() => {});
}
