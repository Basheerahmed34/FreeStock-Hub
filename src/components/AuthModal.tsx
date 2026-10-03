import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  AppUser,
  UserProfile,
  signInResiliently,
  signInAsDeveloper,
  signInResilientGuest,
  signOutResiliently
} from '../lib/firebase.js';
import { X, Lock, Mail, Shield, LogOut, CheckCircle2, Sparkles, AlertCircle, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | User | null;
  userProfile: UserProfile | null;
  onUserChanged: (user: AppUser | null, profile: UserProfile | null) => void;
  onOpenAdminPanel?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  onUserChanged,
  onOpenAdminPanel
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    try {
      const res = await signInResiliently(email, password, isSignUp);
      onUserChanged(res.user, res.profile);
      if (res.message) {
        setInfoMsg(res.message);
        setTimeout(() => onClose(), 1200);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeveloperQuickLogin = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);
    try {
      const res = await signInAsDeveloper();
      onUserChanged(res.user, res.profile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Developer sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);
    try {
      const res = await signInResilientGuest();
      onUserChanged(res.user, res.profile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Guest sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutResiliently();
      onUserChanged(null, null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out.');
    }
  };

  const isDeveloper = Boolean(
    currentUser?.email?.toLowerCase() === 'mohsinjutt5855@gmail.com' ||
    userProfile?.role === 'developer'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 min-w-0 mr-2">
            <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex-shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {currentUser ? 'Creator Account' : isSignUp ? 'Create Free Account' : 'Sign In'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {currentUser
                  ? 'Real-time synchronization for download history'
                  : 'Sync and save your download history across devices'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close authentication modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {currentUser ? (
          /* Signed In View */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="inline-flex items-center gap-1.5 text-lime-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse"></span>
                  <span>Firestore Synchronized</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200 font-mono">
                  {currentUser.email || 'Anonymous Guest'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="capitalize px-2 py-0.5 rounded bg-slate-800 font-mono font-bold text-lime-300">
                  {isDeveloper ? 'Developer / Operator' : 'Creator User'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
                <span className="text-slate-400">Downloads Recorded:</span>
                <span className="text-white font-mono font-bold text-sm">
                  {userProfile?.totalDownloads || 0} items
                </span>
              </div>
            </div>

            {isDeveloper && onOpenAdminPanel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold hover:bg-purple-600/30 text-xs transition-colors cursor-pointer"
              >
                <Shield className="h-4 w-4 text-purple-400" />
                <span>Launch Operator Admin Panel (Developer Mode)</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-pink-600/20 hover:border-pink-500/40 hover:text-pink-300 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="space-y-4">
            {/* 1-Click Developer Sign-in Shortcut */}
            <button
              type="button"
              onClick={handleDeveloperQuickLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-purple-900/40 border border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Sign In as Developer</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      1-Click
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    mohsinjutt5855@gmail.com
                  </span>
                </div>
              </div>
              <Shield className="h-4 w-4 text-purple-400" />
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                or sign in with email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : isSignUp ? 'Create Free Account' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors cursor-pointer"
              >
                Continue as Instant Guest
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-lime-400 hover:text-lime-300 underline underline-offset-4 cursor-pointer"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in here'
                    : "Don't have an account? Sign up for free"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
