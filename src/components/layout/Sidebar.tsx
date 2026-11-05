import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Calendar,
  Bell,
  CalendarCheck,
  UserCheck,
  FileSpreadsheet,
  LineChart,
  Users,
  Building2,
  CalendarClock,
  Megaphone,
  TrendingUp,
  GraduationCap,
  ChevronRight,
  LogOut,
  X,
  Menu,
  MoreHorizontal
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  role: UserRole;
  currentPage: string;
  onNavigate: (pageId: string) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentPage,
  onNavigate,
  onLogout,
  mobileOpen = false,
  onCloseMobile
}) => {
  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Strict role-specific navigation matching prompt requirements
  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses-attendance', label: 'Courses & Attendance', icon: BookOpen },
    { id: 'results-assignments', label: 'Results & Assignments', icon: Award },
    { id: 'timetable-materials', label: 'Timetable & Study Materials', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const facultyNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'enrolled-students', label: 'Enrolled Students', icon: Users },
    { id: 'faculty-timetable', label: 'Faculty Timetable & Subjects', icon: CalendarCheck },
    { id: 'attendance-materials', label: 'Attendance & Materials', icon: UserCheck },
    { id: 'assignments-exams-marks', label: 'Assignments, Exams & Marks', icon: FileSpreadsheet },
    { id: 'student-analytics', label: 'Student Analytics & Weak Concepts', icon: LineChart },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manage-users', label: 'Manage Students & Faculty', icon: Users },
    { id: 'departments-subjects', label: 'Departments & Subjects', icon: Building2 },
    { id: 'class-timetable', label: 'Class Timetable', icon: Calendar },
    { id: 'exam-timetable', label: 'Semester Exam Timetable', icon: CalendarClock },
    { id: 'announcements', label: 'Announcements', icon: Megaphone }
  ];

  const navItems = role === 'student' ? studentNav : role === 'faculty' ? facultyNav : adminNav;

  const handleItemClick = (pageId: string) => {
    onNavigate(pageId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const NavContent = (
    <>
      {/* Top Branding */}
      <div>
        <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
                Edu Track
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Academic Management
              </p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Authenticated Role Portal Indicator */}
        <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">Authenticated Portal</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
              {role} Workspace
            </p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 lg:py-2.5 rounded-lg text-xs font-medium transition-all group min-h-[44px] lg:min-h-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200/50 dark:shadow-none font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 pb-safe">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 lg:py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors min-h-[44px] lg:min-h-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit / Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar: EXACT original width and layout, visible on lg (>=1024px) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-col justify-between transition-all duration-300">
        {NavContent}
      </aside>

      {/* 2. Mobile/Tablet Slide-in Drawer: Visible when mobileOpen is true */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dimmed backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col justify-between shadow-2xl z-10 transform transition-transform duration-300 ease-out animate-in slide-in-from-left">
            {NavContent}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Mobile Bottom Navigation Bar (< 1024px)
 * Provides 1-tap thumb navigation for core tasks with safe-area spacing
 */
interface MobileBottomNavProps {
  role: UserRole;
  currentPage: string;
  onNavigate: (pageId: string) => void;
  onToggleDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  role,
  currentPage,
  onNavigate,
  onToggleDrawer
}) => {
  let primaryItems: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [];

  if (role === 'student') {
    primaryItems = [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'courses-attendance', label: 'Courses', icon: BookOpen },
      { id: 'results-assignments', label: 'Results', icon: Award },
      { id: 'timetable-materials', label: 'Timetable', icon: Calendar }
    ];
  } else if (role === 'faculty') {
    primaryItems = [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'enrolled-students', label: 'Students', icon: Users },
      { id: 'attendance-materials', label: 'Attendance', icon: UserCheck },
      { id: 'assignments-exams-marks', label: 'Grading', icon: FileSpreadsheet }
    ];
  } else {
    primaryItems = [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'manage-users', label: 'Users', icon: Users },
      { id: 'departments-subjects', label: 'Curriculum', icon: Building2 },
      { id: 'class-timetable', label: 'Schedule', icon: Calendar }
    ];
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}

        {/* More / Menu button that opens full drawer */}
        <button
          onClick={onToggleDrawer}
          className="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          aria-label="Open full menu"
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
};
