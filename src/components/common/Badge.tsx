import React from 'react';

export type BadgeVariant = 'emerald' | 'cyan' | 'amber' | 'slate' | 'rose' | 'indigo';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'sm',
  icon,
  className = '',
}) => {
  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantStyles: Record<BadgeVariant, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap shrink-0 ${sizeStyle} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
