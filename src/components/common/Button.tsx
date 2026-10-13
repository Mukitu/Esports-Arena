import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base font-semibold gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-semibold hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/25',
    secondary:
      'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/80 hover:border-slate-600',
    outline:
      'bg-transparent text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10',
    ghost:
      'bg-transparent text-slate-300 hover:text-slate-100 hover:bg-slate-800/60',
    danger:
      'bg-red-600/90 text-white hover:bg-red-500 shadow-md shadow-red-950/40',
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
