import { useMemo } from 'react';
import { getLisburnDate } from '@/lib/utils';

interface DayPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
}

export function DayPicker({ selectedDate, onDateChange }: DayPickerProps) {
  const days = useMemo(() => {
    const [year, month, day] = getLisburnDate().split('-').map(Number);
    return Array.from({ length: 10 }, (_, i) => {
      const date = new Date(Date.UTC(year, month - 1, day + i));
      return {
        iso: date.toISOString().slice(0, 10),
        dayName: i === 0
          ? 'Today'
          : new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(date),
        dayNum: new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'UTC' }).format(date),
        monthName: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(date),
      };
    });
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" data-testid="day-picker">
      {days.map(({ iso, dayName, dayNum, monthName }) => {
        const isSelected = iso === selectedDate;
        return (
          <button
            key={iso}
            onClick={() => onDateChange(iso)}
            data-testid={`day-btn-${iso}`}
            className="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer hover:opacity-90"
            style={{
              background: isSelected ? 'rgba(255,234,0,0.1)' : '#111',
              border: `1px solid ${isSelected ? 'rgba(255,234,0,0.4)' : '#1e1e1e'}`,
              color: isSelected ? '#FFEA00' : '#555',
            }}
          >
            <span
              className="font-medium uppercase tracking-widest mb-1"
              style={{ fontSize: '9px', letterSpacing: '0.12em' }}
            >
              {dayName}
            </span>
            <span
              className="text-xl font-bold leading-none"
              style={{ color: isSelected ? '#FFEA00' : '#ccc' }}
            >
              {dayNum}
            </span>
            <span
              className="mt-1 uppercase tracking-wider"
              style={{ fontSize: '9px', letterSpacing: '0.08em' }}
            >
              {monthName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
