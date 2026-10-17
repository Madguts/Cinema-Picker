import { useEffect, useState } from 'react';

interface CertificateBadgeProps {
  certificate: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

const OMNIPLEX_RATINGS_URL = 'https://www.omniplexcinemas.co.uk/images/ratings';

const certColors: Record<string, { bg: string; text: string; border: string }> = {
  U: { bg: 'hsl(120 50% 18%)', text: 'hsl(120 70% 70%)', border: 'hsl(120 50% 28%)' },
  PG: { bg: 'hsl(200 50% 18%)', text: 'hsl(200 70% 70%)', border: 'hsl(200 50% 28%)' },
  '12A': { bg: 'hsl(38 60% 18%)', text: 'hsl(38 85% 65%)', border: 'hsl(38 60% 28%)' },
  '12': { bg: 'hsl(38 60% 18%)', text: 'hsl(38 85% 65%)', border: 'hsl(38 60% 28%)' },
  '15': { bg: 'hsl(20 55% 18%)', text: 'hsl(20 80% 65%)', border: 'hsl(20 55% 28%)' },
  '18': { bg: 'hsl(0 50% 18%)', text: 'hsl(0 75% 65%)', border: 'hsl(0 50% 28%)' },
};

const defaultColor = { bg: 'hsl(30 15% 16%)', text: 'hsl(34 20% 55%)', border: 'hsl(30 15% 22%)' };

export function CertificateBadge({ certificate, size = 'md' }: CertificateBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [certificate]);

  if (!certificate) return null;

  const normalizedCertificate = certificate.trim().toUpperCase().replace(/[\s_]/g, '');
  const supportedRatings = ['U', 'PG', '12', '12A', '15', '18'];
  const ratingImageUrl = supportedRatings.includes(normalizedCertificate)
    ? `${OMNIPLEX_RATINGS_URL}/UK_${normalizedCertificate}.png`
    : null;
  const imageSizes = { sm: 18, md: 22, lg: 26 };

  if (ratingImageUrl && !imageFailed) {
    return (
      <img
        src={ratingImageUrl}
        alt={`${normalizedCertificate} age rating`}
        title={`${normalizedCertificate} age rating`}
        width={imageSizes[size]}
        height={imageSizes[size]}
        onError={() => setImageFailed(true)}
        className="inline-block flex-shrink-0 object-contain"
        data-testid="img-certificate-rating"
      />
    );
  }

  const colors = certColors[normalizedCertificate] || defaultColor;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-medium rounded uppercase tracking-wider ${sizeClasses[size]}`}
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        lineHeight: 1,
      }}
    >
      {normalizedCertificate}
    </span>
  );
}
