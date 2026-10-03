import React, { useState, useEffect } from 'react';
import { X, Activity, RefreshCw, CheckCircle2, AlertCircle, Key, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface ProviderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProviderInfo {
  name: string;
  category: 'public_keyless' | 'optional_key' | 'partner_only';
  types: string;
  description: string;
  status: 'Ready & Working' | 'Needs Free Key' | 'Partner Only';
  signupUrl?: string;
  envKey?: string;
  keyInstructions?: string;
}

const PROVIDERS_DIRECTORY: ProviderInfo[] = [
  // Tier 1: 100% Free Official Public APIs (NO API Key required at all!)
  {
    name: 'Openverse',
    category: 'public_keyless',
    types: 'Photos, Artwork, CC Audio',
    description: 'Official Creative Commons search engine indexing 700+ million public domain and CC-licensed works from Flickr, Smithsonian, NASA, Jamendo, and European museums.',
    status: 'Ready & Working'
  },
  {
    name: 'Wikimedia Commons',
    category: 'public_keyless',
    types: 'Photos, Historical, Audio, Vectors',
    description: 'The world\'s largest public repository of freely usable educational and media files (over 100 million images, audio recordings, historical photographs, and SVGs).',
    status: 'Ready & Working'
  },
  {
    name: 'Iconify',
    category: 'public_keyless',
    types: 'Vector Icons, Scalable SVGs',
    description: 'Universal open-source vector icon framework with over 200,000 clean icons from Lucide, Material Design, Tabler, Phosphor, and FontAwesome.',
    status: 'Ready & Working'
  },

  // Tier 2: Free Official APIs (Get a free developer key in 60 seconds)
  {
    name: 'Pexels',
    category: 'optional_key',
    types: 'Curated Photography & 4K Drone Footage',
    description: 'Curated high-resolution stock photography and 4K aerial footage by independent creators worldwide.',
    status: 'Needs Free Key',
    signupUrl: 'https://www.pexels.com/api/',
    envKey: 'PEXELS_API_KEY',
    keyInstructions: 'Create a free account at Pexels and click "Request API Key" to get an instant free token.'
  },
  {
    name: 'Pixabay',
    category: 'optional_key',
    types: 'Photos, Vectors, Illustrations & Videos',
    description: 'Over 4 million high quality stock images, videos, music, and vector graphics shared by creative contributors.',
    status: 'Needs Free Key',
    signupUrl: 'https://pixabay.com/api/docs/',
    envKey: 'PIXABAY_API_KEY',
    keyInstructions: 'Sign in to Pixabay and your personal API key is shown right in the API docs.'
  },
  {
    name: 'Unsplash',
    category: 'optional_key',
    types: 'Aesthetic Editorial & High-Res Photography',
    description: 'The premier photography platform with over 3 million hand-selected, high-resolution aesthetic photographs.',
    status: 'Needs Free Key',
    signupUrl: 'https://unsplash.com/developers',
    envKey: 'UNSPLASH_ACCESS_KEY',
    keyInstructions: 'Register an Unsplash Developer account, create a new demo app, and copy the Access Key.'
  },
  {
    name: 'GIPHY',
    category: 'optional_key',
    types: 'Looping GIFs & Transparent Stickers',
    description: 'The world\'s largest library of animated GIFs, motion stickers, and video loops.',
    status: 'Needs Free Key',
    signupUrl: 'https://developers.giphy.com/',
    envKey: 'GIPHY_API_KEY',
    keyInstructions: 'Click "Create an App" on GIPHY Developers to generate an instant free API key.'
  },
  {
    name: 'Freesound',
    category: 'optional_key',
    types: 'Field Audio, Foley & Sound Effects',
    description: 'Huge collaborative database of audio snippets, samples, bleeps, and sound effects under Creative Commons.',
    status: 'Needs Free Key',
    signupUrl: 'https://freesound.org/help/developers/',
    envKey: 'FREESOUND_API_KEY',
    keyInstructions: 'Register for free and apply for an API credential for personal/open-source use.'
  },

  // Tier 3: Unsupported / Partner Only
  {
    name: 'Coverr',
    category: 'partner_only',
    types: 'Curated Stock Video',
    description: 'Coverr does not maintain a public open API for third-party client apps without an enterprise commercial agreement.',
    status: 'Partner Only'
  },
  {
    name: 'Mixkit',
    category: 'partner_only',
    types: 'Sound Tracks & Effects',
    description: 'Mixkit by Envato does not provide an official public REST API. Sound and music are served through Openverse & Freesound.',
    status: 'Partner Only'
  },
  {
    name: 'unDraw',
    category: 'partner_only',
    types: 'Flat SVG Illustrations',
    description: 'unDraw is an open vector illustration library without an official public JSON search endpoint. Scalable vectors are served via Iconify & Wikimedia.',
    status: 'Partner Only'
  }
];

export const ProviderStatusModal: React.FC<ProviderStatusModalProps> = ({ isOpen, onClose }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'public_keyless' | 'optional_key'>('all');

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

  const filteredProviders = PROVIDERS_DIRECTORY.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.category === activeFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-950/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 mr-2">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex-shrink-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">Working Providers Directory</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                11 Official integrations, keyless public feeds & free signup links
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close providers modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Filter Tabs */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50 text-xs overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer min-h-[36px] ${
              activeFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All 11 Providers
          </button>
          <button
            onClick={() => setActiveFilter('public_keyless')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              activeFilter === 'public_keyless'
                ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                : 'text-slate-400 hover:text-lime-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-lime-400" />
            <span>Built-in Public APIs (3)</span>
          </button>
          <button
            onClick={() => setActiveFilter('optional_key')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 min-h-[36px] ${
              activeFilter === 'optional_key'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span>Optional Free Keys (5)</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {filteredProviders.map((provider) => {
            const isKeyless = provider.category === 'public_keyless';
            const isOptionalKey = provider.category === 'optional_key';

            return (
              <div
                key={provider.name}
                className={`p-4 rounded-2xl border transition-all ${
                  isKeyless
                    ? 'bg-slate-950/70 border-lime-500/20 hover:border-lime-500/40'
                    : isOptionalKey
                    ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/30 border-slate-850 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{provider.name}</span>
                      <span className="text-[11px] text-slate-500">·</span>
                      <span className="text-[11px] text-cyan-400 font-mono font-medium">{provider.types}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      {provider.description}
                    </p>
                    {provider.keyInstructions && (
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        💡 {provider.keyInstructions}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider self-start sm:self-auto ${
                        isKeyless
                          ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30'
                          : isOptionalKey
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {provider.status}
                    </span>

                    {provider.signupUrl && (
                      <a
                        href={provider.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700 hover:border-slate-600"
                      >
                        <span>Get Free Key</span>
                        <ExternalLink className="h-3 w-3 text-cyan-400" />
                      </a>
                    )}

                    {provider.envKey && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Env: <code className="text-slate-300">{provider.envKey}</code>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <span>
            Openverse, Wikimedia & Iconify deliver millions of real creative items with 0 configuration.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
