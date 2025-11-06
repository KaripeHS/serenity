'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
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
    font-semibold rounded-xl
    transition-all duration-300
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-serenity-green-500 to-serenity-green-600
      text-white
      hover:from-serenity-green-600 hover:to-serenity-green-700
      focus-visible:ring-serenity-green-500
      shadow-md hover:shadow-lg
      glow-on-hover
      active:scale-[0.98]
    `,
    secondary: `
      bg-gradient-to-r from-sage-100 to-sage-200
      text-graphite-gray
      hover:from-sage-200 hover:to-sage-300
      focus-visible:ring-serenity-green-500
      shadow-sm hover:shadow-md
      active:scale-[0.98]
    `,
    outline: `
      border-2 border-serenity-green-500
      text-serenity-green-600
      hover:bg-serenity-green-50
      focus-visible:ring-serenity-green-500
      active:scale-[0.98]
    `,
    ghost: `
      text-warm-gray-700
      hover:bg-warm-gray-100
      focus-visible:ring-warm-gray-500
      active:scale-[0.98]
    `,
    gold: `
      bg-gradient-to-r from-champagne-gold-400 to-champagne-gold-500
      text-warm-gray-900
      hover:from-champagne-gold-500 hover:to-champagne-gold-600
      focus-visible:ring-champagne-gold-500
      shadow-md hover:shadow-lg
      hover:shadow-champagne-gold-500/20
      active:scale-[0.98]
    `,
  };

  const sizeStyles = {
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',
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
