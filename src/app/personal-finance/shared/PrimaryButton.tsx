import React from 'react';

export type PrimaryButtonVariant = "primary" | "secondary" | "success";

export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = "primary",
  className = "" 
}) => {
  const baseClasses = "px-8 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-20";
  
  const variants: Record<PrimaryButtonVariant, string> = {
    primary: `${baseClasses} bg-gradient-to-r from-primary to-secondary text-white 
              hover:from-secondary hover:to-primary hover:transform hover:-translate-y-0.5 hover:shadow-lg
              focus:ring-primary disabled:opacity-10 disabled:cursor-not-allowed disabled:transform-none disabled:hover:from-primary disabled:hover:to-secondary`,
    secondary: `${baseClasses} bg-gray-100 text-gray-700 border-2 border-gray-200
                hover:bg-gray-200 hover:border-gray-300 focus:ring-gray-400`,
    success: `${baseClasses} bg-gradient-to-r from-green-500 to-green-600 text-white
              hover:from-green-600 hover:to-green-700 hover:transform hover:-translate-y-0.5 hover:shadow-lg focus:ring-green-500`
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}; 