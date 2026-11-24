/**
 * RoleShell — application chrome shared by the Rider, Captain and Admin apps.
 * Provides a desktop sidebar, a mobile bottom bar and a consistent top bar.
 */

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Brand } from './YenkoShell';
import { Avatar, LiveDot } from './AppKit';
import usePageTitle from '../../hooks/usePageTitle';

const RoleShell = ({
    title,
    role,
    items = [],
    userName = 'YENKO User',
    live = true,
    logoutPath = '/home',
    children,
}) => {
    usePageTitle(title);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate(logoutPath);
    };

    const navItemClass = ({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            isActive
                ? 'bg-yenko text-ink shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-ink'
        }`;

    return (
        <div className='min-h-screen bg-[#f6f7f8]'>
            {/* Desktop sidebar */}
            <aside className='fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex'>
                <div className='flex h-20 items-center border-b border-gray-100 px-6'>
                    <Link to='/home' aria-label='YENKO home'>
                        <Brand compact />
                    </Link>
                </div>

                <div className='px-4 py-5'>
                    <p className='px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400'>
                        {role}
                    </p>
                    <nav className='space-y-1 yenko-scroll'>
                        {items.map((item) => (
                            <NavLink key={item.path} to={item.path} className={navItemClass} end={item.end}>
                                <span className='w-6 text-center text-base'>{item.icon}</span>
                                <span className='flex-1'>{item.label}</span>
                                {item.badge && (
                                    <span className='rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white'>
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className='mt-auto border-t border-gray-100 p-4'>
                    <div className='flex items-center gap-3 rounded-xl bg-gray-50 p-3'>
                        <Avatar name={userName} size='sm' />
                        <div className='min-w-0 flex-1'>
                            <p className='truncate text-xs font-bold text-ink'>{userName}</p>
                            <p className='text-[10px] font-semibold uppercase tracking-wider text-gray-400'>{role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className='mt-2 w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50'
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main column */}
            <div className='lg:pl-64'>
                <header className='sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur'>
                    <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8'>
                        <div className='flex items-center gap-3'>
                            <div className='lg:hidden'>
                                <Brand compact />
                            </div>
                            <div>
                                <p className='text-[10px] font-black uppercase tracking-[0.22em] text-gray-400'>{role}</p>
                                <h1 className='text-lg font-black leading-tight tracking-tight text-ink'>{title}</h1>
                            </div>
                        </div>

                        <div className='flex items-center gap-3'>
                            <LiveDot active={live} />
                            <Link
                                to='/notifications'
                                className='relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-base hover:bg-gray-50'
                                aria-label='Notifications'
                            >
                                🔔
                                <span className='absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500' />
                            </Link>
                            <div className='hidden sm:block'>
                                <Avatar name={userName} size='sm' />
                            </div>
                        </div>
                    </div>
                    <div className='h-[3px] bg-gradient-to-r from-yenko via-ink to-transparent' />
                </header>

                <main className='mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-8 lg:pb-10'>{children}</main>
            </div>

            {/* Mobile bottom navigation */}
            <nav className='fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gray-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden'>
                {items.slice(0, 5).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex min-w-14 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-bold ${
                                isActive ? 'text-ink' : 'text-gray-400'
                            }`
                        }
                    >
                        <span className='text-lg'>{item.icon}</span>
                        <span className='truncate'>{item.label.split(' ')[0]}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default RoleShell;
