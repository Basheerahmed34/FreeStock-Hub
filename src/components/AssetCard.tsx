import React, { useState, useRef } from 'react';
import { UnifiedAsset, AssetType, LicenseType } from '../types/unified-asset.js';
import { Play, Pause, Bookmark, Download, Video, Sparkles, Check, ArrowDownToLine } from 'lucide-react';
import { downloadAssetDirectly } from '../lib/download-helper.js';

interface AssetCardProps {
  asset: UnifiedAsset;
  onSelect: (asset: UnifiedAsset) => void;
  isSaved: boolean;
  onToggleSave: (asset: UnifiedAsset) => void;
  onQuickDownload: (asset: UnifiedAsset) => void;
  isPlayingAudio?: boolean;
  onToggleAudio?: (asset: UnifiedAsset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onSelect,
  isSaved,
  onToggleSave,
  onQuickDownload,
  isPlayingAudio = false,
  onToggleAudio
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = asset.asset_type === AssetType.VIDEO;
  const isAudio = asset.asset_type === AssetType.AUDIO || asset.asset_type === AssetType.SOUND_EFFECT;
  const isIcon = asset.asset_type === AssetType.ICON;
  const isVector = asset.asset_type === AssetType.VECTOR || asset.asset_type === AssetType.ILLUSTRATION;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Direct download with zero external redirection
  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await downloadAssetDirectly(asset);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(asset);
  };

  const formatLicenseDisplay = (lic: LicenseType | string) => {
    if (lic === LicenseType.CC0) return 'CC0 Public Domain';
    if (lic === LicenseType.PUBLIC_DOMAIN) return 'Public Domain';
    if (lic === LicenseType.FREE) return 'Free Commercial';
    if (lic === LicenseType.CC_BY) return 'CC BY 4.0';
    if (lic === LicenseType.CC_BY_SA) return 'CC BY-SA 4.0';
    if (lic === LicenseType.CHECK_LICENSE) return 'Check License';
    return String(lic);
  };

  return (
    <div
      onClick={() => onSelect(asset)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:border-lime-400/50 hover:shadow-[0_0_25px_rgba(163,230,53,0.12)] hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Media Preview Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {isVideo ? (
          <>
            <img
              src={asset.thumbnail_url}
              alt={asset.title}
              referrerPolicy="no-referrer"
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                isHovered && videoLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {asset.preview_url?.endsWith('.mp4') && (
              <video
                ref={videoRef}
                src={asset.preview_url}
                muted
                loop
                playsInline
                onCanPlay={() => setVideoLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium text-white border border-white/10">
              <Video className="h-3 w-3 text-lime-400" />
              <span>{asset.duration ? `${asset.duration}s` : 'HD Video'}</span>
            </div>
          </>
        ) : isAudio ? (
          <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
            {/* Waveform representation */}
            <div className="flex items-center gap-1 h-12 w-full justify-center opacity-80">
              {[40, 70, 30, 90, 60, 100, 45, 80, 50, 75, 95, 40, 85, 60, 30].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`w-1.5 rounded-full transition-all duration-300 ${
                    isPlayingAudio ? 'bg-lime-400 animate-pulse' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Gen Z Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAudio?.(asset);
              }}
              className="mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-lime-400 text-slate-950 hover:bg-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.45)] transition-all active:scale-95 cursor-pointer"
            >
              {isPlayingAudio ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            <span className="mt-2 text-[11px] text-slate-400 font-mono">
              {asset.duration ? `${asset.duration}s audio track` : 'Audio clip'}
            </span>
          </div>
        ) : isIcon ? (
          <div className="h-full w-full flex items-center justify-center p-8 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:14px_14px]">
            <img
              src={asset.preview_url}
              alt={asset.title}
              className="h-16 w-16 object-contain filter invert contrast-200 group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        ) : (
          <img
            src={asset.thumbnail_url}
            alt={asset.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Floating Quick Action Overlay on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-slate-950/95 via-black/20 to-black/40 p-3 flex flex-col justify-between transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex justify-end gap-1.5">
            <button
              onClick={handleSaveClick}
              className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                isSaved
                  ? 'bg-lime-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(163,230,53,0.4)]'
                  : 'bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700/60'
              }`}
              title={isSaved ? 'Remove from Saved' : 'Save to Collection'}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="p-2 rounded-xl bg-slate-900/80 text-white hover:text-lime-400 hover:border-lime-400/40 border border-slate-700/60 backdrop-blur-md transition-all cursor-pointer"
              title="Direct Download (No Redirect)"
            >
              {downloadSuccess ? (
                <Check className="h-3.5 w-3.5 text-lime-400" />
              ) : isDownloading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-lime-400 border-t-transparent" />
              ) : (
                <ArrowDownToLine className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-white">
            <span className="font-mono text-[11px] text-slate-300">
              {asset.width && asset.height ? `${asset.width}×${asset.height}` : asset.file_type?.toUpperCase()}
            </span>
            <span className="text-[11px] font-semibold text-lime-300 underline underline-offset-4">
              Inspect Asset
            </span>
          </div>
        </div>
      </div>

      {/* Card Info & Clean Metadata */}
      <div className="flex flex-col flex-1 p-3.5">
        <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-lime-300 transition-colors">
          {asset.title}
        </h3>

        {/* Clean Unboxed Metadata with Typographic Separators */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="capitalize font-medium text-slate-300">{asset.provider}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="truncate max-w-[120px]">{asset.author_name}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className={`text-[11px] font-medium ${
            asset.license_name === LicenseType.CHECK_LICENSE ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {formatLicenseDisplay(asset.license_name)}
          </span>
        </div>
      </div>
    </div>
  );
};
