import { useRef, useCallback } from 'react';
import { minutesToTime, timeToMinutes } from '@/hooks/use-time-filter';

interface TimeRangeSliderProps {
  startTime: string;
  endTime: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  step?: number; // in minutes
}

const DEFAULT_MIN = '08:00';
const DEFAULT_MAX = '23:30';
const DEFAULT_STEP = 10;

export function TimeRangeSlider({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  minTime = DEFAULT_MIN,
  maxTime = DEFAULT_MAX,
  step = DEFAULT_STEP,
}: TimeRangeSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const minMinutes = timeToMinutes(minTime);
  const maxMinutes = timeToMinutes(maxTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const totalRange = maxMinutes - minMinutes;
  const startPercent = ((startMinutes - minMinutes) / totalRange) * 100;
  const endPercent = ((endMinutes - minMinutes) / totalRange) * 100;

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      const endVal = timeToMinutes(endTime);
      const clamped = Math.min(val, endVal - step);
      onStartChange(minutesToTime(clamped));
    },
    [endTime, step, onStartChange]
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      const startVal = timeToMinutes(startTime);
      const clamped = Math.max(val, startVal + step);
      onEndChange(minutesToTime(clamped));
    },
    [startTime, step, onEndChange]
  );

  // Generate time labels every 2 hours
  const labels: { label: string; percent: number }[] = [];
  for (let m = minMinutes; m <= maxMinutes; m += 120) {
    labels.push({
      label: minutesToTime(m),
      percent: ((m - minMinutes) / totalRange) * 100,
    });
  }

  return (
    <div className="w-full space-y-4">
      {/* Time display */}
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#777' }}>From</div>
          <div
            className="font-mono text-2xl font-medium tracking-tight"
            style={{ color: '#FFEA00' }}
            data-testid="time-start-display"
          >
            {startTime}
          </div>
        </div>
        <div
          className="flex-1 mx-6 h-px"
          style={{ background: 'linear-gradient(90deg, rgba(255,234,0,0.3), rgba(255,234,0,0.1), rgba(255,234,0,0.3))' }}
        />
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#777' }}>Until</div>
          <div
            className="font-mono text-2xl font-medium tracking-tight"
            style={{ color: '#FFEA00' }}
            data-testid="time-end-display"
          >
            {endTime}
          </div>
        </div>
      </div>

      {/* Slider track */}
      <div className="time-range-slider relative" ref={containerRef}>
        <div
          className="relative h-1.5 rounded-full w-full"
          style={{ background: '#1e1e1e' }}
        >
          {/* Active range fill */}
          <div
            className="absolute h-full rounded-full transition-all duration-75"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`,
              background: '#FFEA00',
            }}
          />
        </div>

        {/* Range inputs */}
        <div className="relative" style={{ height: '18px', marginTop: '-9px' }}>
          <input
            type="range"
            min={minMinutes}
            max={maxMinutes}
            step={step}
            value={startMinutes}
            onChange={handleStartChange}
            data-testid="slider-start"
            style={{ zIndex: 3 }}
          />
          <input
            type="range"
            min={minMinutes}
            max={maxMinutes}
            step={step}
            value={endMinutes}
            onChange={handleEndChange}
            data-testid="slider-end"
            style={{ zIndex: 4 }}
          />
        </div>

        {/* Time labels */}
        <div className="relative mt-3" style={{ height: '16px' }}>
          {labels.map(({ label, percent }) => (
            <span
              key={label}
              className="absolute font-mono transform -translate-x-1/2"
              style={{ left: `${percent}%`, color: '#666', fontSize: '10px' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
