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
      className="relative group w-full overflow-hidden rounded-lg transition-all duration-200"
      style={{
        background: disabled ? '#111' : '#FFEA00',
        border: disabled ? '1px solid #1e1e1e' : '1px solid #FFEA00',
        color: disabled ? '#333' : '#000',
        padding: '18px 32px',
        cursor: disabled || isSpinning ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 0 40px -8px rgba(255,234,0,0.35), 0 8px 24px rgba(0,0,0,0.6)',
        opacity: isSpinning ? 0.85 : 1,
      }}
    >
      {/* Hover shimmer */}
      {!disabled && !isSpinning && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
          }}
        />
      )}

      <div className="relative flex items-center justify-center gap-3">
        <Shuffle
          size={20}
          className={isSpinning ? 'animate-spin' : 'transition-transform group-hover:rotate-12'}
          style={{ transition: 'transform 0.3s ease' }}
        />
        <span className="text-xl font-bold tracking-wide">
          {isSpinning ? 'Choosing…' : hasResult ? 'Spin Again' : 'Spin the Reel'}
        </span>
      </div>
    </button>
  );
}
