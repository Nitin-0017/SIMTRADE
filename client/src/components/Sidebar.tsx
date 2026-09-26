import React from 'react';
import {
  LayoutDashboard,
  CandlestickChart,
  PieChart,
  Receipt,
  Radio,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';

export type NavTab = 'overview' | 'markets' | 'portfolio' | 'activity';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isReplaying: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isReplaying,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: CandlestickChart },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'activity', label: 'Activity', icon: Receipt },
  ];

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[240px] md:w-[220px] shrink-0 bg-[#0B1220] border-r border-[rgba(255,255,255,0.07)] flex flex-col justify-between select-none h-screen transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header with Rising Geometric Logo */}
          <div className="h-18 px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4F7CFF] to-[#8B7CFF] flex items-center justify-center shadow-glow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white font-sans">
                  SIMTRADE
                </div>
                <div className="text-[11px] text-typo-muted font-sans -mt-0.5">
                  Virtual market
                </div>
              </div>
            </div>

            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 rounded-md text-typo-muted hover:text-white hover:bg-[#141E30]"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium font-sans transition-all duration-150 relative ${
                    isActive
                      ? 'bg-[rgba(79,124,255,0.12)] text-white font-semibold'
                      : 'text-typo-secondary hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#4F7CFF] rounded-r" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#4F7CFF]' : 'text-typo-muted'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Bottom: Simulation Status Widget (Section 8) */}
      <div className="p-3.5 m-3 rounded-md bg-[#101827] border border-[rgba(255,255,255,0.06)] space-y-2">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isReplaying ? 'bg-[#35D49A] animate-ping' : 'bg-[#4F7CFF]'}`} />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-sans text-typo-secondary">
            Market Simulation
          </span>
        </div>

        <div className="text-[11px] text-typo-muted font-sans leading-tight">
          Aug 03 — Aug 21, 2026
        </div>

        <div className="pt-2 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between text-[10px] font-sans">
          <span className="flex items-center space-x-1.5 text-[#35D49A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35D49A]" />
            <span>Data connected</span>
          </span>
          <span className="text-typo-muted uppercase text-[9px]">
            {isReplaying ? 'Replay' : 'Standby'}
          </span>
        </div>
      </div>
    </aside>
  </>
  );
};
