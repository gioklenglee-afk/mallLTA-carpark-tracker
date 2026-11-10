import React from 'react';
import { RefreshCw, Code2, Calculator } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenBackendModal: () => void;
  onOpenFeeEstimator: () => void;
  onSelectNavFilter: (filter: 'all' | 'HDB' | 'MALL' | 'URA') => void;
  activeFilter: string;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  onOpenBackendModal,
  onOpenFeeEstimator,
  onSelectNavFilter,
  activeFilter,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-slate-800 transition-colors"
        >
          SG ParkPulse
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => onSelectNavFilter('all')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeFilter === 'all' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          All Lots
        </button>
        <button
          onClick={() => onSelectNavFilter('HDB')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeFilter === 'HDB' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          HDB Estates
        </button>
        <button
          onClick={() => onSelectNavFilter('MALL')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeFilter === 'MALL' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          Shopping Malls
        </button>
        <button
          onClick={() => onSelectNavFilter('URA')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeFilter === 'URA' ? 'text-slate-900 font-semibold' : ''
          }`}
        >
          URA Central
        </button>
        <button
          onClick={onOpenFeeEstimator}
          className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 text-slate-600"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Fee Calculator</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenBackendModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="Connect live API / View Backend Schema"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Backend Hook</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Real-Time Lots</span>
        </button>
      </div>
    </header>
  );
};
