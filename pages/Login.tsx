import React, { useState } from 'react';
import { UserRole } from '../types';
import { ApiService } from '../services/api';
import { ShieldCheck, UserCircle, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface LoginProps {
  onLogin: (role: UserRole, email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'menu' | 'password' | 'email' | 'full-recovery' | 'sms-password'>('password');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [newEmailDetails, setNewEmailDetails] = useState({ firstName: '', lastName: '', department: '' });

  // Hook for Role Selection (Admin / Employee)
  const { containerRef: roleContainerRef } = useKeyboardNavigation({
    itemSelector: 'button[data-nav-item]',
    enabled: !selectedRole && !showForgotModal, // Only active when no role selected and no modal
    axis: 'vertical'
  });

  // Hook for Form (Email -> Password -> Submit)
  const { containerRef: formContainerRef } = useKeyboardNavigation({
    itemSelector: 'input, button[type="submit"]',
    enabled: !!selectedRole && !showForgotModal, // Only active when role selected and no modal
    axis: 'vertical'
  });

  const emailInputRef = React.useRef<HTMLInputElement>(null);
  const adminBtnRef = React.useRef<HTMLButtonElement>(null);

  // Auto-focus logic
  React.useEffect(() => {
    if (!selectedRole && !showForgotModal) {
      // Focus Admin button on load / back
      setTimeout(() => {
        const adminBtn = document.querySelector('button[data-role="admin"]') as HTMLElement;
        if (adminBtn) adminBtn.focus();
      }, 100);
    } else if (selectedRole && !showForgotModal) {
      // Focus Email input on form load
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [selectedRole, showForgotModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const role = selectedRole === UserRole.ADMIN ? 'ADMIN' : 'EMPLOYEE';
      const response = await ApiService.login(email, password, role);

      if (response.success) {
        onLogin(selectedRole!, email);
      } else {
        setError(response.message || 'Invalid credentials');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (recoveryStep === 'password') {
        const res: any = await ApiService.recoverPassword(recoveryInput);
        if (res.mockDebug) {
          alert(`${res.message}\n\n----------------\n${res.mockDebug}\n----------------`);
        } else {
          alert(res.message);
        }
        if (res.success) setShowForgotModal(false);
      } else if (recoveryStep === 'email') {
        const res: any = await ApiService.recoverEmail(recoveryInput);
        if (res.success && res.email) {
          alert(`Email Found!\n\n${res.message}\n\n----------------\n${res.mockDebug}\n----------------`);
        } else {
          alert(res.message);
        }
      } else if (recoveryStep === 'full-recovery') {
        // Flow: Find Email via Phone -> Send Password Reset to that Email
        const emailRes = await ApiService.recoverEmail(recoveryInput);

        if (emailRes.success && emailRes.email) {
          // Email found, now trigger password reset
          const pwdRes: any = await ApiService.recoverPassword(emailRes.email);
          alert(`Account Recovered!\n\nEmail: ${emailRes.email}\n\n${pwdRes.message}\n\n----------------\n${pwdRes.mockDebug || ''}\n----------------`);
          setShowForgotModal(false);
        } else {
          alert(emailRes.message || 'Could not find account details.');
        }
      } else if (recoveryStep === 'sms-password') {
        const res: any = await ApiService.recoverPasswordByPhone(recoveryInput);
        if (res.mockDebug) {
          alert(`${res.message}\n\n----------------\n${res.mockDebug}\n----------------`);
        } else {
          alert(res.message);
        }
        if (res.success) setShowForgotModal(false);
      }
    } catch (e) {
      alert('Action failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] md:h-[700px]">

        {/* Left Panel - Dark / Branding */}
        <div className="md:w-1/2 bg-slate-950 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          {/* Background pattern/gradient */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                <CheckCircle2 className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tight">Nexus EMS</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Enterprise Grade<br />
                Employee Management
              </h1>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                Streamline your HR operations with AI-powered analytics, smart payroll, and automated leave management.
              </p>
            </div>
          </div>

          <div className="relative z-10 text-sm text-slate-500 mt-8 md:mt-0">
            © 2024 Nexus Systems Inc.
          </div>
        </div>

        {/* Right Panel - Content */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">

          <div className="max-w-md mx-auto w-full transition-all duration-300">

            {!selectedRole ? (
              // STEP 1: Role Selection
              <div ref={roleContainerRef} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
                  <p className="text-slate-500">Please select your role to continue</p>
                </div>

                {/* Vertical Stack Layout (Rectangular Cards) */}
                <div className="space-y-4">
                  {/* Admin Card - Top */}
                  <button
                    data-nav-item
                    data-role="admin"
                    onClick={() => handleRoleSelect(UserRole.ADMIN)}
                    className="w-full p-5 border border-slate-200 rounded-xl hover:border-slate-900 hover:ring-1 hover:ring-slate-900 transition-all duration-200 group flex items-center text-left shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <div className="p-3 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all duration-200 mr-4 shrink-0">
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-slate-900 transition-colors">Admin Portal</h3>
                      <p className="text-slate-500 text-sm mt-0.5">Full access to system controls, analytics and employee database.</p>
                    </div>
                  </button>

                  {/* Employee Card - Bottom */}
                  <button
                    data-nav-item
                    onClick={() => handleRoleSelect(UserRole.EMPLOYEE)}
                    className="w-full p-5 border border-slate-200 rounded-xl hover:border-blue-600 hover:ring-1 hover:ring-blue-600 transition-all duration-200 group flex items-center text-left shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 mr-4 shrink-0">
                      <UserCircle size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">Employee Login</h3>
                      <p className="text-slate-500 text-sm mt-0.5">Access your profile, Leaves, salary slips and tasks and add tasks.</p>
                    </div>
                  </button>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-slate-400 text-sm mb-2">Don't have an account? Contact HR:</p>
                  <div className="flex flex-col space-y-1">
                    <a href="tel:8871647576" className="text-blue-600 font-medium hover:underline text-sm">1. 8871647576</a>
                    <a href="tel:7999674290" className="text-blue-600 font-medium hover:underline text-sm">2. 7999674290</a>
                  </div>
                </div>
              </div>
            ) : (
              // STEP 2: Login Form
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors text-sm font-medium group"
                >
                  <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to role selection
                </button>

                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${selectedRole === UserRole.ADMIN ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'}`}>
                      {selectedRole === UserRole.ADMIN ? <ShieldCheck size={20} /> : <UserCircle size={20} />}
                    </div>
                    <span className="font-bold text-slate-900 text-lg tracking-tight">
                      {selectedRole === UserRole.ADMIN ? 'Admin Portal' : 'Employee Login'}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Sign in</h2>
                </div>

                <form ref={formContainerRef} onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-3.5 text-slate-400" />
                      <input
                        ref={emailInputRef}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => { setShowForgotModal(true); setRecoveryStep('password'); }}
                        className="text-sm font-medium text-blue-600 hover:underline focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${selectedRole === UserRole.ADMIN
                      ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                      }`}
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </button>

                  <div className="pt-4 text-center">
                    <p className="text-slate-400 text-sm mb-2">Don't have an account? Contact HR:</p>
                    <div className="flex flex-col space-y-1">
                      <a href="tel:8871647576" className="text-blue-600 font-medium hover:underline text-sm">1. 8871647576</a>
                      <a href="tel:7999674290" className="text-blue-600 font-medium hover:underline text-sm">2. 7999674290</a>
                    </div>
                  </div>

                </form>
              </div>
            )}

            {/* Recovery Modal */}
            {showForgotModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">
                      {recoveryStep === 'menu' && 'Account Recovery'}
                      {recoveryStep === 'password' && 'Reset Password'}
                      {recoveryStep === 'email' && 'Recover Email'}
                      {recoveryStep === 'full-recovery' && 'Full Account Recovery'}
                    </h3>
                    <button
                      onClick={() => setShowForgotModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ArrowRight size={20} className="rotate-45" />
                    </button>
                  </div>

                  <div className="p-6">

                    {recoveryStep === 'password' && (
                      <form onSubmit={handleRecovery} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Enter your Email</label>
                          <input
                            type="email"
                            required
                            className="w-full border p-2 rounded-lg"
                            placeholder="you@nexus.com"
                            value={recoveryInput}
                            onChange={(e) => setRecoveryInput(e.target.value)}
                          />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                          {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <button type="button" onClick={() => setShowForgotModal(false)} className="w-full text-slate-500 text-sm hover:underline">Close</button>
                      </form>
                    )}

                    {recoveryStep === 'email' && (
                      <form onSubmit={handleRecovery} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Enter Phone Number</label>
                          <input
                            type="tel"
                            required
                            className="w-full border p-2 rounded-lg"
                            placeholder="10-digit mobile number"
                            value={recoveryInput}
                            onChange={(e) => setRecoveryInput(e.target.value)}
                          />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                          {isLoading ? 'Searching...' : 'Find Email'}
                        </button>
                        <button type="button" onClick={() => setRecoveryStep('menu')} className="w-full text-slate-500 text-sm hover:underline">Back</button>
                      </form>
                    )}

                    {recoveryStep === 'sms-password' && (
                      <form onSubmit={handleRecovery} className="space-y-4">
                        <div className="bg-purple-50 p-3 rounded-lg text-xs text-purple-800 mb-2">
                          Enter your registered mobile number to receive your password via SMS.
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Enter Mobile Number</label>
                          <input
                            type="tel"
                            required
                            className="w-full border p-2 rounded-lg"
                            placeholder="10-digit mobile number"
                            value={recoveryInput}
                            onChange={(e) => setRecoveryInput(e.target.value)}
                          />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700">
                          {isLoading ? 'Sending SMS...' : 'Send Password via SMS'}
                        </button>
                        <button type="button" onClick={() => setRecoveryStep('menu')} className="w-full text-slate-500 text-sm hover:underline">Back</button>
                      </form>
                    )}

                    {recoveryStep === 'full-recovery' && (
                      <form onSubmit={handleRecovery} className="space-y-4">
                        <div className="bg-red-50 p-3 rounded-lg text-xs text-red-800 mb-2">
                          We will look up your details using your verified phone number and reset your credentials.
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Enter Verified Phone Number</label>
                          <input
                            type="tel"
                            required
                            className="w-full border p-2 rounded-lg"
                            placeholder="10-digit mobile number"
                            value={recoveryInput}
                            onChange={(e) => setRecoveryInput(e.target.value)}
                          />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700">
                          {isLoading ? 'Recovering...' : 'Recover Account'}
                        </button>
                        <button type="button" onClick={() => setRecoveryStep('menu')} className="w-full text-slate-500 text-sm hover:underline">Back</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div >
  );
};

export default Login;