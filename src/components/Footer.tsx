import React from 'react';
import { Compass, Bookmark, FileText, Database, Layers, Activity, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavClick: (tab: 'discover' | 'collections' | 'licenses' | 'schema' | 'status') => void;
  onOpenDebug: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick, onOpenDebug }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#04060d] text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-extrabold tracking-tight text-white">
                FreeStock<span className="text-lime-400">.hub</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Unified search engine for free and openly licensed creative media including photos, 4K videos, audio, sound FX, vectors, icons, and GIFs.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-lime-400/90 font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>100% Direct Downloads · Zero Adware</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavClick('discover')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Discover Creative Media
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('collections')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Curated Collections
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('status')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  11 Working Providers
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenDebug}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer font-medium"
                >
                  Engine Diagnostics
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Licenses */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Open Licenses</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavClick('licenses')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Creative Commons (CC0 & CC-BY)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('licenses')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Public Domain Dedication
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('licenses')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Commercial Use Rights
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavClick('schema')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  PostgreSQL Data Schema
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Verified Feeds */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Official Sources</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Feeds indexed live from Openverse (WordPress CC Search), Wikimedia Commons, Iconify, Unsplash, Pexels, Pixabay, GIPHY, and Freesound.
            </p>
            <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Photos</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">4K Video</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Audio FX</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">SVG Icons</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} FreeStock Hub. All media rights and licenses belong to their respective creators and open archives.
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Built for high-performance open web exploration</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
