export default function Card({ children, className = '', onClick, interactive = false, ...props }) {
  const base = `bg-bg-secondary rounded-card shadow-card`;
  const hover = interactive
    ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]'
    : '';

  return (
    <div
      className={`${base} ${hover} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
