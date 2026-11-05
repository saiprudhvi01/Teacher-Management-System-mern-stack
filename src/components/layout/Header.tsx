import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  ExternalLink,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import { User, Announcement } from '../../types';
import { EduTrackApi } from '../../services/apiService';
import { useRealtimeConnectionStatus } from '../../services/socketService';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  onToggleMobileNav
}) => {
  const isSocketConnected = useRealtimeConnectionStatus();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Audience filtered announcements
  const audience = currentUser.role === 'student' ? 'STUDENTS' : currentUser.role === 'faculty' ? 'FACULTY' : undefined;
  const announcements: Announcement[] = EduTrackApi.getAnnouncements(audience);
  const readIds = EduTrackApi.getReadNotificationIds();
  const unreadCount = announcements.filter(a => !readIds.includes(a.id)).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    EduTrackApi.markAllNotificationsRead(announcements.map(a => a.id));
    setShowNotifications(false);
  };

  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'student':
        return <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'faculty':
        return <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 max-w-full">
        
        {/* Left Zone: Hamburger (Mobile) + Brand Logo (Mobile) + Desktop Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          
          {/* Hamburger Menu Button (Mobile & Tablet < 1024px) */}
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile/Tablet Brand Logo (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base inline truncate">
              Edu Track
            </span>
          </div>

          {/* Desktop Search Bar (>= 640px) */}
          <div className="hidden sm:block flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={`Search ${currentUser.role === 'student' ? 'courses, grades, materials...' : currentUser.role === 'faculty' ? 'students, subjects, marks...' : 'students, faculty, departments...'}`}
                className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right Zone: Actions & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Mobile Search Toggle Button (< 640px) */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="sm:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Real-Time Sync Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none">
            {isSocketConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden md:inline">Real-Time Sync</span>
                <span className="md:hidden">Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Connecting...</span>
              </span>
            )}
          </div>

          {/* MongoDB Persistence Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300" title="All administrative, faculty, and student updates are continuously persisted to MongoDB collections">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>MongoDB Active</span>
          </div>

          {/* System Database Reset Button */}
          <button
            onClick={() => {
              if (confirm('Reset institutional database to completely empty state? All created records will be wiped.')) {
                EduTrackApi.resetToEmpty();
              }
            }}
            title="Reset to clean empty database"
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Academic notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                      {currentUser.role === 'student' ? 'Student Announcements' : currentUser.role === 'faculty' ? 'Faculty Bulletins' : 'Institution Notices'}
                    </span>
                    <span className="text-xs text-slate-500">({announcements.length})</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:border-slate-800">
                  {announcements.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No announcements for your role right now.
                    </div>
                  ) : (
                    announcements.map(ann => {
                      const isRead = readIds.includes(ann.id);
                      return (
                        <div
                          key={ann.id}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                              {ann.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {ann.priority === 'urgent' ? 'Urgent' : 'Normal'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {ann.message}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span>{ann.publishedAt}</span>
                            <button
                              onClick={() => {
                                EduTrackApi.markNotificationRead(ann.id);
                                setShowNotifications(false);
                                onNavigate('notifications');
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              View details
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('notifications');
                    }}
                    className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                  >
                    Open Notifications Center
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 sm:mx-1" />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
              aria-label="User profile menu"
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 capitalize">
                  {getRoleIcon()}
                  <span>{currentUser.role} Portal</span>
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 py-1">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Role: {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors min-h-[44px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Expandable Mobile Search Bar (< 640px) */}
      {showMobileSearch && (
        <div className="sm:hidden px-3 py-2 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 animate-in slide-in-from-top-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search subjects, timetable, circulars..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => {
                setShowMobileSearch(false);
                onSearchChange('');
              }}
              className="absolute right-2 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
