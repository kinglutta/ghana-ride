/**
 * YENKO AppKit — shared design primitives for the Rider, Captain and Admin apps.
 * Every component is presentational and dependency-free so it can be reused safely.
 */

import React from 'react';

/** Neutral card surface with a subtle shadow. */
export const Panel = ({ children, className = '', ...rest }) => (
    <div className={`yenko-panel p-5 ${className}`} {...rest}>
        {children}
    </div>
);

/** Dark, high-contrast card used for hero metrics and live controls. */
export const DarkPanel = ({ children, className = '', ...rest }) => (
    <div className={`yenko-panel-dark p-5 ${className}`} {...rest}>
        {children}
    </div>
);

const TONES = {
    yellow: 'bg-yenko/15 text-[#8a6d00]',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
};

/** Small status label. `tone` selects one of the predefined color pairs. */
export const Pill = ({ children, tone = 'gray', className = '' }) => (
    <span className={`yenko-chip ${TONES[tone] || TONES.gray} ${className}`}>
        {children}
    </span>
);

/** Section heading with optional right-hand action slot. */
export const SectionTitle = ({ title, subtitle, action }) => (
    <div className='mb-4 flex items-end justify-between gap-4'>
        <div>
            <h2 className='text-lg font-black tracking-tight text-ink'>{title}</h2>
            {subtitle && <p className='mt-0.5 text-xs text-gray-500'>{subtitle}</p>}
        </div>
        {action}
    </div>
);

/** Compact KPI tile used across dashboards. */
export const StatCard = ({ icon, label, value, hint, tone = 'yellow', loading = false }) => {
    if (loading) return <Skeleton className='h-28' />;

    return (
        <Panel className='relative overflow-hidden'>
            <div className='flex items-start justify-between'>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${TONES[tone] || TONES.yellow}`}>
                    {icon}
                </div>
                {hint && <span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>{hint}</span>}
            </div>
            <p className='mt-5 text-2xl font-black tracking-tight text-ink'>{value}</p>
            <p className='mt-1 text-xs font-semibold text-gray-500'>{label}</p>
        </Panel>
    );
};

/** Shimmering placeholder block for loading states. */
export const Skeleton = ({ className = '' }) => (
    <div className={`yenko-shimmer rounded-2xl ${className}`} aria-hidden='true' />
);

/** Friendly empty state with an icon, title and description. */
export const EmptyState = ({ icon = '✨', title, description }) => (
    <div className='flex flex-col items-center justify-center px-6 py-12 text-center'>
        <div className='yenko-float mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-yenko/15 text-2xl'>
            {icon}
        </div>
        <p className='font-bold text-ink'>{title}</p>
        {description && <p className='mt-1 max-w-xs text-xs leading-relaxed text-gray-500'>{description}</p>}
    </div>
);

/** Horizontal progress bar. `value` is a percentage from 0 to 100. */
export const Progress = ({ value = 0, tone = 'bg-yenko', className = '' }) => (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}>
        <div
            className={`h-full rounded-full transition-all duration-500 ${tone}`}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
    </div>
);

/** Accessible on/off switch. */
export const Toggle = ({ checked, onChange, label, disabled = false }) => (
    <button
        type='button'
        role='switch'
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            checked ? 'bg-emerald-500' : 'bg-gray-300'
        }`}
    >
        <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

/** Generated avatar using initials — no external image service. */
export const Avatar = ({ name = 'YENKO', size = 'md', tone = 'bg-yenko' }) => {
    const initials = name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-base' };

    return (
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-black text-ink ${tone} ${sizes[size] || sizes.md}`}>
            {initials || 'Y'}
        </span>
    );
};

/** Tiny inline chart. Accepts an array of numbers and draws a filled sparkline. */
export const Sparkline = ({ data = [], className = 'h-12 w-full', stroke = '#f5c400' }) => {
    if (data.length < 2) return <div className={className} />;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const span = max - min || 1;
    const points = data
        .map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 32 - ((value - min) / span) * 28;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <svg viewBox='0 0 100 36' preserveAspectRatio='none' className={className} aria-hidden='true'>
            <polygon points={`0,36 ${points} 100,36`} fill={stroke} opacity='0.14' />
            <polyline points={points} fill='none' stroke={stroke} strokeWidth='2' vectorEffect='non-scaling-stroke' />
        </svg>
    );
};

/** Animated live indicator dot. */
export const LiveDot = ({ active = true, label = 'Live' }) => (
    <span className='inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider'>
        <span className={`relative flex h-2.5 w-2.5 ${active ? 'yenko-pulse-ring text-emerald-500' : ''}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        </span>
        <span className={active ? 'text-emerald-600' : 'text-gray-400'}>{active ? label : 'Offline'}</span>
    </span>
);

/** Primary call-to-action button with optional loading state. */
export const ActionButton = ({ children, loading = false, tone = 'bg-yenko', className = '', ...rest }) => (
    <button
        type='button'
        disabled={loading || rest.disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-ink transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${tone} ${className}`}
        {...rest}
    >
        {loading && <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink' />}
        {children}
    </button>
);
