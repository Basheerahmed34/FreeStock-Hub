import React, { useState, useRef, useEffect } from 'react';
import { UnifiedAsset, AssetType, LicenseType } from '../types/unified-asset.js';
import {
  Play,
  Pause,
  Bookmark,
  Download,
  Video,
  Sparkles,
  Check,
  ArrowDownToLine,
  ImageOff,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
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
  const [videoError, setVideoError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [triedPreviewAsFallback, setTriedPreviewAsFallback] = useState(false);

  // Safe initial image URL: never empty string ""
  const initialImg = (asset.thumbnail_url?.trim() || asset.preview_url?.trim() || null);
  const [activeImgUrl, setActiveImgUrl] = useState<string | null>(initialImg);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync image URL when asset changes
  useEffect(() => {
    const validUrl = asset.thumbnail_url?.trim() || asset.preview_url?.trim() || null;
    setActiveImgUrl(validUrl);
    setImageError(!validUrl);
    setTriedPreviewAsFallback(false);
    setVideoError(false);
    setVideoLoaded(false);
  }, [asset.asset_id, asset.thumbnail_url, asset.preview_url]);

  const isVideo = asset.asset_type === AssetType.VIDEO;
  const isAudio = asset.asset_type === AssetType.AUDIO || asset.asset_type === AssetType.SOUND_EFFECT;
  const isIcon = asset.asset_type === AssetType.ICON;
  const isVector = asset.asset_type === AssetType.VECTOR || asset.asset_type === AssetType.ILLUSTRATION;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isVideo && videoRef.current && !videoError) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted by browser policy; safe ignore
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Image error handling with fallback cascade (PRD Section 4)
  const handleImageError = () => {
    const previewUrl = asset.preview_url?.trim();
    if (!triedPreviewAsFallback && previewUrl && previewUrl !== activeImgUrl) {
      setTriedPreviewAsFallback(true);
      setActiveImgUrl(previewUrl);
    } else {
      setImageError(true);
      setActiveImgUrl(null);
    }
  };

  // Retry media loading (PRD Section 10)
  const handleRetryMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageError(false);
    setTriedPreviewAsFallback(false);
    setVideoError(false);
    const retryBase = asset.thumbnail_url?.trim() || asset.preview_url?.trim();
    if (retryBase) {
      const sep = retryBase.includes('?') ? '&' : '?';
      setActiveImgUrl(`${retryBase}${sep}retry=${Date.now()}`);
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

  const hasValidVideoUrl = Boolean(asset.preview_url?.trim());

  return (
    <div
      onClick={() => onSelect(asset)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:border-lime-400/50 hover:shadow-[0_0_25px_rgba(163,230,53,0.12)] hover:-translate-y-0.5 cursor-pointer select-none"
    >
      {/* Media Preview Container with fixed aspect ratio to eliminate layout shift (CLS) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {isVideo ? (
          <>
            {!imageError && activeImgUrl ? (
              <img
                src={activeImgUrl}
                alt={asset.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={handleImageError}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  isHovered && videoLoaded && !videoError ? 'opacity-0' : 'opacity-100'
                }`}
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-500">
                <Video className="h-8 w-8 text-slate-600 mb-1" />
                <span className="text-[11px] font-medium text-slate-400">Video Preview</span>
              </div>
            )}

            {/* Video preview with HTML5 metadata preloading and error isolation (PRD Section 3) */}
            {hasValidVideoUrl && !videoError && (
              <video
                ref={videoRef}
                src={asset.preview_url?.trim() || undefined}
                muted
                loop
                playsInline
                preload="metadata"
                onCanPlay={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
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

            {/* Audio Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleAudio?.(asset);
              }}
              className="mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-lime-400 text-slate-950 hover:bg-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.45)] transition-all active:scale-95 cursor-pointer"
              aria-label={isPlayingAudio ? 'Pause preview' : 'Play preview'}
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
            {!imageError && activeImgUrl ? (
              <img
                src={activeImgUrl}
                alt={asset.title}
                onError={handleImageError}
                className="h-16 w-16 object-contain filter invert contrast-200 group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <Sparkles className="h-8 w-8 text-slate-600 mb-1" />
                <span className="text-[10px] text-slate-400 font-mono">SVG Icon</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {!imageError && activeImgUrl ? (
              <img
                src={activeImgUrl}
                alt={asset.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={handleImageError}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              /* High-Design Fallback for Broken Images (PRD Section 4: One broken field must NEVER break the record) */
              <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center border-b border-slate-800">
                <ImageOff className="h-8 w-8 text-slate-600 mb-2" />
                <span className="text-xs font-semibold text-slate-300 line-clamp-1">{asset.title}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Image preview unavailable</span>
                <button
                  type="button"
                  onClick={handleRetryMedia}
                  className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-lime-400 text-[11px] font-medium transition-colors cursor-pointer border border-slate-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Persistent Touch-Friendly Actions on Mobile (PRD Section 13) */}
        <div className="md:hidden absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <button
            onClick={handleSaveClick}
            className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
              isSaved
                ? 'bg-lime-400 text-slate-950 font-bold shadow-[0_0_12px_rgba(163,230,53,0.4)]'
                : 'bg-black/60 text-white border border-white/20'
            }`}
            title={isSaved ? 'Remove from Saved' : 'Save to Collection'}
            aria-label={isSaved ? 'Remove from Saved' : 'Save to Collection'}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleDownloadClick}
            disabled={isDownloading}
            className="p-2 rounded-xl bg-black/60 text-white hover:text-lime-400 border border-white/20 backdrop-blur-md transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Direct Download"
            aria-label="Direct Download"
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

        {/* Floating Quick Action Overlay on Desktop Hover */}
        <div
          className={`hidden md:flex absolute inset-0 bg-gradient-to-t from-slate-950/95 via-black/20 to-black/40 p-3 flex-col justify-between transition-opacity duration-200 ${
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
              aria-label={isSaved ? 'Remove from Saved' : 'Save to Collection'}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="p-2 rounded-xl bg-slate-900/80 text-white hover:text-lime-400 hover:border-lime-400/40 border border-slate-700/60 backdrop-blur-md transition-all cursor-pointer"
              title="Direct Download (No Redirect)"
              aria-label="Direct Download"
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

      {/* Card Info & Complete Preserved Metadata (PRD Section 2) */}
      <div className="flex flex-col flex-1 p-3.5">
        <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-lime-300 transition-colors">
          {asset.title || 'Untitled Creative Work'}
        </h3>

        {/* Clean Typographic Metadata */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="capitalize font-medium text-slate-300">{asset.provider}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="truncate max-w-[120px]" title={asset.author_name}>{asset.author_name || 'Open Creator'}</span>
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
