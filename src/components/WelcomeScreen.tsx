import React, { useState } from 'react';
import {
  Dna,
  Microscope,
  Leaf,
  FlaskConical,
  Mail,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Check,
} from 'lucide-react';
import { loginWithEmail, loginWithGoogle, registerWithEmail, resetStudentPassword } from '../firebase/authService';
import { AVATAR_PRESETS, DEPARTMENTS, LEVELS } from '../constants/spaces';
import { OFFICIAL_APP_ICON } from '../constants/appIcon';

interface WelcomeScreenProps {
  onSuccess?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('Microbiology');
  const [level, setLevel] = useState('200 Level');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [authErrorType, setAuthErrorType] = useState<'email-in-use' | 'invalid-credential' | 'other' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAuthErrorType(null);
    setResetSent(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      setAuthErrorType('other');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(cleanEmail, password);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthErrorType('invalid-credential');
        setErrorMessage('Invalid email or password. If you haven’t registered this student account yet, you can register below.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthErrorType('other');
        setErrorMessage('Please enter a valid email address.');
      } else {
        setAuthErrorType('other');
        setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAuthErrorType(null);
    setResetSent(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!displayName.trim()) {
      setErrorMessage('Please provide your full student name.');
      setAuthErrorType('other');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      setAuthErrorType('other');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      setAuthErrorType('other');
      return;
    }

    setLoading(true);
    try {
      const photoURL = customAvatarUrl.trim() || selectedAvatar;
      await registerWithEmail(cleanEmail, password, {
        displayName: displayName.trim(),
        department,
        level,
        photoURL,
        bio: bio.trim() || `NABIOSOS ${department} student`,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthErrorType('email-in-use');
        setErrorMessage('An account with this email already exists. Switch to Sign In to log into your account.');
      } else {
        setAuthErrorType('other');
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address to receive password reset instructions.');
      return;
    }
    setResetLoading(true);
    setErrorMessage(null);
    try {
      await resetStudentPassword(cleanEmail);
      setResetSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage('Could not send password reset email. Please ensure your email is correct.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setAuthErrorType(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setAuthErrorType('other');
      setErrorMessage(err.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  // Demo student fast login that NEVER fails
  const handleQuickDemo = async (deptName: string, studentName: string, studentLevel: string) => {
    setErrorMessage(null);
    setAuthErrorType(null);
    setLoading(true);
    const deptKey = deptName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultEmail = `${deptKey}.demo@nabiosos.org`;
    const demoPass = 'Nabiosos2026!';

    try {
      await loginWithEmail(defaultEmail, demoPass);
    } catch {
      // If default demo login failed (e.g. wrong password or account not found), create a unique session student
      const sessionEmail = `${deptKey}.student_${Math.random().toString(36).substring(2, 7)}@nabiosos.org`;
      try {
        await registerWithEmail(sessionEmail, demoPass, {
          displayName: studentName,
          department: deptName,
          level: studentLevel,
          photoURL: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
          bio: `${deptName} scholar and active member of NABIOSOS`,
        });
      } catch (regErr: any) {
        console.error('Demo register error:', regErr);
        setErrorMessage('Unable to initialize demo account. Please use standard email registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Banner & Header */}
      <header className="border-b border-emerald-900/40 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={OFFICIAL_APP_ICON}
              alt="NABIOSOS Official Icon"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40 bg-slate-900"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-emerald-400 text-lg sm:text-xl">
                  NABIOSOS
                </span>
                <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                  HUB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Federal University Wukari • Biological Sciences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Live Student Network</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Hero Welcome */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Federal University Wukari • Faculty of Pure & Applied Sciences</span>
          </div>

          <div className="flex items-start gap-4">
            <img
              src={OFFICIAL_APP_ICON}
              alt="NABIOSOS Emblem"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl shadow-emerald-900/30 ring-2 ring-emerald-500/40 bg-slate-900 shrink-0"
            />
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-white leading-none">
                WELCOME TO{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  NABIOSOS
                </span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm font-semibold text-emerald-300/90 uppercase tracking-wider">
                National Association of Biological Sciences Students
              </p>
            </div>
          </div>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Connect in real-time across <strong className="text-emerald-400">Microbiology</strong>,{' '}
            <strong className="text-teal-400">Biochemistry</strong>,{' '}
            <strong className="text-green-400">Biological Sciences</strong>, and{' '}
            <strong className="text-cyan-400">Molecular Biology</strong> from 100 to 400 Level.
            Exchange study notes, discuss practicals, trade in the student market, and catch up on sports banter.
          </p>

          {/* Quick Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <Microscope className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100L – 400L Class Spaces</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Safe 1-on-1 Direct Chat</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <Leaf className="w-4 h-4 text-green-400 shrink-0" />
              <span>Market & Sport Updates</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Instant Friend Requests</span>
            </div>
          </div>

          {/* Quick Test Drive / Demo Pills */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-900/30">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              ⚡ Fast 1-Click Student Test Accounts:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo('Microbiology', 'Amina Yusuf (MCB)', '300 Level')}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/40 transition flex items-center gap-1.5"
              >
                <span>🔬 MCB 300L</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo('Biochemistry', 'Emeka Okoye (BCH)', '200 Level')}
                className="text-xs px-3 py-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 border border-cyan-700/40 transition flex items-center gap-1.5"
              >
                <span>🧪 BCH 200L</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemo('Molecular Biology', 'Zainab Bello (MOL)', '400 Level')}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/40 transition flex items-center gap-1.5"
              >
                <span>🧬 MOL 400L</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/90 border border-emerald-800/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Form Mode Toggle */}
            <div className="flex bg-slate-950/80 p-1 rounded-xl mb-5 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                  setAuthErrorType(null);
                  setResetSent(false);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  tab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Student Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMessage(null);
                  setAuthErrorType(null);
                  setResetSent(false);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  tab === 'register'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                New Registration
              </button>
            </div>

            {/* Error & Info Banner */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0 text-sm">⚠️</span>
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>

                {authErrorType === 'email-in-use' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setErrorMessage(null);
                      setAuthErrorType(null);
                    }}
                    className="self-start mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                  >
                    <span>Click here to Sign In with this email</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {authErrorType === 'invalid-credential' && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('register');
                        setErrorMessage(null);
                        setAuthErrorType(null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <span>Register this email as a new student</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={resetLoading}
                      onClick={handlePasswordReset}
                      className="px-2.5 py-1.5 text-slate-300 hover:text-emerald-400 text-xs font-semibold underline transition flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{resetLoading ? 'Sending reset...' : 'Forgot password?'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {resetSent && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Password reset link sent! Check your inbox for instructions.</span>
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@school.edu.ng"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetLoading}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      {resetLoading ? 'Sending...' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter NABIOSOS Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Stephen Aleje"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                      <option value="Biological Sciences General">Biological Sciences (General)</option>
                      <option value="Staff / Faculty">Staff / Faculty</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="100 Level">100 Level</option>
                      <option value="200 Level">200 Level</option>
                      <option value="300 Level">300 Level</option>
                      <option value="400 Level">400 Level</option>
                      <option value="Postgraduate / Alumni">Postgraduate / Alumni</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@school.edu.ng"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Choose Profile Avatar
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.slice(0, 6).map((imgUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(imgUrl);
                          setCustomAvatarUrl('');
                        }}
                        className={`w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 transition ${
                          selectedAvatar === imgUrl && !customAvatarUrl
                            ? 'ring-emerald-400 scale-105'
                            : 'ring-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt="Avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <p>
          NABIOSOS Hub © {new Date().getFullYear()} • Dedicated to Academic Excellence, Innovation & Student Synergy
        </p>
      </footer>
    </div>
  );
};
