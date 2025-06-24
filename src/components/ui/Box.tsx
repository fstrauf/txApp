// src/app/shared/components/Box.tsx
import React from 'react';

export interface BoxProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'elevated' | 'bordered' | 'lifted' | 'error' | 'warning' | 'success';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  id?: string;
}

export const Box: React.FC<BoxProps> = ({ 
  children, 
  variant = 'default',
  padding = 'lg',
  className = '',
  onClick,
  hoverable = false,
  id
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const variantClasses = {
    default: `
      bg-white 
      shadow-soft 
      border border-gray-100/50
    `,
    gradient: `
      bg-linear-to-br from-primary/5 via-white to-secondary/5
      shadow-lg shadow-primary/10
      backdrop-blur-sm
    `,
    glass: `
      bg-white/80 
      backdrop-blur-md 
      shadow-xl shadow-gray-200/50
      border border-white/50
    `,
    elevated: `
      bg-white 
      shadow-2xl shadow-gray-300/30
      border border-gray-50
    `,
    bordered: `
      bg-white 
      shadow-md
      border-2 border-primary/20
    `,
    lifted: `
      bg-white/95
      shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]
      hover:shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.22)]
      border border-gray-100/80
      backdrop-blur-sm
      ring-1 ring-white/20
    `,
    error: `
      bg-red-50
      border border-red-400
      text-red-900
      shadow-md
    `,
    warning: `
      bg-amber-50
      border border-amber-400
      text-amber-900
      shadow-md
    `,
    success: `
      bg-green-50
      border border-green-400
      text-green-900
      shadow-md
    `
  };

  const hoverClasses = hoverable || onClick ? `
    hover:shadow-2xl 
    hover:shadow-primary/20
    hover:scale-[1.02]
    hover:-translate-y-1
    cursor-pointer
    transition-all duration-300 ease-out
  ` : '';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        rounded-2xl
        ${paddingClasses[padding]}
        ${variantClasses[variant]}
        ${hoverClasses}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
