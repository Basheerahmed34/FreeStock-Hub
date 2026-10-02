import React, { useState } from 'react';
import { DownloadRecord } from '../lib/firebase.js';
import { downloadAssetDirectly } from '../lib/download-helper.js';
import {
  X,
  Download,
  History,
  Clock,
  ExternalLink,
  CheckCircle2,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { UnifiedAsset } from '../types/unified-asset.js';

interface UserDownloadHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadRecord[];
  totalCount: number;
}

export const UserDownloadHistoryModal: React.FC<UserDownloadHistoryModalProps> = ({
  isOpen,
  onClose,
  downloads,
  totalCount
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filtered = filterType === 'ALL'
    ? downloads
    : downloads.filter(d => d.assetType === filterType);

  const handleReDownload = async (record: DownloadRecord) => {
    // Construct asset shape for direct download
    const mockAsset: Partial<UnifiedAsset> = {
      asset_id: record.assetId,
      provider: record.provider,
      asset_type: record.assetType as any,
      title: record.title,
      download_url: record.downloadUrl,
      preview_url: record.downloadUrl,
      file_type: record.fileType
    };
    await downloadAssetDirectly(mockAsset as UnifiedAsset);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-4 w-4 text-pink-400" />;
      case 'AUDIO':
      case 'SOUND_EFFECT': return <Music className="h-4 w-4 text-violet-400" />;
      case 'ICON': return <Sparkles className="h-4 w-4 text-emerald-400" />;
      default: return <ImageIcon className="h-4 w-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <History className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Your Past Download History</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 font-bold">
                  {totalCount} Total Downloads
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time Firebase synchronized log of all assets downloaded from open stock platforms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0 text-xs">
          {['ALL', 'PHOTO', 'VIDEO', 'AUDIO', 'SOUND_EFFECT', 'ICON', 'VECTOR'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-lime-400 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Download Items List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Download className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">No past downloads recorded yet.</p>
              <p className="text-xs text-slate-500">
                When you download stock photos, 4K videos, sound effects, or icons, they will be saved here in real-time.
              </p>
            </div>
          ) : (
            filtered.map((record) => (
              <div
                key={record.downloadId}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0">
                    {getIconForType(record.assetType)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-white truncate max-w-md">
                      {record.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="uppercase text-lime-400">{record.provider}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="uppercase">{record.fileType}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={() => handleReDownload(record)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-lime-400 hover:text-slate-950 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    title="Download this file again"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Download Again</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
