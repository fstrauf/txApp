'use client';

import React from 'react';
import { Select as HeadlessSelect, Field, Label } from '@headlessui/react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectOptGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  optGroups?: SelectOptGroup[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'blue';
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options = [],
  optGroups = [],
  placeholder,
  label,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 pr-8 text-sm',
    md: 'px-3 py-2 pr-10 text-sm',
    lg: 'px-4 py-3 pr-12 text-base'
  };

  const variantClasses = {
    default: 'border-gray-300 focus:ring-primary focus:border-primary',
    primary: 'border-primary/30 focus:ring-primary focus:border-primary bg-primary/5',
    blue: 'border-blue-300 focus:ring-primary focus:border-primary bg-blue-50'
  };

  const baseClasses = `
    relative w-full rounded-lg border bg-white
    focus:ring-2 focus:outline-none
    data-focus:ring-2 data-focus:ring-primary data-focus:border-primary
    data-hover:shadow-sm
    disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50
    transition-all duration-200
    appearance-none
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  const renderContent = () => (
    <HeadlessSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={baseClasses}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      
      {options.length > 0 && options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
      
      {optGroups.length > 0 && optGroups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </HeadlessSelect>
  );

  if (label) {
    return (
      <Field className="w-full">
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </Label>
        {renderContent()}
      </Field>
    );
  }

  return renderContent();
};

export default Select;
