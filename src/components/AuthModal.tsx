import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  Key,
  Home,
  Check
} from 'lucide-react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';
import { Language, translations } from '../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  lang: Language;
}

type AuthView = 'login' | 'signup' | 'forgot' | 'reset' | 'change_password' | 'profile';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  lang
}) => {
  const t = translations[lang];
  const [view, setView] = useState<AuthView>(currentUser ? 'profile' : 'login');

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generatedDemoToken, setGeneratedDemoToken] = useState('');

  if (!isOpen) return null;

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const users = storage.getUsers();
      const input = emailOrPhone.trim().toLowerCase();
      const matched = users.find(
        u => u.email.toLowerCase() === input || u.phone === input
      );

      if (matched) {
        storage.setCurrentUser(matched);
        onUserChange(matched);
        setSuccessMsg(`Welcome back, ${matched.name}!`);
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 800);
      } else {
        // Neutral safe rejection
        setErrorMsg(
          lang === 'hi'
            ? 'अमान्य क्रेडेंशियल्स या उपयोगकर्ता नहीं मिला। (उदाहरण: customer@gmail.com या admin@madhavmedical.com)'
            : 'Invalid credentials or user not found. (Try customer@gmail.com or admin@madhavmedical.com)'
        );
      }
      setLoading(false);
    }, 400);
  };

  // One-Tap Gmail Sign-In
  const handleGoogleGmailSignIn = (presetEmail?: string) => {
    setErrorMsg('');
    setLoading(true);
    const targetGmail = presetEmail || (emailOrPhone.includes('@gmail.com') ? emailOrPhone.trim().toLowerCase() : 'customer@gmail.com');

    setTimeout(() => {
      const users = storage.getUsers();
      let matched = users.find(u => u.email.toLowerCase() === targetGmail.toLowerCase());

      if (!matched) {
        // Auto-register new customer with Gmail
        matched = {
          id: `user_gmail_${Date.now()}`,
          name: targetGmail === 'madhavmedicalhall2016@gmail.com' ? 'Madhav Medical Owner' : 'Gmail Customer',
          email: targetGmail,
          phone: '9122260360',
          role: targetGmail === 'madhavmedicalhall2016@gmail.com' ? 'admin' : 'customer',
          isApproved: true,
          addresses: [
            {
              id: 'addr_default',
              label: 'Home',
              fullAddress: 'Ward No. 04, Near Shiv Mandir, Main Road',
              locality: 'Chanman, Baheri',
              pinCode: '847101',
              landmark: 'Near Shiv Mandir',
              isDefault: true
            }
          ],
          createdAt: new Date().toISOString()
        };
        const updated = [...users, matched];
        localStorage.setItem('mmh_users_v2', JSON.stringify(updated));
        storage.addAuditLog(targetGmail, 'GMAIL_SIGN_IN_REGISTER', 'User registered and signed in via Google / Gmail.');
      }

      storage.setCurrentUser(matched);
      onUserChange(matched);
      setSuccessMsg(
        lang === 'hi'
          ? `Google / Gmail खाता सफलतापूर्वक कनेक्ट हो गया: ${matched.email}`
          : `Signed in via Google / Gmail: ${matched.email}`
      );
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 800);
      setLoading(false);
    }, 450);
  };

  // Sign Up handler
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg(lang === 'hi' ? 'दोनों पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(lang === 'hi' ? 'पासवर्ड में कम से कम 6 अक्षर होने चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const users = storage.getUsers();
      const cleanEmail = emailOrPhone.trim().toLowerCase();
      const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        setErrorMsg(
          lang === 'hi'
            ? 'इस ईमेल पते का खाता पहले से मौजूद है। कृपया लॉगिन करें।'
            : 'An account with this email already exists. Please login.'
        );
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        name: fullName.trim() || 'Valued Customer',
        email: cleanEmail,
        phone: mobileNumber.trim() || '9122260360',
        role: 'customer', // default security constraint: never auto-admin
        isApproved: true,
        addresses: [],
        createdAt: new Date().toISOString()
      };

      const updatedList = [...users, newUser];
      storage.setCurrentUser(newUser);
      localStorage.setItem('mmh_users_v2', JSON.stringify(updatedList));
      storage.addAuditLog(newUser.email, 'USER_REGISTERED', 'Customer account created.');

      onUserChange(newUser);
      setSuccessMsg(lang === 'hi' ? 'खाता सफलतापूर्वक बनाया गया!' : 'Account registered successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 900);
      setLoading(false);
    }, 500);
  };

  // Forgot Password handler
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      const res = storage.createPasswordResetToken(emailOrPhone);
      setSuccessMsg(res.message);
      if (res.token) {
        setGeneratedDemoToken(res.token);
        setResetToken(res.token);
      }
      setLoading(false);
    }, 400);
  };

  // Reset Password handler
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg(lang === 'hi' ? 'दोनों पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(lang === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = storage.resetPasswordWithToken(resetToken, password);
      if (res.success) {
        setSuccessMsg(
          lang === 'hi'
            ? 'पासवर्ड सफलतापूर्वक रीसेट हो गया! आप नए पासवर्ड से लॉगिन कर सकते हैं।'
            : 'Password reset successfully! You can now login with your new password.'
        );
        setTimeout(() => {
          setView('login');
          setSuccessMsg('');
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
      setLoading(false);
    }, 400);
  };

  // Change Password for logged in users
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) return;
    if (password !== confirmPassword) {
      setErrorMsg(lang === 'hi' ? 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।' : 'New password and confirm password do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(lang === 'hi' ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = storage.changePassword(currentUser.id, currentPassword, password);
      if (res.success) {
        setSuccessMsg(lang === 'hi' ? 'पासवर्ड सफलतापूर्वक बदल दिया गया!' : 'Password updated successfully!');
        setTimeout(() => {
          setView('profile');
          setSuccessMsg('');
          setPassword('');
          setConfirmPassword('');
          setCurrentPassword('');
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
      setLoading(false);
    }, 400);
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    onUserChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 select-none">
          <div className="flex items-center gap-2">
            {view !== 'login' && view !== 'profile' && (
              <button
                type="button"
                onClick={() => setView(currentUser ? 'profile' : 'login')}
                className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 id="auth-modal-title" className="font-bold text-base sm:text-lg">
                {view === 'login' && (lang === 'hi' ? 'खाता लॉगिन (Login)' : 'Sign In to Madhav Medical')}
                {view === 'signup' && (lang === 'hi' ? 'नया खाता बनाएं (Sign Up)' : 'Create Customer Account')}
                {view === 'forgot' && (lang === 'hi' ? 'पासवर्ड रीसेट करें (Forgot Password)' : 'Reset Forgotten Password')}
                {view === 'reset' && (lang === 'hi' ? 'नया पासवर्ड दर्ज करें (Set New Password)' : 'Set New Password')}
                {view === 'change_password' && (lang === 'hi' ? 'पासवर्ड बदलें (Change Password)' : 'Change Password')}
                {view === 'profile' && (lang === 'hi' ? 'उपयोगकर्ता प्रोफ़ाइल (Account)' : 'My Account Profile')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                MADHAV MEDICAL HALL • Baheri, Darbhanga
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: PROFILE (Logged in User) */}
          {view === 'profile' && currentUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-slate-800/40 border border-blue-100 dark:border-blue-900">
                <div className="h-13 w-13 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-600/25">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {currentUser.email}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Phone: {currentUser.phone}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    Role: {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Password Management & Return to Home actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setView('change_password')}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                >
                  <Key size={14} />
                  <span>{lang === 'hi' ? 'पासवर्ड बदलें (Change Password)' : 'Change Account Password'}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Home size={14} />
                  <span>{lang === 'hi' ? 'होम स्क्रीन पर लौटें' : 'Return to Home Screen'}</span>
                </button>
              </div>

              {/* Quick Switch Role Accounts for Testing */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'hi' ? 'त्वरित खाता स्विच (परीक्षण हेतु):' : 'Instant Switch Account (Demo Testing):'}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const admin = storage.getUsers().find(u => u.role === 'admin');
                      if (admin) {
                        storage.setCurrentUser(admin);
                        onUserChange(admin);
                      }
                    }}
                    className={`min-h-[40px] py-1.5 px-2 rounded-lg font-bold text-[11px] border text-center transition-all cursor-pointer ${
                      currentUser.role === 'admin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const del = storage.getUsers().find(u => u.role === 'delivery');
                      if (del) {
                        storage.setCurrentUser(del);
                        onUserChange(del);
                      }
                    }}
                    className={`min-h-[40px] py-1.5 px-2 rounded-lg font-bold text-[11px] border text-center transition-all cursor-pointer ${
                      currentUser.role === 'delivery'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cust = storage.getUsers().find(u => u.role === 'customer');
                      if (cust) {
                        storage.setCurrentUser(cust);
                        onUserChange(cust);
                      }
                    }}
                    className={`min-h-[40px] py-1.5 px-2 rounded-lg font-bold text-[11px] border text-center transition-all cursor-pointer ${
                      currentUser.role === 'customer'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Customer
                  </button>
                </div>
              </div>

              {/* Logout & Account Deletion (Google Play Compliance) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {t.logout}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your profile? In accordance with statutory rules, previous pharma tax invoices will be archived.')) {
                      storage.deleteCustomerAccount(currentUser.id);
                      onUserChange(null);
                      onClose();
                    }
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-xs transition-colors cursor-pointer"
                >
                  {t.deleteAccount}
                </button>
              </div>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <div className="space-y-4">
              {/* Google / Gmail Instant Sign-In Button */}
              <button
                type="button"
                onClick={() => handleGoogleGmailSignIn()}
                disabled={loading}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
                <span>{lang === 'hi' ? 'Gmail / Google से 1-क्लिक लॉगिन' : 'Continue with Google / Gmail'}</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <span className="h-[1px] w-full bg-slate-200 dark:bg-slate-700" />
                <span className="absolute bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400">
                  {lang === 'hi' ? 'या ईमेल / मोबाइल से' : 'or with Email / Mobile'}
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'ईमेल या मोबाइल नंबर (Gmail / Phone)' : 'Email (Gmail) or Mobile Number'} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      required
                      value={emailOrPhone}
                      onChange={e => setEmailOrPhone(e.target.value)}
                      placeholder="e.g. customer@gmail.com or 9122260360"
                      className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.password} *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setView('forgot');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={lang === 'hi' ? 'पासवर्ड दर्ज करें' : 'Enter password'}
                      className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t.hidePassword : t.showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (lang === 'hi' ? 'लॉगिन हो रहा है...' : 'Authenticating...') : t.login}
                </button>

                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setView('signup');
                    }}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {t.dontHaveAccount}
                  </button>
                </div>

                {/* Demo Credentials Box */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'hi' ? 'त्वरित परीक्षण खाते (Pre-configured):' : 'Pre-configured Test Accounts:'}
                  </p>
                  <p>• Customer: <span className="font-mono text-emerald-600 font-bold">customer@gmail.com</span></p>
                  <p>• Admin: <span className="font-mono text-blue-600 font-bold">admin@madhavmedical.com</span></p>
                  <p>• Delivery: <span className="font-mono text-amber-600 font-bold">delivery@madhavmedical.com</span></p>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: SIGN UP */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Google / Gmail fast registration */}
              <button
                type="button"
                onClick={() => handleGoogleGmailSignIn()}
                className="w-full min-h-[46px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{lang === 'hi' ? 'Gmail से सीधा खाता बनाएं' : 'Sign up faster with Google / Gmail'}</span>
              </button>

              <div className="relative flex items-center justify-center my-2">
                <span className="h-[1px] w-full bg-slate-200 dark:bg-slate-700" />
                <span className="absolute bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400">
                  {lang === 'hi' ? 'या विवरण भरें' : 'or fill details manually'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.fullName} *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'ईमेल पता (Gmail Address)' : 'Email (Gmail Address)'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.phoneNumber} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.password} * (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.confirmPassword} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? t.hidePassword : t.showPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (lang === 'hi' ? 'खाता बनाया जा रहा है...' : 'Creating Account...') : t.signup}
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {t.alreadyHaveAccount}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'hi'
                  ? 'अपना पंजीकृत जीमेल या मोबाइल नंबर दर्ज करें। हम आपको 15 मिनट के लिए वैध एकल-उपयोग सुरक्षा रीसेट टोकन प्रदान करेंगे।'
                  : 'Enter your registered Gmail address or phone number. We will issue a time-limited single-use security reset token.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'पंजीकृत जीमेल / मोबाइल' : 'Registered Gmail / Mobile'} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. customer@gmail.com"
                    className="w-full min-h-[48px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {loading ? (lang === 'hi' ? 'जाँच हो रही है...' : 'Processing...') : t.sendResetLink}
              </button>

              {/* Instant Token Preview for Zero-Cost Seamless Verification */}
              {generatedDemoToken && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    <KeyRound size={16} />
                    <span>{lang === 'hi' ? 'सुरक्षा रीसेट कोड तैयार:' : 'Single-Use Security Token Ready:'}</span>
                  </div>
                  <div className="font-mono text-sm bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-300 text-emerald-900 dark:text-emerald-200 select-all font-bold text-center">
                    {generatedDemoToken}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetToken(generatedDemoToken);
                      setView('reset');
                    }}
                    className="w-full min-h-[40px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>{lang === 'hi' ? 'पासवर्ड रीसेट करने के लिए आगे बढ़ें →' : 'Proceed to Set New Password →'}</span>
                  </button>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  ← {lang === 'hi' ? 'लॉगिन पर वापस जाएं' : 'Back to Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD (With Token) */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'सुरक्षा रीसेट टोकन' : 'Security Reset Token'} *
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  placeholder="Paste security reset token"
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none select-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'नया पासवर्ड (New Password)' : 'New Password'} * (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-600 outline-none select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {loading ? (lang === 'hi' ? 'अपडेट हो रहा है...' : 'Updating...') : (lang === 'hi' ? 'नया पासवर्ड सुरक्षित करें' : 'Set New Password')}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  ← {lang === 'hi' ? 'लॉगिन स्क्रीन' : 'Back to Login'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: CHANGE PASSWORD (For Logged-In User) */}
          {view === 'change_password' && currentUser && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'वर्तमान पासवर्ड (Current Password)' : 'Current Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (optional in demo)"
                    className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'नया पासवर्ड (New Password)' : 'New Password'} * (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'नए पासवर्ड की पुष्टि करें' : 'Confirm New Password'} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm select-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('profile')}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {loading ? (lang === 'hi' ? 'बदला जा रहा है...' : 'Updating...') : (lang === 'hi' ? 'पासवर्ड बदलें' : 'Update Password')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
