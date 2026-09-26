import React, { useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface SimulationTimelineProps {
  timestamps: string[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  replaySpeed: number;
  setReplaySpeed: (speed: number) => void;
}

const INTERVAL_LABELS = [
  '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'
];

export const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
  timestamps,
  currentIndex,
  onSelectIndex,
  isPlaying,
  setIsPlaying,
  replaySpeed,
  setReplaySpeed
}) => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1500 / replaySpeed);
      timerRef.current = window.setInterval(() => {
        if (currentIndex < timestamps.length - 1) {
          onSelectIndex(currentIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIndex, timestamps.length, replaySpeed, onSelectIndex, setIsPlaying]);

  const currentDayIndex = Math.floor(currentIndex / 13);
  const currentSlotIndex = currentIndex % 13;

  const uniqueDates = Array.from(
    new Set(
      timestamps.map((t) => {
        const d = new Date(t);
        return d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit' });
      })
    )
  );

  const handleSelectDay = (dayIdx: number) => {
    const newIdx = dayIdx * 13 + currentSlotIndex;
    if (newIdx < timestamps.length) {
      onSelectIndex(newIdx);
    }
  };

  const handleSelectSlot = (slotIdx: number) => {
    const newIdx = currentDayIndex * 13 + slotIdx;
    if (newIdx < timestamps.length) {
      onSelectIndex(newIdx);
    }
  };

  const currentTs = timestamps[currentIndex] || '';
  const currentD = currentTs ? new Date(currentTs) : new Date();

  return (
    <div className="border-t border-[rgba(255,255,255,0.07)] bg-[#0B1220]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 select-none z-10 shadow-2xl">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-sans">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? 'bg-[#35D49A] animate-ping' : 'bg-[#4F7CFF]'
              }`}
            />
            <span className="font-semibold text-white tracking-wide text-[11px] sm:text-xs">
              {isPlaying ? 'REPLAYING' : 'PAUSED'}
            </span>
          </div>
          <span className="text-typo-muted">•</span>
          <span className="text-typo-secondary text-[11px] sm:text-xs">
            {currentD.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric' })}
          </span>
          <span className="text-typo-muted">·</span>
          <span className="font-mono text-white font-medium text-[11px] sm:text-xs">
            {currentD.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>

        {/* Date Selector Chips */}
        <div className="hidden lg:flex items-center space-x-1 overflow-x-auto scrollbar-none text-xs font-sans">
          {uniqueDates.map((dateStr, idx) => {
            const isSelected = idx === currentDayIndex;
            return (
              <button
                key={dateStr}
                onClick={() => handleSelectDay(idx)}
                className={`px-2 py-0.5 rounded text-xs transition-colors relative ${
                  isSelected
                    ? 'text-white font-semibold'
                    : 'text-typo-muted hover:text-typo-secondary'
                }`}
              >
                <span>{dateStr}</span>
                {isSelected && (
                  <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#4F7CFF] rounded-full shadow-glow-sm" />
                )}
              </button>
            );
          })}
        </div>

        {/* Speed Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-typo-muted font-sans hidden sm:inline">Speed</span>
          <div className="flex items-center bg-[#101827] border border-[rgba(255,255,255,0.07)] rounded-md p-0.5">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setReplaySpeed(spd)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                  replaySpeed === spd
                    ? 'bg-[#4F7CFF] text-white font-bold shadow-sm'
                    : 'text-typo-muted hover:text-white'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Timeline Track & Play Controls */}
      <div className="pt-2.5 flex items-center justify-between gap-6">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onSelectIndex(0)}
            title="Reset to Day 1"
            className="p-1.5 text-typo-muted hover:text-white hover:bg-[#141E30] rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => currentIndex > 0 && onSelectIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
            title="Previous interval (-30m)"
            className="p-1.5 text-typo-secondary hover:text-white hover:bg-[#141E30] disabled:opacity-30 rounded-md transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`h-8 px-4 rounded-md text-xs font-sans font-semibold flex items-center space-x-1.5 transition-all duration-150 ${
              isPlaying
                ? 'bg-[#F4B860] text-black font-bold'
                : 'bg-gradient-to-r from-[#4F7CFF] to-[#6C63FF] text-white hover:brightness-110 shadow-glow-sm'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Replay</span>
              </>
            )}
          </button>

          <button
            onClick={() => currentIndex < timestamps.length - 1 && onSelectIndex(currentIndex + 1)}
            disabled={currentIndex >= timestamps.length - 1}
            title="Next interval (+30m)"
            className="p-1.5 text-typo-secondary hover:text-white hover:bg-[#141E30] disabled:opacity-30 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 13 Intervals Continuous Track */}
        <div className="flex-1 flex items-center space-x-1 overflow-x-auto scrollbar-none py-1">
          {INTERVAL_LABELS.map((timeLabel, sIdx) => {
            const isSlotActive = sIdx === currentSlotIndex;
            return (
              <button
                key={timeLabel}
                onClick={() => handleSelectSlot(sIdx)}
                className="flex-1 min-w-[50px] py-1 flex flex-col items-center group transition-colors"
              >
                <span
                  className={`text-[11px] font-mono tnum transition-colors ${
                    isSlotActive
                      ? 'text-[#4F7CFF] font-bold'
                      : 'text-typo-muted group-hover:text-typo-secondary'
                  }`}
                >
                  {timeLabel}
                </span>
                <div className="w-full flex items-center justify-center mt-1.5">
                  <div
                    className={`h-[3px] rounded-full transition-all duration-150 ${
                      isSlotActive
                        ? 'w-full bg-[#4F7CFF] shadow-glow-sm'
                        : 'w-2 bg-[rgba(255,255,255,0.12)] group-hover:bg-[rgba(255,255,255,0.3)]'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
