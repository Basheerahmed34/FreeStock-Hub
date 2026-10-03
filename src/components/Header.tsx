import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Activity,
  Sparkles,
  Download,
  User as UserIcon,
  Shield,
  Menu,
  X,
  Compass,
  FileText,
  Database,
  Layers
} from 'lucide-react';
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
  onOpenDebug: () => void;
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
  onOpenDebug,
  currentUser,
  userProfile,
  downloadCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isDeveloper = Boolean(
    currentUser?.email?.toLowerCase() === 'mohsinjutt5855@gmail.com' ||
    userProfile?.role === 'developer'
  );

  const handleMobileNavClick = (tab: 'discover' | 'collections' | 'licenses' | 'schema' | 'status') => {
    onNavClick(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060811]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark & Quick Badges */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => onNavClick('discover')}
            className="flex items-center gap-2 text-left transition-opacity hover:opacity-90 cursor-pointer flex-shrink-0"
            aria-label="FreeStock Hub Home"
          >
            <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white">
              FreeStock<span className="text-lime-400">.hub</span>
            </span>
          </button>

          {/* Engine Diagnostics Panel Button (Desktop & Tablet) */}
          <button
            onClick={onOpenDebug}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-[11px] font-bold tracking-wide transition-all cursor-pointer flex-shrink-0"
            title="Open Live Search Engine Diagnostics (11 Providers)"
          >
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span>Diagnostics</span>
          </button>

          {/* Operator Admin Badge Button (Medium+ screens) */}
          <button
            onClick={onOpenAdmin}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-[11px] font-bold tracking-wide transition-all cursor-pointer flex-shrink-0"
            title="Developer Operator Admin Panel"
          >
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span>Admin</span>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links (Large Screens) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400" aria-label="Main Navigation">
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
              <span className="text-xs font-mono text-lime-400 font-bold">({savedCount})</span>
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

        {/* Zone 3: Quick Action Buttons & Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* User Download History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 rounded-xl hover:border-lime-400/40 hover:bg-slate-800 transition-all cursor-pointer min-h-[38px]"
            title="View Realtime Download History"
            aria-label="Download History"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
            <span className="hidden md:inline text-slate-400">Downloads:</span>
            <span className="font-mono text-lime-400 tabular-nums">
              {downloadCount}
            </span>
          </button>

          {/* Firebase Authentication Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 hover:border-lime-400/50 text-slate-200 transition-all cursor-pointer min-h-[38px]"
            aria-label="User Account"
          >
            <UserIcon className="h-3.5 w-3.5 text-lime-400 flex-shrink-0" />
            <span className="max-w-[70px] sm:max-w-[110px] truncate hidden xs:inline">
              {currentUser
                ? currentUser.displayName || currentUser.email?.split('@')[0] || 'Guest'
                : 'Sign In'}
            </span>
          </button>

          {/* Responsive Mobile Hamburger Menu Toggle Button (Touch Friendly 44x44px target) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-[#060811]/98 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-1.5 text-sm font-medium">
            <button
              onClick={() => handleMobileNavClick('discover')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'discover'
                  ? 'bg-lime-400/10 text-lime-400 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass className="h-4 w-4" />
                <span>Discover Media</span>
              </div>
            </button>

            <button
              onClick={() => handleMobileNavClick('collections')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'collections'
                  ? 'bg-lime-400/10 text-lime-400 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark className="h-4 w-4" />
                <span>My Collections</span>
              </div>
              {savedCount > 0 && (
                <span className="text-xs font-mono font-bold bg-lime-400/20 text-lime-400 px-2 py-0.5 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleMobileNavClick('licenses')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'licenses'
                  ? 'bg-lime-400/10 text-lime-400 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" />
                <span>License Guide</span>
              </div>
            </button>

            <button
              onClick={() => handleMobileNavClick('schema')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'schema'
                  ? 'bg-lime-400/10 text-lime-400 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4" />
                <span>SQL Schema</span>
              </div>
            </button>

            <button
              onClick={() => handleMobileNavClick('status')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer min-h-[44px] ${
                activeTab === 'status'
                  ? 'bg-lime-400/10 text-lime-400 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4" />
                <span>Providers Directory</span>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {providerCount} active
              </span>
            </button>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold min-h-[44px]"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Operator Admin</span>
              </button>
              <button
                onClick={() => {
                  onOpenDebug();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold min-h-[44px]"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Diagnostics</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
