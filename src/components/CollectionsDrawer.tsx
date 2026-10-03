import React, { useState, useRef } from 'react';
import { UnifiedAsset } from '../types/unified-asset.js';
import {
  X,
  Trash2,
  Download,
  Share2,
  Copy,
  Check,
  FileSpreadsheet,
  FileJson,
  Upload,
  Bookmark,
  ExternalLink,
  Sparkles,
  Link,
  FileText
} from 'lucide-react';
import { generateAttributions } from '../lib/attribution.js';
import { downloadCurationJson, createShareableLink } from '../lib/curation-export.js';

interface CollectionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedAssets: UnifiedAsset[];
  onRemoveAsset: (id: string) => void;
  onSelectAsset: (asset: UnifiedAsset) => void;
  onImportAssets?: (assets: UnifiedAsset[]) => void;
  onClearAll?: () => void;
}

export const CollectionsDrawer: React.FC<CollectionsDrawerProps> = ({
  isOpen,
  onClose,
  savedAssets,
  onRemoveAsset,
  onSelectAsset,
  onImportAssets,
  onClearAll
}) => {
  const [activeTab, setActiveTab] = useState<'assets' | 'share' | 'import'>('assets');
  const [collectionTitle, setCollectionTitle] = useState('My Creative Stock Curation');
  const [collectionDescription, setCollectionDescription] = useState('Curated collection of openly licensed creative media.');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportCsv = () => {
    if (savedAssets.length === 0) return;
    const headers = ['Title', 'Provider', 'Asset Type', 'Author', 'License', 'Source URL', 'Download URL', 'Attribution Markdown'];
    const rows = savedAssets.map((asset) => {
      const attr = generateAttributions(asset);
      return [
        `"${asset.title.replace(/"/g, '""')}"`,
        `"${asset.provider}"`,
        `"${asset.asset_type}"`,
        `"${asset.author_name.replace(/"/g, '""')}"`,
        `"${asset.license_name}"`,
        `"${asset.source_url}"`,
        `"${asset.download_url}"`,
        `"${attr.markdown.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const dateSlug = new Date().toISOString().split('T')[0];
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `freestock-collection-${dateSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    if (savedAssets.length === 0) return;
    downloadCurationJson(savedAssets, collectionTitle);
  };

  const handleGenerateShareLink = async () => {
    if (savedAssets.length === 0) return;
    setIsGeneratingLink(true);
    try {
      const res = await createShareableLink(savedAssets, collectionTitle, collectionDescription);
      setShareableUrl(res.shareUrl);
    } catch (err) {
      console.error('Failed to create shareable link:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMarkdownAttributions = () => {
    if (savedAssets.length === 0) return;
    const markdown = savedAssets
      .map((a, i) => {
        const attr = generateAttributions(a);
        return `${i + 1}. ${attr.markdown}`;
      })
      .join('\n');
    navigator.clipboard.writeText(markdown);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let importedAssets: UnifiedAsset[] = [];
        if (Array.isArray(parsed)) {
          importedAssets = parsed;
        } else if (parsed.assets && Array.isArray(parsed.assets)) {
          importedAssets = parsed.assets;
          if (parsed.title) {
            setCollectionTitle(parsed.title);
          }
        }

        if (importedAssets.length > 0) {
          onImportAssets?.(importedAssets);
          setImportStatus({
            message: `Successfully imported ${importedAssets.length} assets from curation file!`,
            type: 'success'
          });
          setTimeout(() => {
            setActiveTab('assets');
            setImportStatus(null);
          }, 1800);
        } else {
          setImportStatus({
            message: 'No valid assets found in the uploaded JSON file.',
            type: 'error'
          });
        }
      } catch (err) {
        setImportStatus({
          message: 'Invalid JSON format. Please ensure the file was exported from FreeStock Hub.',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-lg border-l border-slate-800 bg-slate-900 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-5 py-3.5 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 mr-2">
              <Bookmark className="h-4 w-4 text-cyan-400 fill-current flex-shrink-0" />
              <h2 className="text-xs sm:text-sm font-semibold text-white truncate">Curation History & Collections</h2>
              <span className="font-mono text-xs text-slate-400 flex-shrink-0">
                ({savedAssets.length})
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
              aria-label="Close collections drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-2 sm:px-4 text-xs font-medium overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'assets'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span>Saved Assets</span>
              <span className="text-[11px] font-mono opacity-80">({savedAssets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('share')}
              className={`px-3 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'share'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share & Export</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'import'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import Curation</span>
            </button>
          </div>

          {/* Tab 1: Saved Assets List */}
          {activeTab === 'assets' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Quick Actions Header */}
              {savedAssets.length > 0 && (
                <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-5 py-2.5 text-xs text-slate-400">
                  <span>{savedAssets.length} items saved locally</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('share')}
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      <Share2 className="h-3 w-3" />
                      <span>Export / Share</span>
                    </button>
                    {onClearAll && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <button
                          onClick={onClearAll}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          Clear All
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Assets Scroll View */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {savedAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-72 text-center text-slate-500">
                    <Bookmark className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-slate-300">No saved assets yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Click the bookmark icon on any asset while searching to save items to your personal curation history.
                    </p>
                    <button
                      onClick={() => setActiveTab('import')}
                      className="mt-4 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      Or import a past curation JSON
                    </button>
                  </div>
                ) : (
                  savedAssets.map((asset) => (
                    <div
                      key={asset.asset_id}
                      onClick={() => onSelectAsset(asset)}
                      className="group flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      {asset.thumbnail_url?.trim() ? (
                        <img
                          src={asset.thumbnail_url.trim()}
                          alt={asset.title}
                          referrerPolicy="no-referrer"
                          className="h-14 w-14 rounded-lg object-cover flex-shrink-0 bg-slate-900 border border-slate-800"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-900 border border-slate-800 text-slate-500">
                          <Bookmark className="h-5 w-5 text-lime-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                          {asset.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="capitalize text-slate-300">{asset.provider}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="truncate">{asset.author_name}</span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="font-mono text-[10px] text-cyan-300">{asset.license_name}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveAsset(asset.asset_id);
                        }}
                        className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                        title="Remove from saved"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Shareable Link & JSON Export */}
          {activeTab === 'share' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Collection Metadata Editor */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Collection Title
                </label>
                <input
                  type="text"
                  value={collectionTitle}
                  onChange={(e) => {
                    setCollectionTitle(e.target.value);
                    setShareableUrl(null);
                  }}
                  placeholder="e.g. Brand Refresh Video & Audio Assets"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* 1. Shareable Link Generator */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-semibold text-white">Shareable Web Link</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {savedAssets.length} assets
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate a direct link that anyone can open to inspect, download, or save this curated media collection.
                </p>

                {shareableUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareableUrl}
                        className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-xs text-cyan-300 select-all focus:outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 transition-colors whitespace-nowrap"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Link ready to share with your team or community.</span>
                      <a
                        href={shareableUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateShareLink}
                    disabled={isGeneratingLink || savedAssets.length === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-medium transition-colors"
                  >
                    {isGeneratingLink ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Generating Link...</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Generate Shareable Link</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 2. JSON Curation File Export */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-white">Curation History (JSON)</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Complete Schema</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Export a normalized JSON file with full asset specifications, download endpoints, author links, and license citations for local backups or programmatic re-importing.
                </p>

                <button
                  onClick={handleDownloadJson}
                  disabled={savedAssets.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-medium transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download Curation JSON File</span>
                </button>
              </div>

              {/* 3. CSV & Markdown Citations */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-semibold text-white">Spreadsheet & Attribution Doc</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleExportCsv}
                    disabled={savedAssets.length === 0}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-200 px-3 py-2 text-xs transition-colors"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={handleCopyMarkdownAttributions}
                    disabled={savedAssets.length === 0}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-200 px-3 py-2 text-xs transition-colors"
                  >
                    {copiedMarkdown ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Import Curation */}
          {activeTab === 'import' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center text-cyan-400 border border-slate-800">
                  <Upload className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-semibold text-white">Import Saved Curation File</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Select a <code>.json</code> curation file previously exported from FreeStock Hub to restore your saved assets and citations.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 transition-colors"
                >
                  <FileJson className="h-4 w-4" />
                  <span>Choose JSON File</span>
                </button>
              </div>

              {importStatus && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    importStatus.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  {importStatus.message}
                </div>
              )}

              <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-800/80 pt-4">
                <strong>Format Compatibility:</strong> Accepts both FreeStock Hub curation manifest files and raw JSON arrays conforming to the <code>UnifiedAsset[]</code> specification.
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="border-t border-slate-800 bg-slate-950/80 px-5 py-3 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">FreeStock Hub Curation Engine</span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
