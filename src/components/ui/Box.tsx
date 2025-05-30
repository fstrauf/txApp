// src/app/shared/components/Box.tsx
import React from 'react';

export interface BoxProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'elevated' | 'bordered';
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
