import React, { useState } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { EduTrackApi } from '../../services/apiService';
import { User, UserRole } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBackToLanding: () => void;
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
  initialRole = 'admin'
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setError(null);
    // Keep identifier and password clean when switching roles
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your institutional email, register number, or employee ID.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await EduTrackApi.loginAsync(identifier, password, activeRole);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid credentials or unprovisioned account. Contact your university administrator.');
      }
    } catch {
      setIsLoading(false);
      setError('Connection failure. Please verify network access or try again.');
    }
  };

  // Role-specific labels, placeholders, and descriptions matching institutional specs
  const roleConfig = {
    admin: {
      tabLabel: 'Admin Login',
      inputLabel: 'Administrator Email',
      inputPlaceholder: 'admin@edutrack.edu',
      inputIcon: Mail,
      buttonText: 'Access Admin Portal',
      infoTitle: 'System Administrator Portal Access',
      infoDesc: 'Manages college hierarchy, department sections, subjects, faculty teaching assignments, student enrollment, and institutional audit logs.'
    },
    faculty: {
      tabLabel: 'Faculty Login',
      inputLabel: 'Faculty Email or Employee ID',
      inputPlaceholder: 'faculty@edutrack.edu or EMP-101',
      inputIcon: UserIcon,
      buttonText: 'Access Faculty Portal',
      infoTitle: 'Faculty Portal Access',
      infoDesc: 'Record section attendance, publish syllabus study materials, submit continuous internal assessment marks, and manage course submissions.'
    },
    student: {
      tabLabel: 'Student Login',
      inputLabel: 'Student Register Number / Email',
      inputPlaceholder: '990000001 or student@edutrack.edu',
      inputIcon: UserIcon,
      buttonText: 'Access Student Portal',
      infoTitle: 'Student Portal Access',
      infoDesc: 'View enrolled semester subjects, monitor real-time class attendance, access course assignments, exam timetables, and semester grades.'
    }
  }[activeRole];

  const InputIcon = roleConfig.inputIcon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-8 sm:py-14 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      
      {/* Return Navigation */}
      <div className="w-full max-w-md mx-auto mb-4 text-center">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1.5 px-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to University Overview</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight">
            Edu Track Institutional Login
          </h1>
          <p className="mt-1.5 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Secure role-based authentication for University Administration, Faculty, and Students
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 py-6 sm:py-8 px-5 sm:px-8 shadow-xl shadow-slate-200/60 dark:shadow-none rounded-3xl border border-slate-200/80 dark:border-slate-800">
          
          {/* Role Segmented Tabs Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex gap-1 mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 py-2 sm:py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all text-center ${
                activeRole === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('faculty')}
              className={`flex-1 py-2 sm:py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all text-center ${
                activeRole === 'faculty'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Faculty Login
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`flex-1 py-2 sm:py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all text-center ${
                activeRole === 'student'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Student Login
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Primary Identifier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {roleConfig.inputLabel}
              </label>
              <div className="relative">
                <InputIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={activeRole === 'admin' ? 'email' : 'text'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleConfig.inputPlaceholder}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium min-h-[44px] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono min-h-[44px] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 min-h-[46px] cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating Identity...</span>
                  </>
                ) : (
                  <span>{roleConfig.buttonText}</span>
                )}
              </button>
            </div>

            {/* Google OAuth Button - Admin Only */}
            {activeRole === 'admin' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.location.href = `${window.location.origin}/api/auth/google`}
                  className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 min-h-[46px] cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </form>

          {/* Institutional Role Information Box (Replaces Initial Setup Credentials) */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-left">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] mb-1">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{roleConfig.infoTitle}</span>
            </div>
            <p className="text-[11px] sm:text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {roleConfig.infoDesc}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
