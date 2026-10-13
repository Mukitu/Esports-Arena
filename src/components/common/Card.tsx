import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glowOnHover = true,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#0f172a]/80 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 transition-all duration-300 ${
        glowOnHover ? 'hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20' : ''
      } ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
