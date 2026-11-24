/**
 * YENKO RIDE brand system.
 * Provides a consistent wordmark, page chrome and document titles across the app.
 * 100% local assets — no external logo services.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import usePageTitle from '../../hooks/usePageTitle';

/** YENKO wordmark. `inverse` renders white text for dark backgrounds. */
export const Brand = ({ inverse = false, compact = false, className = '' }) => (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <img
            src={logo}
            alt="YENKO"
            className={compact ? 'h-9 w-9 object-contain' : 'h-11 w-11 object-contain'}
        />
        <span className="flex flex-col leading-none">
            <span className={`font-black tracking-[0.2em] ${compact ? 'text-lg' : 'text-2xl'} ${inverse ? 'text-white' : 'text-[#111]'}`}>
                YENKO
            </span>
            {!compact && (
                <span className={`mt-1 text-[9px] font-bold uppercase tracking-[0.36em] ${inverse ? 'text-white/60' : 'text-gray-500'}`}>
                    Ride · Ghana
                </span>
            )}
        </span>
    </span>
);

/** Brand footer used on dashboard / feature pages. */
export const PageFooter = () => (
    <footer className="border-t border-gray-200 bg-white py-5 mt-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <span className="font-semibold tracking-wide text-gray-700">YENKO RIDE</span>
            <span>Move smarter, Ghana · Maps by OpenStreetMap · Routing by OSRM</span>
            <span className='flex flex-wrap gap-3 font-semibold'>
                <Link to='/rider' className='hover:text-ink'>Rider App</Link>
                <Link to='/driver' className='hover:text-ink'>Captain App</Link>
                <Link to='/admin' className='hover:text-ink'>Admin</Link>
            </span>
            <span>© {new Date().getFullYear()} YENKO</span>
        </div>
    </footer>
);

/**
 * Standard page shell: branded sticky header, content and footer.
 * Wrap dashboard/feature pages with this for instant YENKO identity.
 */
const YenkoShell = ({ title, children }) => {
    usePageTitle(title);

    return (
        <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <Link to="/home" aria-label="YENKO RIDE home">
                        <Brand compact />
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                            {title}
                        </span>
                        <Link
                            to="/home"
                            className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Home
                        </Link>
                    </div>
                </div>
                <div className="h-[3px] bg-gradient-to-r from-[#f5c400] via-[#111111] to-transparent" />
            </header>

            <main className="flex-1">{children}</main>
            <PageFooter />
        </div>
    );
};

export default YenkoShell;
