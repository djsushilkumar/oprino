'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../../components/BrandLogo';
import { webApi } from '../../../lib/api';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await webApi.signIn({ email, password });
      if (res.activeWorkspaceId) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding/workspace');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #DDE5EF',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
          padding: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <BrandLogo size={40} />
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            textAlign: 'center',
            color: '#0F172A',
            marginBottom: '0.5rem',
            fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
          }}
        >
          Sign in to Oprino
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            textAlign: 'center',
            color: '#475569',
            marginBottom: '2rem',
          }}
        >
          Workforce Operations & Multi-Tenant Management
        </p>

        {error && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: '#DC2626',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#0F172A',
                marginBottom: '0.375rem',
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #DDE5EF',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                outline: 'none',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          <div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}
            >
              <label
                htmlFor="password"
                style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}
              >
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #DDE5EF',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                outline: 'none',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#164CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.875rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'background-color 0.15s ease',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#475569',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: '#164CFF', fontWeight: 600 }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
