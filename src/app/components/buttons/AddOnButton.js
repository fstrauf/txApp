import Link from "next/link";
import React from "react";

export default function AddOnButton({
  className = "",
  size = "md",
  variant = "primary",
  text = "Install Add-on",
}) {
  const baseClasses = "inline-flex items-center rounded-lg font-medium transition-all duration-200 shadow-sm text-sm";
  
  const sizeClasses = {
    sm: "px-4 py-1.5",
    md: "px-4 py-2",
    lg: "px-6 py-3",
  };
  
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-secondary text-white hover:bg-secondary-dark",
  };
  
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <Link
      href="https://workspace.google.com/marketplace/app/expense_sorted/456363921097"
      className={buttonClasses}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {text}
    </Link>
  );
} 