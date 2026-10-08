'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import type { MeResponse } from '@oprino/contracts';

interface HeaderNavProps {
  context?: MeResponse | null;
  onSignOut?: () => void;
}

export function HeaderNav({ context, onSignOut }: HeaderNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Live Map', href: '/live-map' },
    { label: 'Tasks', href: '/tasks' },
    { label: 'Attendance', href: '/attendance' },
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.875rem 2rem',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <BrandLogo size={28} />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0F172A' : '#64748B',
                  backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {context?.activeWorkspace && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#334155',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <span style={{ fontWeight: 600 }}>{context.activeWorkspace.name}</span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.1rem 0.4rem',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              {context.role?.name || 'Member'}
            </span>
          </div>
        )}

        {context?.user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
              {context.user.name}
            </span>
            {onSignOut && (
              <button
                onClick={onSignOut}
                style={{
                  padding: '0.35rem 0.75rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
