import { forwardRef } from 'react';

const variants = {
  primary: 'bg-spark-ember text-white hover:bg-orange-600 active:scale-95 shadow-sm',
  secondary: 'bg-bg-secondary text-text-primary border border-[rgba(42,42,42,0.1)] hover:border-spark-ember hover:text-spark-ember active:scale-95',
  ghost: 'bg-transparent text-text-secondary hover:text-spark-ember hover:bg-[rgba(255,107,53,0.06)] active:scale-95',
  danger: 'bg-spark-flame text-white hover:opacity-90 active:scale-95',
};

const sizes = {
  sm:  'px-3 py-1.5 text-sm min-h-[36px] rounded-[10px]',
  md:  'px-5 py-2.5 text-base min-h-[44px] rounded-card',
  lg:  'px-8 py-3.5 text-lg min-h-[52px] rounded-card',
  icon:'w-11 h-11 rounded-full flex items-center justify-center',
};

const Button = forwardRef(function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-body font-medium
        transition-all duration-150 ease-out
        focus-visible:outline-2 focus-visible:outline-spark-ember
        disabled:opacity-50 disabled:pointer-events-none
        select-none
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
