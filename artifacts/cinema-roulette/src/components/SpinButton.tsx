import { useEffect, useRef } from 'react';
import { Shuffle } from 'lucide-react';

interface SpinButtonProps {
  onClick: () => void;
  isSpinning: boolean;
  disabled?: boolean;
  hasResult: boolean;
}

export function SpinButton({ onClick, isSpinning, disabled, hasResult }: SpinButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSpinning && btnRef.current) {
      btnRef.current.blur();
    }
  }, [isSpinning]);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      disabled={disabled || isSpinning}
      data-testid="button-spin"
      className="relative group w-full overflow-hidden rounded-lg transition-all duration-300"
      style={{
        background: disabled
          ? 'hsl(24 14% 14%)'
          : 'linear-gradient(135deg, hsl(38 85% 50%), hsl(32 75% 40%))',
        border: disabled
          ? '1px solid hsl(30 15% 20%)'
          : '1px solid hsl(38 85% 42%)',
        color: disabled ? 'hsl(34 20% 40%)' : 'hsl(24 20% 8%)',
        padding: '18px 32px',
        cursor: disabled || isSpinning ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 0 40px -8px hsl(38 85% 50% / 0.4), 0 8px 24px hsl(24 12% 4% / 0.6)',
      }}
    >
      {/* Shimmer effect */}
      {!disabled && !isSpinning && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, hsl(38 100% 80% / 0.15) 50%, transparent 70%)',
          }}
        />
      )}

      <div className="relative flex items-center justify-center gap-3">
        <Shuffle
          size={20}
          className={isSpinning ? 'animate-spin' : 'transition-transform group-hover:rotate-12'}
          style={{ transition: 'transform 0.3s ease' }}
        />
        <span
          className="font-serif text-xl font-bold tracking-wide"
          style={{ letterSpacing: '0.04em' }}
        >
          {isSpinning ? 'Choosing...' : hasResult ? 'Spin Again' : 'Spin the Reel'}
        </span>
      </div>
    </button>
  );
}
