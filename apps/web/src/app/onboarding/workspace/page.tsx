'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../../components/BrandLogo';
import { webApi, getStoredToken } from '../../../lib/api';

export default function WorkspaceOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push('/auth/signin');
    }
  }, [router]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await webApi.createWorkspace({ name, slug });
      // Switch to newly created workspace
      await webApi.switchWorkspace(res.id);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace.');
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
          maxWidth: '480px',
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

        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#EFF6FF',
            color: '#164CFF',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          STEP 1 OF 1: WORKSPACE SETUP
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: '0.5rem',
            fontFamily: 'var(--oprino-font-display, "Outfit", sans-serif)',
          }}
        >
          Name your organization
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#475569',
            marginBottom: '2rem',
          }}
        >
          Workspaces isolate members, roles, and operational governance under strict PostgreSQL
          multi-tenancy.
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
              htmlFor="ws-name"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#0F172A',
                marginBottom: '0.375rem',
              }}
            >
              Workspace Name
            </label>
            <input
              id="ws-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Apex Security Operations"
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
            <label
              htmlFor="ws-slug"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#0F172A',
                marginBottom: '0.375rem',
              }}
            >
              Workspace Identifier (Slug)
            </label>
            <input
              id="ws-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setIsSlugManual(true);
                setSlug(e.target.value);
              }}
              placeholder="e.g. apex-security-ops"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #DDE5EF',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                outline: 'none',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.875rem',
              fontSize: '0.8125rem',
              color: '#64748B',
              lineHeight: 1.4,
            }}
          >
            <strong>Default Role Assignment:</strong> Creating this workspace automatically assigns
            your account the{' '}
            <span style={{ color: '#164CFF', fontWeight: 600 }}>Owner / Admin</span> system role
            with full administrative privileges.
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !slug.trim()}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#164CFF',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '0.875rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: isLoading || !name.trim() || !slug.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !name.trim() || !slug.trim() ? 0.6 : 1,
              transition: 'background-color 0.15s ease',
            }}
          >
            {isLoading ? 'Creating workspace...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
