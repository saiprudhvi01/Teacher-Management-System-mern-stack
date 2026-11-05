import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { EduTrackApi } from './services/apiService';
import { socketService } from './services/socketService';
import { LandingPage } from './components/auth/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Sidebar, MobileBottomNav } from './components/layout/Sidebar';
import { StudentPortal } from './components/student/StudentPortal';
import { FacultyPortal } from './components/faculty/FacultyPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { Radio, CheckCircle, Info, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(EduTrackApi.getActiveUser());
  const [view, setView] = useState<'landing' | 'login' | 'portal'>(
    EduTrackApi.getActiveUser() ? 'portal' : 'landing'
  );
  const [loginRole, setLoginRole] = useState<UserRole>('admin');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [liveToast, setLiveToast] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'alert' } | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check authentication on app load (for OAuth redirect)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            localStorage.setItem('edutrack_jwt_token', data.token || '');
            localStorage.setItem('edutrack_fullstack_v1_current_user_id', data.user.id);
            setCurrentUser(data.user);
            setView('portal');
            setCurrentPage('dashboard');
          }
        }
      } catch (e) {
        // Not authenticated or error, stay on landing
      }
    };
    
    // Only check if we don't already have a user from localStorage
    if (!EduTrackApi.getActiveUser()) {
      checkAuth();
    }
  }, []);

  // Register client socket context whenever user logs in or switches
  useEffect(() => {
    if (!currentUser) {
      socketService.disconnect();
      return;
    }

    const profile = currentUser.role === 'student' ? EduTrackApi.getStudentProfile(currentUser.id) : null;
    const facProfile = currentUser.role === 'faculty' ? EduTrackApi.getFacultyProfile(currentUser.id) : null;

    socketService.registerUser({
      userId: currentUser.id,
      role: currentUser.role,
      studentId: profile?.id,
      facultyId: facProfile?.id,
      departmentId: profile?.departmentId || facProfile?.departmentId,
      semester: profile?.currentSemester,
      section: profile?.section || 'A'
    });
  }, [currentUser]);

  // Real-time synchronization event listeners
  useEffect(() => {
    const handleEvent = (event: string, payload: any) => {
      EduTrackApi.handleRealtimeSync(event, payload);

      let title = 'Real-Time Sync';
      let message = '';
      let type: 'info' | 'success' | 'alert' = 'info';

      switch (event) {
        case 'marks:updated':
          title = 'Marks Published';
          message = payload.subjectCode ? `${payload.subjectCode}: Score recorded (${payload.marksObtained}/${payload.maxMarks})` : 'New assessment marks updated';
          type = 'success';
          break;
        case 'attendance:updated':
          title = 'Attendance Updated';
          message = payload.overallAttendance !== undefined ? `Overall attendance is now ${payload.overallAttendance}%` : 'Class session attendance recorded';
          type = 'info';
          break;
        case 'assignment:created':
          title = 'New Assignment';
          message = `${payload.subjectCode || 'Course'}: "${payload.title}" (Due: ${payload.dueDate})`;
          type = 'info';
          break;
        case 'assignment:updated':
          title = 'Assignment Updated';
          message = `"${payload.title}" details or deadline updated (Due: ${payload.dueDate})`;
          type = 'info';
          break;
        case 'submission:created':
          title = 'Assignment Submitted';
          message = `${payload.studentName || 'Student'} submitted "${payload.assignmentTitle || 'Work'}"`;
          type = 'success';
          break;
        case 'submission:evaluated':
          title = 'Assignment Evaluated';
          message = `"${payload.assignmentTitle}": Awarded ${payload.marksAwarded}/${payload.maxMarks} marks`;
          type = 'success';
          break;
        case 'material:created':
          title = 'New Study Material';
          message = `${payload.subjectCode}: "${payload.title}" is now available`;
          type = 'info';
          break;
        case 'material:deleted':
          title = 'Resource Removed';
          message = `Study resource "${payload.title}" was removed`;
          type = 'info';
          break;
        case 'timetable:updated':
          title = 'Timetable Updated';
          message = payload.entry ? `${payload.entry.subjectCode} scheduled on ${payload.entry.dayOfWeek} (${payload.entry.startTime}-${payload.entry.endTime})` : 'Timetable schedule modified';
          type = 'info';
          break;
        case 'exam_timetable:updated':
          title = 'Exam Schedule';
          message = `${payload.subjectCode || 'Exam'} on ${payload.examDate} (${payload.startTime}-${payload.endTime}) at Hall ${payload.room}`;
          type = 'alert';
          break;
        case 'announcement:published':
          title = 'New Circular / Notice';
          message = payload.title;
          type = 'alert';
          break;
        case 'student:created':
          title = 'Student Enrolled';
          message = payload.student ? `${payload.student.rollNumber} enrolled in ${payload.student.section}` : 'New student registered';
          type = 'success';
          break;
        case 'faculty:created':
          title = 'Faculty Registered';
          message = payload.user ? `${payload.user.name} joined as faculty` : 'New faculty member registered';
          type = 'success';
          break;
        case 'section:created':
          title = 'New Section Created';
          message = payload.section ? `Section ${payload.section.name} (Capacity: ${payload.section.capacity}) configured` : 'New academic section created';
          type = 'info';
          break;
        case 'subject:created':
          title = 'New Subject Added';
          message = payload.subject ? `${payload.subject.code}: ${payload.subject.name} added to curriculum` : 'New curriculum course added';
          type = 'info';
          break;
        case 'assessment:created':
          title = 'Internal Assessment Scheduled';
          message = payload.title ? `${payload.subjectCode}: "${payload.title}" (${payload.type}, ${payload.maxMarks} marks) announced` : 'New internal assessment scheduled';
          type = 'alert';
          break;
        case 'academic:updated':
          if (payload.type === 'allocation') {
            title = 'Faculty Allocated';
            message = 'Teaching assignment updated for course section';
            type = 'info';
          }
          break;
        case 'online_exam:created':
          title = 'Online Exam Saved';
          message = `Exam "${payload.title}" created as ${payload.status || 'Draft'}`;
          type = 'info';
          break;
        case 'online_exam:published':
          title = 'Online Examination Live!';
          message = `${payload.subjectCode}: "${payload.title}" is published (${payload.totalMarks} Marks, ${payload.durationMinutes} Mins)`;
          type = 'alert';
          break;
        case 'online_exam:submitted':
          title = 'Exam Attempt Submitted';
          message = `${payload.studentName || 'Student'} completed ${payload.examTitle || 'examination'}`;
          type = 'success';
          break;
        case 'online_exam:results_released':
          title = 'Exam Results Published';
          message = `Official results have been released for examination`;
          type = 'success';
          break;
      }

      if (message) {
        const toastId = String(Date.now());
        setLiveToast({ id: toastId, title, message, type });
        setTimeout(() => {
          setLiveToast((current) => (current?.id === toastId ? null : current));
        }, 5000);
      }
    };

    const unsubscribers = [
      socketService.on('marks:updated', (data) => handleEvent('marks:updated', data)),
      socketService.on('attendance:updated', (data) => handleEvent('attendance:updated', data)),
      socketService.on('attendance:session_recorded', (data) => handleEvent('attendance:session_recorded', data)),
      socketService.on('assignment:created', (data) => handleEvent('assignment:created', data)),
      socketService.on('assignment:updated', (data) => handleEvent('assignment:updated', data)),
      socketService.on('submission:created', (data) => handleEvent('submission:created', data)),
      socketService.on('submission:evaluated', (data) => handleEvent('submission:evaluated', data)),
      socketService.on('material:created', (data) => handleEvent('material:created', data)),
      socketService.on('material:deleted', (data) => handleEvent('material:deleted', data)),
      socketService.on('timetable:updated', (data) => handleEvent('timetable:updated', data)),
      socketService.on('exam_timetable:updated', (data) => handleEvent('exam_timetable:updated', data)),
      socketService.on('announcement:published', (data) => handleEvent('announcement:published', data)),
      socketService.on('announcement:deleted', (data) => handleEvent('announcement:deleted', data)),
      socketService.on('student:created', (data) => handleEvent('student:created', data)),
      socketService.on('student:updated', (data) => handleEvent('student:updated', data)),
      socketService.on('faculty:created', (data) => handleEvent('faculty:created', data)),
      socketService.on('faculty:updated', (data) => handleEvent('faculty:updated', data)),
      socketService.on('section:created', (data) => handleEvent('section:created', data)),
      socketService.on('section:updated', (data) => handleEvent('section:updated', data)),
      socketService.on('subject:created', (data) => handleEvent('subject:created', data)),
      socketService.on('subject:updated', (data) => handleEvent('subject:updated', data)),
      socketService.on('assessment:created', (data) => handleEvent('assessment:created', data)),
      socketService.on('assessment:evaluated', (data) => handleEvent('assessment:evaluated', data)),
      socketService.on('academic:updated', (data) => handleEvent('academic:updated', data)),
      socketService.on('online_exam:created', (data) => handleEvent('online_exam:created', data)),
      socketService.on('online_exam:updated', (data) => handleEvent('online_exam:updated', data)),
      socketService.on('online_exam:deleted', (data) => handleEvent('online_exam:deleted', data)),
      socketService.on('online_exam:published', (data) => handleEvent('online_exam:published', data)),
      socketService.on('online_exam:submitted', (data) => handleEvent('online_exam:submitted', data)),
      socketService.on('online_exam:results_released', (data) => handleEvent('online_exam:results_released', data))
    ];

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setView('portal');
    setCurrentPage('dashboard');
    setMobileNavOpen(false);
  };

  const handleLogout = () => {
    EduTrackApi.logout();
    setCurrentUser(null);
    setView('landing');
    setCurrentPage('dashboard');
    setMobileNavOpen(false);
  };

  // If in landing or login view
  if (view === 'landing' || !currentUser) {
    if (view === 'login') {
      return (
        <div className={darkMode ? 'dark' : ''}>
          <LoginPage
            initialRole={loginRole}
            onLoginSuccess={handleLoginSuccess}
            onBackToLanding={() => setView('landing')}
          />
        </div>
      );
    }

    return (
      <div className={darkMode ? 'dark' : ''}>
        <LandingPage
          onGoToLogin={(role) => {
            if (role) setLoginRole(role);
            setView('login');
          }}
        />
      </div>
    );
  }

  // Logged-in Portal Shell: Role is determined strictly by authenticated user account
  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors ${darkMode ? 'dark text-slate-100' : 'text-slate-900'}`}>
      
      {/* Persistent Desktop Sidebar (lg) & Mobile Slide-in Drawer (<lg) */}
      <Sidebar
        role={currentUser.role}
        currentPage={currentPage}
        onNavigate={(pageId) => {
          setCurrentPage(pageId);
          setMobileNavOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen">
        
        {/* Responsive Header */}
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={(page) => {
            setCurrentPage(page);
            setMobileNavOpen(false);
          }}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
        />

        {/* Dynamic Role Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 lg:pb-8">
          {currentUser.role === 'student' && (
            <StudentPortal
              currentUser={currentUser}
              currentPage={currentPage}
              onNavigate={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              searchQuery={searchQuery}
            />
          )}

          {currentUser.role === 'faculty' && (
            <FacultyPortal
              currentUser={currentUser}
              currentPage={currentPage}
              onNavigate={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              searchQuery={searchQuery}
            />
          )}

          {currentUser.role === 'admin' && (
            <AdminPortal
              currentUser={currentUser}
              currentPage={currentPage}
              onNavigate={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              searchQuery={searchQuery}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (< 1024px) */}
        <MobileBottomNav
          role={currentUser.role}
          currentPage={currentPage}
          onNavigate={(page) => {
            setCurrentPage(page);
            setMobileNavOpen(false);
          }}
          onToggleDrawer={() => setMobileNavOpen(true)}
        />

      </div>

      {/* Real-Time Live Sync Notification Banner */}
      {liveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100%-3rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3.5 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-4"
        >
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            liveToast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : liveToast.type === 'alert'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
          }`}>
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                liveToast.type === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : liveToast.type === 'alert'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}>
                {liveToast.title}
              </span>
              <button
                onClick={() => setLiveToast(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5 leading-snug">
              {liveToast.message}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
