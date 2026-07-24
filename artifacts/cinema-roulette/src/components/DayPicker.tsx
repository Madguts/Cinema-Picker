import { useMemo } from 'react';
import { format, addDays, startOfDay, isToday } from 'date-fns';

interface DayPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
}

export function DayPicker({ selectedDate, onDateChange }: DayPickerProps) {
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 10 }, (_, i) => {
      const date = addDays(today, i);
      return {
        date,
        iso: format(date, 'yyyy-MM-dd'),
        dayName: isToday(date) ? 'Today' : format(date, 'EEE'),
        dayNum: format(date, 'd'),
        monthName: format(date, 'MMM'),
      };
    });
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" data-testid="day-picker">
      {days.map(({ date: _date, iso, dayName, dayNum, monthName }) => {
        const isSelected = iso === selectedDate;
        return (
          <button
            key={iso}
            onClick={() => onDateChange(iso)}
            data-testid={`day-btn-${iso}`}
            className="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              background: isSelected
                ? 'linear-gradient(135deg, hsl(38 85% 55% / 0.25), hsl(32 70% 42% / 0.15))'
                : 'hsl(24 14% 10%)',
              border: `1px solid ${isSelected ? 'hsl(38 85% 55% / 0.5)' : 'hsl(30 15% 18%)'}`,
              color: isSelected ? 'hsl(38 85% 65%)' : 'hsl(34 20% 55%)',
            }}
          >
            <span
              className="text-xs font-medium uppercase tracking-widest mb-1"
              style={{ fontSize: '9px', letterSpacing: '0.12em' }}
            >
              {dayName}
            </span>
            <span
              className="text-xl font-serif font-bold leading-none"
              style={{ color: isSelected ? 'hsl(38 85% 70%)' : 'hsl(38 60% 88%)' }}
            >
              {dayNum}
            </span>
            <span
              className="text-xs mt-1 uppercase tracking-wider"
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
