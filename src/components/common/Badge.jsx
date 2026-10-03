import React from 'react';
import clsx from 'clsx';

/**
 * Accessible Status Badge component supporting Tailwind token colors
 */
export const Badge = ({ status, text, size = 'sm', className }) => {
  const normalized = (status || text || '').toUpperCase();

  const variantStyles = {
    PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    OPTIMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',

    LATE: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/10',
    PENDING: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-500/10',
    SUB_OPTIMAL: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/10',

    ABSENT: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',

    ON_LEAVE: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/10',
  };

  const dotColors = {
    PRESENT: 'bg-emerald-500',
    ACTIVE: 'bg-emerald-500',
    APPROVED: 'bg-emerald-500',
    OPTIMAL: 'bg-emerald-500',
    LATE: 'bg-amber-500',
    PENDING: 'bg-violet-500',
    ABSENT: 'bg-rose-500',
    REJECTED: 'bg-rose-500',
    TERMINATED: 'bg-rose-500',
    ON_LEAVE: 'bg-blue-500',
    CANCELLED: 'bg-slate-400',
  };

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-xs font-medium',
    sm: 'px-2.5 py-1 text-xs font-semibold',
    md: 'px-3 py-1.5 text-sm font-semibold',
  };

  const styleClass = variantStyles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  const dotClass = dotColors[normalized] || 'bg-slate-500';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border ring-1 ring-inset transition-colors duration-150',
        styleClass,
        sizeStyles[size],
        className
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden="true" />
      <span>{text || normalized.replace('_', ' ')}</span>
    </span>
  );
};
