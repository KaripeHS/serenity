'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-green-600 to-green-700
      text-white
      hover:from-green-700 hover:to-green-800
      focus:ring-green-500
      shadow-md hover:shadow-lg
      active:scale-95
    `,
    secondary: `
      bg-gradient-to-r from-blue-600 to-blue-700
      text-white
      hover:from-blue-700 hover:to-blue-800
      focus:ring-blue-500
      shadow-md hover:shadow-lg
      active:scale-95
    `,
    outline: `
      border-2 border-green-600
      text-green-700
      hover:bg-green-50
      focus:ring-green-500
      active:scale-95
    `,
    ghost: `
      text-gray-700
      hover:bg-gray-100
      focus:ring-gray-500
      active:scale-95
    `,
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </button>
  );
}
