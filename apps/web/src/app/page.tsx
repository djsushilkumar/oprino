'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../components/BrandLogo';
import { getStoredToken } from '../lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid #DDE5EF',
          backgroundColor: '#FFFFFF',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BrandLogo size={32} />
          <span
            style={{
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Phase 02A Foundation
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
          <Link
            href="/auth/signin"
            style={{
              color: '#0F172A',
              fontWeight: 600,
              padding: '0.5rem 1rem',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            style={{
              backgroundColor: '#164CFF',
              color: '#FFFFFF',
              fontWeight: 600,
              padding: '0.5rem 1rem',
              borderRadius: '8px',
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          padding: '4rem 2rem',
          maxWidth: '1000px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#16A34A',
              display: 'inline-block',
            }}
          />
          Production Multi-Tenant Architecture Active
        </div>

        <h1
          style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
          }}
        >
          Workforce Operations SaaS Platform
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            color: '#475569',
            maxWidth: '640px',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
          }}
        >
          Phase 02A establishes production-grade identity, workspace onboarding, multi-workspace
          membership, PostgreSQL Row-Level Security, and device governance.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
          <Link
            href="/auth/signup"
            style={{
              backgroundColor: '#164CFF',
              color: '#FFFFFF',
              fontWeight: 600,
              padding: '0.875rem 1.75rem',
              borderRadius: '8px',
              fontSize: '1rem',
              boxShadow: '0 2px 4px rgba(22, 76, 255, 0.2)',
            }}
          >
            Create Workspace &rarr;
          </Link>
          <Link
            href="/auth/signin"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              fontWeight: 600,
              padding: '0.875rem 1.75rem',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          >
            Sign In to Existing Workspace
          </Link>
        </div>

        {/* Invariant Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDE5EF',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '0.5rem',
                fontSize: '1rem',
              }}
            >
              Multi-Tenant Isolation
            </div>
            <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Kernel-enforced PostgreSQL Row-Level Security with transaction-scoped tenant context.
              Cross-tenant leakage is mathematically impossible.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDE5EF',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '0.5rem',
                fontSize: '1rem',
              }}
            >
              Duty-Hours Invariant
            </div>
            <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Duty-hours-only tracking guarantee. Zero off-duty location collection. Peer location
              visibility remains strictly OFF by default.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDE5EF',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '0.5rem',
                fontSize: '1rem',
              }}
            >
              Device Governance
            </div>
            <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Hardware-independent Installation ID lifecycle with instantaneous server-side
              revocation and client wipe.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
