// Accessible progress ring with ember gradient fill.
export default function ProgressRing({
  value = 0,
  max = 100,
  size = 56,
  stroke = 5,
  trackColor = 'rgba(42, 42, 42, 0.08)',
  gradientId = 'ember-progress',
  label,
  children,
}) {
  const clamped = Math.max(0, Math.min(1, value / max));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFD166" />
            <stop offset="55%" stopColor="#FF8A5A" />
            <stop offset="100%" stopColor="#E63946" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 600ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
        />
      </svg>
      {children && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
