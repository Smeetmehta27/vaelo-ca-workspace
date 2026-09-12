import React from 'react';

export type VaeloMarkProps = {
  size?: number | string;
  variant?: 'mono' | 'accent' | 'reversed';
  frame?: boolean;
  showWordmark?: boolean;
  className?: string;
  stacked?: boolean;
};

export function VaeloMark({
  size = 44,
  variant = 'mono',
  frame = true,
  showWordmark = true,
  className = '',
  stacked = false,
}: VaeloMarkProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'accent':
        return {
          container: 'text-ink',
          svg: 'text-bronze',
        };
      case 'reversed':
        return {
          container: 'text-paper',
          svg: 'text-paper',
        };
      case 'mono':
      default:
        return {
          container: 'text-current',
          svg: 'text-current',
        };
    }
  };

  const styles = getVariantStyles();

  const svgContent = (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size }}
      className={`flex-none ${styles.svg}`}
      aria-hidden="true"
    >
      {frame && (
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="20"
          stroke="currentColor"
          strokeWidth="2.5"
          opacity="0.32"
        />
      )}
      <polygon points="20,20 43,20 62,98" fill="currentColor" />
      <polygon points="87,20 99,20 62,98" fill="currentColor" />
    </svg>
  );

  const wordmarkSize = typeof size === 'number' ? Math.max(16, size * 0.95) : '1em';

  const wordmarkContent = showWordmark ? (
    <span
      className="font-serif font-medium tracking-tight"
      style={{ fontSize: wordmarkSize, lineHeight: 1 }}
    >
      Vaelo
    </span>
  ) : null;

  if (!showWordmark) {
    return <div className={`inline-flex ${className}`}>{svgContent}</div>;
  }

  return (
    <div
      className={`inline-flex ${
        stacked ? 'flex-col items-center gap-2.5' : 'items-center gap-4'
      } ${styles.container} ${className}`}
    >
      {svgContent}
      {wordmarkContent}
    </div>
  );
}
