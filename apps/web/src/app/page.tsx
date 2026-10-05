import React from 'react';

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--card-bg)',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Oprino Vector Icon */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="8" fill="#0F172A" />
            <path
              d="M16 6C11.58 6 8 9.58 8 14C8 19.5 16 26 16 26C16 26 24 19.5 24 14C24 9.58 20.42 6 16 6ZM14.2 18.2L10.8 14.8L12.2 13.4L14.2 15.4L19.8 9.8L21.2 11.2L14.2 18.2Z"
              fill="url(#paint0_linear)"
            />
            <defs>
              <linearGradient
                id="paint0_linear"
                x1="8"
                y1="6"
                x2="24"
                y2="26"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#164CFF" />
                <stop offset="0.5" stopColor="#087DE5" />
                <stop offset="1" stopColor="#20BAAA" />
              </linearGradient>
            </defs>
          </svg>
          <span
            style={{
              fontFamily: 'var(--oprino-font-display)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--oprino-color-brand-navy)',
              letterSpacing: '-0.03em',
            }}
          >
            oprino
          </span>
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
            Phase 01C Scaffolding
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--muted)' }}>Web Dashboard Baseline</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#DCFCE7',
              color: '#15803D',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
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
            Architecture Ready
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        style={{ flex: 1, padding: '2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
            Oprino Production Monorepo
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
            Production-grade modular monolith foundation connecting Next.js, Fastify, BullMQ,
            PostgreSQL 18, and Flutter.
          </p>
        </div>

        {/* Foundation Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          {/* Card 1: Web App */}
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--oprino-radius-lg)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}
            >
              <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Next.js Web App</span>
              <span style={{ fontSize: '0.75rem', color: '#164CFF', fontWeight: 600 }}>
                apps/web
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Next.js 15 App Router with TypeScript, server components, and compiled Oprino brand
              design tokens.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              ✓ Compiled Cleanly
            </div>
          </div>

          {/* Card 2: Mobile App */}
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--oprino-radius-lg)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}
            >
              <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Flutter Mobile App</span>
              <span style={{ fontSize: '0.75rem', color: '#164CFF', fontWeight: 600 }}>
                apps/mobile
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Unified Flutter 3.47 app with Riverpod, Drift offline SQLite, GoRouter, and generated
              OpenAPI Dio client.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              ✓ TargetSdk 36 Baseline
            </div>
          </div>

          {/* Card 3: Fastify API */}
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--oprino-radius-lg)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}
            >
              <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Fastify Modular API</span>
              <span style={{ fontSize: '0.75rem', color: '#164CFF', fontWeight: 600 }}>
                services/api
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              High-performance Fastify server with Zod contracts, Better Auth boundary, and OpenAPI
              3.1 specification.
            </p>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              ✓ Health & Version Endpoints
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
