import React from 'react';

export interface HeaderProps {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'large' | 'centered';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'info';
  };
}

export const Header: React.FC<HeaderProps> = ({
  children,
  variant = 'default',
  size = 'lg',
  className = '',
  subtitle,
  badge
}) => {
  const sizeClasses = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-4xl md:text-6xl'
  };

  const variantClasses = {
    default: 'text-gray-900',
    gradient: 'bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent',
    large: 'text-gray-900 font-extrabold',
    centered: 'text-gray-900'
  };

  const isGradientOrCentered = variant === 'gradient' || variant === 'centered';

  const badgeVariants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-orange-100 text-orange-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className={`mb-8 ${isGradientOrCentered ? 'text-center' : ''} ${className}`}>
      {badge && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm mb-6 ${
          badge.variant ? badgeVariants[badge.variant] : 'bg-primary/10'
        }`}>
          {badge.variant === 'success' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
          {badge.variant === 'warning' && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>}
          {badge.variant === 'info' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
          {(!badge.variant || badge.variant === 'default') && <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
          <span className={`text-sm font-medium uppercase tracking-wide ${
            badge.variant ? (badge.variant === 'default' ? 'text-gray-800' : '') : 'text-primary'
          }`}>
            {badge.text}
          </span>
        </div>
      )}
      
      <h1 className={`font-bold ${subtitle ? 'mb-4' : 'mb-8'} ${sizeClasses[size]} ${variantClasses[variant]}`}>
        {children}
      </h1>
      
      {subtitle && (
        <p className={`text-xl text-gray-600 max-w-2xl mb-8 ${isGradientOrCentered ? 'mx-auto text-center' : ''}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
