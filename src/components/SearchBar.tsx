import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Flame, Loader2, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const TRENDING_TAGS = [
  { label: 'nature', color: 'hover:text-lime-400' },
  { label: 'car', color: 'hover:text-amber-400' },
  { label: 'sunset', color: 'hover:text-pink-400' },
  { label: 'cinematic', color: 'hover:text-cyan-400' },
  { label: 'business', color: 'hover:text-blue-400' },
  { label: 'technology', color: 'hover:text-violet-400' },
  { label: 'whoosh', color: 'hover:text-emerald-400' },
  { label: 'foley', color: 'hover:text-sky-400' },
  { label: 'music', color: 'hover:text-rose-400' },
  { label: 'vector', color: 'hover:text-amber-300' },
  { label: 'icon', color: 'hover:text-teal-400' }
];

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  onSearch,
  isLoading
}) => {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserTypingRef = useRef(false);

  // Sync initialQuery into local state when not actively being typed by user
  useEffect(() => {
    if (!isUserTypingRef.current && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Global shortcut (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    isUserTypingRef.current = true;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 300ms debounce as required in PRD Section 1 & 21
    debounceTimerRef.current = setTimeout(() => {
      isUserTypingRef.current = false;
      onSearch(val.trim());
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    isUserTypingRef.current = false;
    onSearch(query.trim());
  };

  const handleTagClick = (tag: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    isUserTypingRef.current = false;
    setQuery(tag);
    onSearch(tag);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    isUserTypingRef.current = false;
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative w-full group">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4 text-slate-400 group-focus-within:text-lime-400 transition-colors">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-lime-400" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => {
              isUserTypingRef.current = true;
            }}
            onBlur={() => {
              isUserTypingRef.current = false;
            }}
            placeholder="Search free photos, 4K videos, audio, icons..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/95 py-3.5 sm:py-4 pl-10 sm:pl-12 pr-24 sm:pr-32 text-sm sm:text-base text-white placeholder-slate-500 shadow-inner focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:shadow-[0_0_25px_rgba(163,230,53,0.18)] transition-all"
          />
          <div className="absolute inset-y-0 right-2 sm:right-2.5 flex items-center gap-1 sm:gap-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 sm:p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-lime-400 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-slate-950 hover:bg-lime-300 hover:shadow-[0_0_15px_rgba(163,230,53,0.4)] disabled:opacity-50 transition-all cursor-pointer active:scale-95"
            >
              {isLoading ? (
                <>
                  <span className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span className="hidden sm:inline">Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Trending Keywords Row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          <Flame className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" />
          <span className="hidden sm:inline">Trending:</span>
        </span>
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => handleTagClick(tag.label)}
            className={`text-slate-400 ${tag.color} transition-colors cursor-pointer text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700`}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};
