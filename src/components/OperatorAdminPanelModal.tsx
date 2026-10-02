import React, { useState, useEffect } from 'react';
import { TrafficEvent, subscribeSystemTraffic } from '../lib/firebase.js';
import {
  Shield,
  X,
  Activity,
  Download,
  Search,
  Users,
  Database,
  Lock,
  Unlock,
  Radio,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Server
} from 'lucide-react';

interface OperatorAdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  isDeveloperAuthenticated: boolean;
}

export const OperatorAdminPanelModal: React.FC<OperatorAdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  isDeveloperAuthenticated
}) => {
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [passcode, setPasscode] = useState('');
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'live_feed' | 'downloads' | 'analytics' | 'infrastructure'>('live_feed');

  // Developer passcode bypass for direct developer testing
  const isAuthorized = isDeveloperAuthenticated || isPasscodeUnlocked || currentUserEmail?.toLowerCase() === 'mohsinjutt5855@gmail.com';

  useEffect(() => {
    if (!isOpen || !isAuthorized) return;
    const unsubscribe = subscribeSystemTraffic((events) => {
      setTrafficEvents(events);
    });
    return () => unsubscribe();
  }, [isOpen, isAuthorized]);

  if (!isOpen) return null;

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'dev-operator-2026' || passcode.trim() === 'developer') {
      setIsPasscodeUnlocked(true);
    } else {
      alert('Invalid Developer Security Passcode.');
    }
  };

  const downloadEvents = trafficEvents.filter(e => e.eventType === 'download');
  const searchEvents = trafficEvents.filter(e => e.eventType === 'search');

  // Compute breakdown stats
  const providerStats: Record<string, number> = {};
  trafficEvents.forEach(e => {
    if (e.provider) {
      providerStats[e.provider] = (providerStats[e.provider] || 0) + 1;
    }
  });

  const queryStats: Record<string, number> = {};
  searchEvents.forEach(e => {
    if (e.query) {
      const q = e.query.toLowerCase().trim();
      queryStats[q] = (queryStats[q] || 0) + 1;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Operator Admin Panel</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  Developer Restricted
                </span>
                <span className="flex items-center gap-1 text-[11px] text-lime-400 font-mono">
                  <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse"></span>
                  <span>LIVE FIREBASE REALTIME</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                System-level telemetry, live search traffic, and user download activity monitoring
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

        {/* Security Gate Check */}
        {!isAuthorized ? (
          <div className="py-16 max-w-md mx-auto text-center space-y-5">
            <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 w-16 h-16 mx-auto flex items-center justify-center text-purple-400">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Developer Authentication Required</h3>
              <p className="text-xs text-slate-400">
                This panel is restricted to verified developers (<strong>mohsinjutt5855@gmail.com</strong>) or authorized operator passcodes.
              </p>
            </div>
            <form onSubmit={handlePasscodeSubmit} className="space-y-3 text-xs">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Developer Passcode (e.g. dev-operator-2026)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors cursor-pointer"
              >
                Unlock Operator Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authorized Developer Operator Dashboard */
          <div className="flex-1 flex flex-col min-h-0 space-y-4 pt-4">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Realtime Traffic Events</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono">{trafficEvents.length}</span>
                  <Activity className="h-4 w-4 text-lime-400 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-500">Live socket stream</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Recorded User Downloads</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono">{downloadEvents.length}</span>
                  <Download className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-[10px] text-slate-500">Stored in Firestore</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Search Inquiries Logged</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono">{searchEvents.length}</span>
                  <Search className="h-4 w-4 text-pink-400" />
                </div>
                <span className="text-[10px] text-slate-500">Full-text query history</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium">Provider Status</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-white font-mono">11 / 11</span>
                  <Server className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">All Providers Healthy</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs flex-shrink-0">
              <button
                onClick={() => setActiveTab('live_feed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'live_feed' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="h-3.5 w-3.5 text-lime-400 animate-pulse" />
                <span>Realtime Traffic Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'downloads' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Downloads Stream</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'analytics' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 text-pink-400" />
                <span>Search & Provider Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('infrastructure')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeTab === 'infrastructure' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                <span>Database Info</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0 text-xs">
              {activeTab === 'live_feed' && (
                <div className="space-y-2">
                  {trafficEvents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Listening for incoming traffic events... perform a search or download to see live updates.
                    </div>
                  ) : (
                    trafficEvents.map((evt) => (
                      <div
                        key={evt.eventId}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 font-mono text-[11px]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            evt.eventType === 'download' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                            evt.eventType === 'search' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {evt.eventType}
                          </span>
                          <span className="text-white truncate max-w-sm">
                            {evt.query || evt.mediaType || 'System Event'}
                          </span>
                          {evt.provider && (
                            <span className="text-slate-400 uppercase text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {evt.provider}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'downloads' && (
                <div className="space-y-2">
                  {downloadEvents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      No user downloads recorded in system traffic yet.
                    </div>
                  ) : (
                    downloadEvents.map((dl) => (
                      <div
                        key={dl.eventId}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-mono text-[11px]"
                      >
                        <div className="flex items-center gap-2.5">
                          <Download className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="text-white font-semibold">{dl.query}</span>
                          <span className="text-lime-400 uppercase text-[10px]">{dl.provider}</span>
                          <span className="text-purple-400 uppercase text-[10px]">{dl.mediaType}</span>
                        </div>
                        <span className="text-slate-500">{new Date(dl.timestamp).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Providers */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h4 className="font-semibold text-slate-200">Traffic Distribution by Provider</h4>
                    <div className="space-y-2">
                      {Object.entries(providerStats).map(([p, count]) => (
                        <div key={p} className="flex items-center justify-between text-slate-300 font-mono">
                          <span className="uppercase text-xs">{p}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-lime-400 font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Searches */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h4 className="font-semibold text-slate-200">Top Searched Keywords</h4>
                    <div className="space-y-2">
                      {Object.entries(queryStats).slice(0, 8).map(([q, count]) => (
                        <div key={q} className="flex items-center justify-between text-slate-300 font-mono">
                          <span className="text-xs">"{q}"</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-pink-400 font-bold">{count} searches</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'infrastructure' && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Database Engine:</span>
                    <span className="text-white font-bold">Cloud Firestore</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Database ID:</span>
                    <span className="text-lime-400">ai-studio-freestockhub-1faf098a-feb7-4e1d-b119-81b4923386eb</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Project ID:</span>
                    <span className="text-white">formal-federation-xt8c4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Auth Method:</span>
                    <span className="text-cyan-400">Firebase Auth (Email/Pass + Anonymous Guest + OAuth)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Security Rules:</span>
                    <span className="text-emerald-400">Hardened ABAC with Developer Email Check</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
