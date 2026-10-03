import React, { useRef, useState, useEffect } from 'react';
import { UnifiedAsset } from '../types/unified-asset.js';
import { Play, Pause, X, Volume2, VolumeX, ArrowDownToLine, Check } from 'lucide-react';
import { downloadAssetDirectly } from '../lib/download-helper.js';

interface AudioPlayerBarProps {
  asset: UnifiedAsset | null;
  onClose: () => void;
  onSelectAsset: (asset: UnifiedAsset) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  asset,
  onClose,
  onSelectAsset
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (asset && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [asset]);

  if (!asset) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = async () => {
    await downloadAssetDirectly(asset);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-[#060811]/95 backdrop-blur-xl px-4 py-3 text-white shadow-2xl animate-in slide-in-from-bottom duration-200">
      <audio
        ref={audioRef}
        src={asset.preview_url?.trim() || asset.download_url?.trim() || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        autoPlay
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
        {/* Track Info */}
        <div
          onClick={() => onSelectAsset(asset)}
          className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[120px] sm:max-w-xs cursor-pointer hover:opacity-90"
        >
          <div className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
            {asset.thumbnail_url?.trim() ? (
              <img
                src={asset.thumbnail_url.trim()}
                alt={asset.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lime-400 font-mono text-xs">♪</span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate hover:text-lime-300">{asset.title}</h4>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              <span className="capitalize text-lime-400">{asset.provider}</span>
            </p>
          </div>
        </div>

        {/* Playback Controls & Progress */}
        <div className="flex flex-1 max-w-xl flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-lime-400 text-slate-950 hover:bg-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.4)] transition-transform active:scale-95 cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
              ) : (
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex w-full items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="h-1 w-full flex-1 appearance-none rounded-lg bg-slate-800 accent-lime-400 cursor-pointer"
            />
            <span className="tabular-nums hidden xs:inline">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Direct Download & Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Direct Download Track"
          >
            {downloadSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-lime-400" />
                <span className="text-lime-400 hidden sm:inline">Downloaded</span>
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-3.5 w-3.5 text-lime-400" />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>
          <button
            onClick={toggleMute}
            className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close audio player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
