import { forwardRef } from 'react';

const variants = {
  primary:
    'text-white shadow-[0_10px_24px_rgba(255,107,53,0.32)] hover:shadow-[0_14px_32px_rgba(255,107,53,0.42)] hover:-translate-y-0.5',
  secondary:
    'bg-[rgba(255,255,255,0.92)] text-text-primary border border-[rgba(42,42,42,0.08)] shadow-[0_4px_12px_rgba(72,49,10,0.08)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(72,49,10,0.14)]',
  ghost:
    'bg-[rgba(42,42,42,0.05)] text-text-secondary hover:bg-[rgba(255,107,53,0.1)] hover:text-spark-ember',
  danger:
    'text-white shadow-[0_10px_24px_rgba(230,57,70,0.32)] hover:shadow-[0_14px_32px_rgba(230,57,70,0.42)] hover:-translate-y-0.5',
  gold:
    'text-[#6b4b10] shadow-[0_10px_26px_rgba(255,184,77,0.4)] hover:-translate-y-0.5',
};

const variantBackgrounds = {
  primary: 'linear-gradient(135deg, #FF8A5A 0%, #FF6B35 48%, #E63946 100%)',
  danger: 'linear-gradient(135deg, #E63946 0%, #AA2036 100%)',
  gold: 'linear-gradient(135deg, #FFD166 0%, #FFB347 100%)',
};

const sizes = {
  sm:  'px-3.5 py-1.5 text-sm min-h-[36px] rounded-[12px]',
  md:  'px-5 py-2.5 text-base min-h-[44px] rounded-[16px]',
  lg:  'px-7 py-3 text-lg min-h-[52px] rounded-[18px]',
  icon:'w-11 h-11 rounded-full flex items-center justify-center',
};

const Button = forwardRef(function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  style,
  children,
  ...props
}, ref) {
  const background = variantBackgrounds[variant];
  return (
    <button
      ref={ref}
      disabled={disabled}
      style={{ ...(background && { background }), ...style }}
      className={`
        relative overflow-hidden
        inline-flex items-center justify-center gap-2
        font-body font-semibold
        transition-all duration-200 ease-out
        focus-visible:outline-2 focus-visible:outline-spark-ember
        disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0
        select-none active:scale-[0.97]
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
