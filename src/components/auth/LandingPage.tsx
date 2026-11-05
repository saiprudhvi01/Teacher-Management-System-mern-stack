import React from 'react';
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card3D } from '../common/Card3D';
import { AcademicGeometric3D } from '../common/AcademicGeometric3D';

interface LandingPageProps {
  onGoToLogin: (role?: 'admin' | 'faculty' | 'student') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* Top Bar following 3-Zone Contract */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-40">
        {/* Zone 1: Brand title, one line wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Edu Track
          </span>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <a href="#roles" className="hover:text-indigo-600 dark:hover:text-white transition-colors whitespace-nowrap">
            Role Architecture
          </a>
          <a href="#governance" className="hover:text-indigo-600 dark:hover:text-white transition-colors whitespace-nowrap">
            Academic Governance
          </a>
          <a href="#compliance" className="hover:text-indigo-600 dark:hover:text-white transition-colors whitespace-nowrap">
            Accreditation & Standards
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onGoToLogin('admin')}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[40px]"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 lg:px-12 py-10 sm:py-16 lg:py-24 max-w-7xl mx-auto overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              
              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-900/60">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Next-Generation Academic Operations</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]" style={{ textWrap: 'balance' }}>
                Edu Track – Student Academic Management System
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                A unified, role-governed university operating environment for Students, Teaching Faculty, and Institutional Administrators. Clean, dynamic architecture with persistent academic records, conflict validation, and live attendance tracking.
              </p>

              {/* Portal Sign-in CTA */}
              <div className="pt-2 flex flex-wrap gap-3 items-center">
                <button
                  onClick={() => onGoToLogin('admin')}
                  className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter University Portal Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Right Visual Column with Campus Hero & 3D Interactive Canvas */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900">
                <img
                  src="/src/assets/images/edu_campus_hero_1791517492906.jpg"
                  alt="University Academic Research Center"
                  referrerPolicy="no-referrer"
                  className="w-full h-64 sm:h-80 lg:h-96 object-cover opacity-85 hover:opacity-95 transition-opacity"
                />

                {/* Overlay 3D geometric node canvas */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <AcademicGeometric3D />
                </div>

                <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent text-white">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
                    <img
                      src="/src/assets/images/edu_institution_seal_1791517510992.jpg"
                      alt="University Crest"
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full bg-white p-0.5 object-cover"
                    />
                    <span>Autonomous University of Engineering</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Role-Governed Academic Administration
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 3 Role Architecture Bento Grid */}
          <div id="roles" className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Three Role-Based Workspaces
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Permissions and visibility are determined by authenticated accounts in the database.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Student Portal Card */}
              <Card3D
                onClick={() => onGoToLogin('student')}
                className="p-6 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Student Portal
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Real-time course attendance, shortage calculations, semester results, calculated SGPA/CGPA, assignment submissions, class timetable, and student circulars.
                </p>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Sign In as Student</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card3D>

              {/* Faculty Portal Card */}
              <Card3D
                onClick={() => onGoToLogin('faculty')}
                className="p-6 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Faculty Portal
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Assigned teaching subjects, live session attendance marking with audit logs, course materials upload, assignment grading, internal assessments, and weak concept detection.
                </p>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Sign In as Faculty</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card3D>

              {/* Admin Portal Card */}
              <Card3D
                onClick={() => onGoToLogin('admin')}
                className="p-6 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Admin Portal
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Total student & faculty management, department and subject catalogs, conflict-free class timetable scheduling, exam schedule publishing, announcements, and institution analytics.
                </p>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Sign In as Admin</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card3D>

            </div>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Edu Track</span>
            <span>·</span>
            <span>Student Academic Management System</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Academic Session 2026–2027</span>
            <span>·</span>
            <span>Persistent Database & RBAC</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
