import React from 'react';
import { Bookmark, Activity, Sparkles, Download, User as UserIcon, Shield } from 'lucide-react';
import { User } from 'firebase/auth';
import { AppUser, UserProfile } from '../lib/firebase.js';

interface HeaderProps {
  onNavClick: (tab: 'discover' | 'collections' | 'licenses' | 'schema' | 'status') => void;
  activeTab: string;
  savedCount: number;
  providerCount: number;
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  currentUser: AppUser | User | null;
  userProfile: UserProfile | null;
  downloadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNavClick,
  activeTab,
  savedCount,
  providerCount,
  onOpenAuth,
  onOpenHistory,
  onOpenAdmin,
  currentUser,
  userProfile,
  downloadCount
}) => {
  const isDeveloper = Boolean(
    currentUser?.email?.toLowerCase() === 'mohsinjutt5855@gmail.com' ||
    userProfile?.role === 'developer'
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060811]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavClick('discover')}
            className="flex items-center gap-2 text-left transition-opacity hover:opacity-90 cursor-pointer"
          >
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              FreeStock<span className="text-lime-400">.hub</span>
            </span>
          </button>

          {/* Operator Admin Badge Button (Always accessible for Developer) */}
          <button
            onClick={onOpenAdmin}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-[11px] font-bold tracking-wide transition-all cursor-pointer"
            title="Developer Operator Admin Panel (Traffic & Downloads)"
          >
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span>Operator Admin</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavClick('discover')}
            className={`transition-colors cursor-pointer hover:text-white ${
              activeTab === 'discover' ? 'text-lime-400 font-semibold' : ''
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => onNavClick('collections')}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white ${
              activeTab === 'collections' ? 'text-lime-400 font-semibold' : ''
            }`}
          >
            Collections
            {savedCount > 0 && (
              <span className="text-xs font-mono text-lime-400">({savedCount})</span>
            )}
          </button>
          <button
            onClick={() => onNavClick('licenses')}
            className={`transition-colors cursor-pointer hover:text-white ${
              activeTab === 'licenses' ? 'text-lime-400 font-semibold' : ''
            }`}
          >
            License Guide
          </button>
          <button
            onClick={() => onNavClick('schema')}
            className={`transition-colors cursor-pointer hover:text-white ${
              activeTab === 'schema' ? 'text-lime-400 font-semibold' : ''
            }`}
          >
            SQL Schema
          </button>
          <button
            onClick={() => onNavClick('status')}
            className={`transition-colors cursor-pointer hover:text-white ${
              activeTab === 'status' ? 'text-lime-400 font-semibold' : ''
            }`}
          >
            Providers ({providerCount})
          </button>
        </nav>

        {/* Zone 3: Realtime User Actions */}
        <div className="flex items-center gap-2.5">
          {/* User Download History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-xl hover:border-lime-400/40 hover:bg-slate-800 transition-all cursor-pointer"
            title="View Realtime Download History"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Downloads:</span>
            <span className="font-mono text-lime-400 tabular-nums">
              {downloadCount}
            </span>
          </button>

          {/* Firebase Authentication Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 hover:border-lime-400/50 text-slate-200 transition-all cursor-pointer"
          >
            <UserIcon className="h-3.5 w-3.5 text-lime-400" />
            <span className="max-w-[110px] truncate hidden sm:inline">
              {currentUser
                ? currentUser.displayName || currentUser.email || 'Guest'
                : 'Sign In'}
            </span>
          </button>

          {/* Mobile Admin Icon Button */}
          <button
            onClick={onOpenAdmin}
            className="sm:hidden p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
            title="Operator Panel"
          >
            <Shield className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
