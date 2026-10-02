import React, { useState, useEffect } from 'react';
import { Zap, Image, Video, Music, Sparkles, Box, Film, ChevronRight, Database, CheckCircle2 } from 'lucide-react';
import { AssetType } from '../types/unified-asset.js';
import { ExtendedAssetFilter } from './FilterRibbon.js';

interface HeroSectionProps {
  onSearchPhrase: (phrase: string, mediaType?: ExtendedAssetFilter) => void;
  activeType: ExtendedAssetFilter;
  onSelectType: (type: ExtendedAssetFilter) => void;
  totalAssetsCount: number;
}

interface StatItem {
  id: string;
  filter: ExtendedAssetFilter;
  label: string;
  count: string;
  desc: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  activeBg: string;
}

const STATS_DATA: StatItem[] = [
  {
    id: 'PHOTOS_VIDEOS',
    filter: 'PHOTOS_VIDEOS',
    label: 'Photos & Videos',
    count: '362M+',
    desc: 'Unsplash, Coverr & Pexels',
    icon: Database,
    color: 'text-lime-400',
    activeBg: 'border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.25)] ring-1 ring-lime-400/50'
  },
  {
    id: AssetType.PHOTO,
    filter: AssetType.PHOTO,
    label: 'Photos & Art',
    count: '350M+',
    desc: 'Openverse & Wikimedia',
    icon: Image,
    color: 'text-cyan-400',
    activeBg: 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50'
  },
  {
    id: AssetType.VIDEO,
    filter: AssetType.VIDEO,
    label: '4K & HD Videos',
    count: '12M+',
    desc: 'Coverr, Mixkit & Pexels',
    icon: Video,
    color: 'text-pink-400',
    activeBg: 'border-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.25)] ring-1 ring-pink-400/50'
  },
  {
    id: AssetType.SOUND_EFFECT,
    filter: AssetType.SOUND_EFFECT,
    label: 'Sound Effects',
    count: '8.5M+',
    desc: 'Freesound & Mixkit Labs',
    icon: Music,
    color: 'text-violet-400',
    activeBg: 'border-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.25)] ring-1 ring-violet-400/50'
  },
  {
    id: AssetType.VECTOR,
    filter: AssetType.VECTOR,
    label: 'Vector SVGs',
    count: '25M+',
    desc: 'unDraw & Pixabay Vectors',
    icon: Box,
    color: 'text-amber-400',
    activeBg: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/50'
  },
  {
    id: AssetType.ICON,
    filter: AssetType.ICON,
    label: 'UI Vector Icons',
    count: '150K+',
    desc: 'Iconify & Lucide Icons',
    icon: Sparkles,
    color: 'text-emerald-400',
    activeBg: 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400/50'
  },
  {
    id: AssetType.GIF,
    filter: AssetType.GIF,
    label: 'Looping GIFs',
    count: '10M+',
    desc: 'GIPHY & Transparent PNGs',
    icon: Film,
    color: 'text-sky-400',
    activeBg: 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/50'
  }
];

const TYPING_PHRASES = [
  { text: 'cinematic 4K videos of neon drone flyovers', type: 'PHOTOS_VIDEOS' as const },
  { text: 'deep sub impact whoosh sound effects for transitions', type: AssetType.SOUND_EFFECT },
  { text: 'high-resolution photography of alpine summits & lakes', type: AssetType.PHOTO },
  { text: 'modular analog synth drones & atmospheric audio loops', type: AssetType.AUDIO },
  { text: 'minimal open-source SVG vector illustrations', type: AssetType.VECTOR },
  { text: 'clean line icons for mobile & web apps', type: AssetType.ICON },
  { text: 'supercars & luxury automotive 4K motion footage', type: 'PHOTOS_VIDEOS' as const },
  { text: 'transparent PNG loops & animated GIF stickers', type: AssetType.GIF }
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearchPhrase,
  activeType,
  onSelectType,
  totalAssetsCount
}) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Typing effect loop
  useEffect(() => {
    const currentFullText = TYPING_PHRASES[phraseIndex].text;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        if (displayText.length + 1 === currentFullText.length) {
          setTimeout(() => setIsDeleting(true), 2400);
        }
      } else {
        // Deleting backward
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        if (displayText.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
        }
      }
    }, isDeleting ? 20 : 50);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  const handlePhraseClick = () => {
    const current = TYPING_PHRASES[phraseIndex];
    onSearchPhrase(current.text, current.type);
  };

  const handleStatCardClick = (filter: ExtendedAssetFilter) => {
    onSelectType(filter);
  };

  return (
    <section className="relative overflow-hidden pt-1 pb-4 space-y-6">
      {/* 1. All Top Stock Category Cards: Fully Clickable & Workable in Realtime */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" />
            <span>Click any Stock Category for Realtime Media Data:</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            11 Sources Synchronized Live
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {STATS_DATA.map((stat) => {
            const Icon = stat.icon;
            const isActive =
              activeType === stat.filter ||
              (stat.filter === 'PHOTOS_VIDEOS' && (activeType === 'PHOTOS_VIDEOS' || activeType === 'ALL')) ||
              (stat.filter === AssetType.SOUND_EFFECT && activeType === AssetType.AUDIO);

            return (
              <button
                key={stat.label}
                type="button"
                onClick={() => handleStatCardClick(stat.filter)}
                className={`flex flex-col p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer select-none ${
                  isActive
                    ? `bg-slate-900 ${stat.activeBg} scale-[1.03] z-10`
                    : 'bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-850 hover:scale-[1.02]'
                }`}
                title={`Click to filter ${stat.label} in real-time`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-semibold truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {stat.label}
                  </span>
                  <Icon className={`h-4 w-4 ${stat.color} flex-shrink-0 ${isActive ? 'animate-bounce' : 'opacity-80'}`} />
                </div>

                <div className="mt-1 flex items-baseline justify-between w-full">
                  <span className="font-mono text-lg font-extrabold text-white tracking-tight tabular-nums">
                    {stat.count}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-lime-400 bg-lime-400/10 px-1.5 py-0.5 rounded border border-lime-400/30 animate-pulse">
                      Live
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 truncate mt-0.5">
                  {stat.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Title and High-Energy Gen Z Typing Animation */}
      <div className="space-y-4 max-w-4xl pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-bold tracking-wide uppercase">
          <Zap className="h-3.5 w-3.5" />
          <span>Universal Open Stock Aggregator · Zero Redirects · Direct Local Downloads</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
          Universal creative media engine for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-cyan-300 to-pink-400">
            free & open stock assets.
          </span>
        </h1>

        {/* 3. Interactive Prompt Bar with Typing Animation */}
        <div
          onClick={handlePhraseClick}
          className="group flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 hover:border-lime-400/60 hover:shadow-[0_0_25px_rgba(163,230,53,0.18)] transition-all cursor-pointer text-xs sm:text-sm text-slate-300 w-full max-w-3xl"
          title="Click to search this query"
        >
          <span className="text-lime-400 font-bold font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/20 flex-shrink-0">
            Prompt
          </span>
          <div className="flex items-center font-mono text-white text-xs sm:text-sm truncate">
            <span className="text-slate-400">Search: </span>
            <span className="text-lime-300 font-semibold ml-1.5 truncate">{displayText}</span>
            <span className="inline-block w-2 h-4 bg-lime-400 ml-1 animate-pulse flex-shrink-0" />
          </div>
          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-lime-400 transition-colors ml-auto flex-shrink-0" />
        </div>
      </div>
    </section>
  );
};
