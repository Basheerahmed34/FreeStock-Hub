import React from 'react';
import { X, ShieldCheck, AlertTriangle, Scale, CheckCircle2, HelpCircle } from 'lucide-react';
import { LicenseType } from '../types/unified-asset.js';

interface LicenseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseGuideModal: React.FC<LicenseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const licenseDefinitions = [
    {
      type: LicenseType.CC0,
      title: 'Creative Commons Zero (CC0 1.0)',
      badge: 'Public Domain Dedication',
      badgeColor: 'text-emerald-400',
      commercial: 'Permitted',
      attribution: 'Not Required (Appreciated)',
      modifications: 'Permitted',
      description: 'The creator has dedicated the work to the worldwide public domain, waiving all copyright rights to the fullest extent allowed by law.'
    },
    {
      type: LicenseType.PUBLIC_DOMAIN,
      title: 'Public Domain Mark',
      badge: 'Free of Copyright',
      badgeColor: 'text-emerald-400',
      commercial: 'Permitted',
      attribution: 'Not Legally Required',
      modifications: 'Permitted',
      description: 'Works whose copyright has expired or government works (such as NASA imagery and historical archives) that are free of known copyright restrictions.'
    },
    {
      type: LicenseType.FREE,
      title: 'Custom Platform License (Unsplash, Pexels, Pixabay)',
      badge: 'Free Commercial Use',
      badgeColor: 'text-cyan-400',
      commercial: 'Permitted',
      attribution: 'Not Required (Recommended)',
      modifications: 'Permitted',
      description: 'Allows broad personal and commercial creative use without fees. However, platforms strictly prohibit compiling and selling unaltered copies as standalone wallpaper or stock packs.'
    },
    {
      type: LicenseType.CC_BY,
      title: 'Creative Commons Attribution (CC BY 4.0)',
      badge: 'Attribution Mandatory',
      badgeColor: 'text-blue-400',
      commercial: 'Permitted',
      attribution: 'Mandatory (TASL Standard)',
      modifications: 'Permitted',
      description: 'Permits commercial redistribution and modification provided you credit the author, link to the license, and specify if modifications were made.'
    },
    {
      type: LicenseType.CC_BY_SA,
      title: 'Creative Commons ShareAlike (CC BY-SA 4.0)',
      badge: 'Copyleft Sharing',
      badgeColor: 'text-indigo-400',
      commercial: 'Permitted with ShareAlike',
      attribution: 'Mandatory',
      modifications: 'Must share adaptations under same license',
      description: 'Common on Wikimedia Commons. If you remix, transform, or build upon the material, you must distribute your contributions under the exact same license.'
    },
    {
      type: LicenseType.CHECK_LICENSE,
      title: 'Check Source License',
      badge: 'Verification Required',
      badgeColor: 'text-amber-400',
      commercial: 'Verify with Source',
      attribution: 'Likely Required',
      modifications: 'Verify with Source',
      description: 'FreeStock Hub strict legal rule: Applied when the origin license contains proprietary terms, editorial-only flags, or non-standard community clauses. Inspect the source landing page before broadcast.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2 min-w-0 mr-2">
            <Scale className="h-5 w-5 text-cyan-400 flex-shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold text-white truncate">License Clarity & Compliance Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 flex-shrink-0 transition-colors"
            aria-label="Close license guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 sm:p-4 rounded-xl border border-slate-800">
            FreeStock Hub enforces the <strong>Anti-Ambiguity License Standard</strong>. We never label an asset as "Free" or "Commercial" if the license is uncertain. Always ensure compliance with the terms below.
          </p>

          <div className="space-y-3.5 sm:space-y-4">
            {licenseDefinitions.map((item) => (
              <div
                key={item.type}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:p-4 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <span className={`font-mono text-[11px] sm:text-xs ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">{item.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Commercial:</span>
                    <span className="text-slate-200">{item.commercial}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Attribution:</span>
                    <span className="text-slate-200">{item.attribution}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Modifications:</span>
                    <span className="text-slate-200">{item.modifications}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-4 sm:px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
