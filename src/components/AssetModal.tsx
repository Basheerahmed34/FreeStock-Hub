import React, { useState } from 'react';
import { UnifiedAsset, AssetType, LicenseType } from '../types/unified-asset.js';
import { generateAttributions } from '../lib/attribution.js';
import { downloadAssetDirectly } from '../lib/download-helper.js';
import {
  X,
  Download,
  Bookmark,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Code,
  FileText,
  Sparkles,
  ArrowDownToLine
} from 'lucide-react';

interface AssetModalProps {
  asset: UnifiedAsset;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (asset: UnifiedAsset) => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  asset,
  onClose,
  isSaved,
  onToggleSave
}) => {
  const [activeAttributionTab, setActiveAttributionTab] = useState<'plain' | 'markdown' | 'html' | 'tasl'>('markdown');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showSvgCode, setShowSvgCode] = useState(false);
  const [rawSvg, setRawSvg] = useState<string>('');

  const attributions = generateAttributions(asset);

  const isVideo = asset.asset_type === AssetType.VIDEO;
  const isAudio = asset.asset_type === AssetType.AUDIO || asset.asset_type === AssetType.SOUND_EFFECT;
  const isIcon = asset.asset_type === AssetType.ICON;
  const isVector = asset.asset_type === AssetType.VECTOR || asset.asset_type === AssetType.ILLUSTRATION;

  const handleCopyAttribution = () => {
    const textToCopy = attributions[activeAttributionTab];
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct download with zero external redirection
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAssetDirectly(asset);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewSvg = async () => {
    if (!rawSvg) {
      try {
        const res = await fetch(asset.download_url || asset.preview_url);
        const text = await res.text();
        setRawSvg(text);
      } catch {
        setRawSvg('<svg><!-- Unable to load raw SVG text --></svg>');
      }
    }
    setShowSvgCode(!showSvgCode);
  };

  const isLicenseAmbiguous = asset.license_name === LicenseType.CHECK_LICENSE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl rounded-3xl border border-slate-800 bg-[#0a0e1c] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Gen Z accent */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white truncate max-w-md sm:max-w-xl">
              {asset.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(asset)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-lime-400 text-slate-950 shadow-[0_0_12px_rgba(163,230,53,0.35)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Media Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center min-h-[260px] max-h-[480px]">
            {isVideo ? (
              <video
                src={asset.preview_url}
                controls
                autoPlay
                className="max-h-[460px] w-full object-contain"
              />
            ) : isAudio ? (
              <div className="w-full p-8 flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-white font-medium text-center">{asset.title}</h3>
                <audio
                  src={asset.preview_url}
                  controls
                  autoPlay
                  className="w-full max-w-md accent-lime-400"
                />
              </div>
            ) : isIcon || isVector ? (
              <div className="w-full p-12 flex flex-col items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                <img
                  src={asset.preview_url}
                  alt={asset.title}
                  className="max-h-56 max-w-56 object-contain filter invert contrast-200"
                />
                <button
                  onClick={handleViewSvg}
                  className="mt-6 flex items-center gap-1.5 text-xs text-lime-400 hover:text-lime-300 font-semibold cursor-pointer"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>{showSvgCode ? 'Hide Raw SVG XML' : 'Inspect Raw SVG XML'}</span>
                </button>
              </div>
            ) : (
              <img
                src={asset.preview_url || asset.thumbnail_url}
                alt={asset.title}
                referrerPolicy="no-referrer"
                className="max-h-[460px] w-full object-contain"
              />
            )}
          </div>

          {/* SVG Code Inspector Drawer */}
          {showSvgCode && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Scalable Vector Graphics (SVG) Source</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(rawSvg);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-lime-400 hover:text-lime-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copied ? 'Copied XML!' : 'Copy SVG XML'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-300 max-h-40 overflow-x-auto p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                {rawSvg || 'Loading SVG XML content...'}
              </pre>
            </div>
          )}

          {/* Details & Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-800/80 rounded-2xl p-4 bg-slate-950/50">
            <div>
              <span className="text-slate-500 block">Provider</span>
              <span className="text-white font-semibold capitalize">{asset.provider}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Creator / Author</span>
              {asset.author_url ? (
                <a
                  href={asset.author_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lime-400 hover:underline truncate block font-medium"
                >
                  {asset.author_name}
                </a>
              ) : (
                <span className="text-white font-medium truncate block">{asset.author_name}</span>
              )}
            </div>
            <div>
              <span className="text-slate-500 block">Resolution / Type</span>
              <span className="text-white font-mono font-medium">
                {asset.width && asset.height
                  ? `${asset.width} × ${asset.height} (${asset.file_type?.toUpperCase()})`
                  : asset.file_type?.toUpperCase() || 'Digital Media'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Original Source</span>
              <a
                href={asset.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Provider Page</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Legal Clarity & License Verification Card */}
          <div
            className={`rounded-2xl border p-4 text-xs space-y-2.5 ${
              isLicenseAmbiguous
                ? 'border-amber-500/40 bg-amber-500/5 text-amber-200'
                : 'border-lime-500/40 bg-lime-500/5 text-lime-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm">
                {isLicenseAmbiguous ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400">License Verification Required</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-lime-400" />
                    <span className="text-lime-400">Verified Open License: {String(asset.license_name)}</span>
                  </>
                )}
              </div>
              {asset.license_url && (
                <a
                  href={asset.license_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-xs"
                >
                  <span>License Deed</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed">
              {isLicenseAmbiguous
                ? 'FreeStock Hub strict legal policy: Because this asset originates from an external community source with custom terms, verify the official source page before commercial redistribution or broadcast.'
                : asset.attribution_required
                ? `Commercial and personal creative use is permitted with mandatory author attribution given to ${asset.author_name} as generated below.`
                : 'Free for commercial and personal creative projects. Attribution is appreciated per community norms.'}
            </p>
          </div>

          {/* TASL Creative Commons Attribution Generator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-lime-400" />
                Attribution Generator (TASL Creative Commons Standard)
              </span>

              {/* Format Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {(['markdown', 'html', 'plain', 'tasl'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAttributionTab(tab)}
                    className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                      activeAttributionTab === tab
                        ? 'bg-slate-800 text-lime-400 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-mono text-xs text-slate-300 break-all pr-20 select-all leading-relaxed">
                {attributions[activeAttributionTab]}
              </p>
              <button
                onClick={handleCopyAttribution}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-lime-400" />
                    <span className="text-lime-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-lime-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Direct Download Bar */}
        <div className="border-t border-slate-800 bg-slate-950/90 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span className="text-lime-400 font-medium">Direct In-App Download</span>
            <span aria-hidden="true" className="mx-2">·</span>
            <span>No redirection off-site</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-lime-300 hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] disabled:opacity-50 transition-all cursor-pointer active:scale-95"
            >
              {downloadSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>File Downloaded Directly!</span>
                </>
              ) : isDownloading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Downloading Directly...</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4" />
                  <span>Direct Download Asset</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
