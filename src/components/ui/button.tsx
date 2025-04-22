"use client";

import { Button as HeadlessButton } from '@headlessui/react';
import { clsx } from 'clsx'; // Import clsx for conditional classes

// Define the props for our custom Button component
// Start with standard button attributes and add HeadlessUI specifics if needed
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // We primarily rely on standard HTML attributes.
  // HeadlessUI specific props can be added here if required beyond what React.ButtonHTMLAttributes provides.
  // For now, standard props like onClick, disabled, type, children, className cover most cases.
}

export function Button({ className, disabled, ...props }: ButtonProps) {
  return (
    <HeadlessButton
      {...props} // Pass through other standard props like type, onClick etc.
      disabled={disabled} // Explicitly pass disabled for Headless UI state
      // Use clsx to combine base styles with any passed className
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary', // Base styles
        // Use Tailwind's disabled: prefix which works with the native disabled attribute
        'disabled:opacity-50 disabled:cursor-not-allowed', // Disabled state
        // Default to primary button styling (can be overridden by className prop)
        'bg-primary text-white hover:bg-primary-dark',
        className // Allow overriding/extending styles via props
      )}
    />
    // No need to spread props.children explicitly, it's handled by {...props}
  );
}