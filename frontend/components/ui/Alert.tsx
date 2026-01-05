import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const variantStyles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        variantStyles[variant],
        className,
      )}
      role="alert"
    >
      {title && <h4 className="mb-1 font-semibold">{title}</h4>}
      <div className="text-sm">{children}</div>
    </div>
  );
}
