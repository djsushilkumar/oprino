'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandLogo } from '../../../components/BrandLogo';
import { webApi } from '../../../lib/api';
import type { ValidateInvitationResponse } from '@oprino/contracts';

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<ValidateInvitationResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError('No activation token provided. Please check your invitation link.');
      setIsLoading(false);
      return;
    }

    async function checkToken() {
      try {
        setIsLoading(true);
        setValidationError(null);
        const res = await webApi.validateInvitation(token as string);
        if (res.valid) {
          setInvitation(res);
        } else {
          setValidationError(res.reason || 'This invitation link is invalid or has expired.');
        }
      } catch (err: any) {
        setValidationError(err.message || 'Failed to validate invitation token.');
      } finally {
        setIsLoading(false);
      }
    }

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await webApi.acceptInvitation({
        token,
        password,
      });

      setIsSuccess(true);
      setTimeout(() => {
        if (res.activeWorkspaceId) {
          router.push('/dashboard');
        } else {
          router.push('/team');
        }
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to activate account. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          maxWidth: '460px',
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
          Activate Your Account
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            textAlign: 'center',
            color: '#475569',
            marginBottom: '2rem',
          }}
        >
          Set your personal password to join your field operations workspace
        </p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748B' }}>
            <div style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
              Verifying activation token...
            </div>
            <div style={{ fontSize: '0.8125rem' }}>
              Please wait while we validate your invitation.
            </div>
          </div>
        ) : validationError ? (
          <div>
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '1rem',
                color: '#DC2626',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              <strong>Activation Error:</strong>
              <div style={{ marginTop: '0.25rem' }}>{validationError}</div>
            </div>
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#64748B',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}
            >
              If your link has expired or has already been used, please request a new invitation
              link from your workspace administrator.
            </p>
            <Link
              href="/auth/signin"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: '#F1F5F9',
                color: '#334155',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                textDecoration: 'none',
              }}
            >
              Return to Sign In
            </Link>
          </div>
        ) : isSuccess ? (
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #6EE7B7',
              borderRadius: '8px',
              padding: '1.5rem',
              color: '#065F46',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Account Activated!
            </div>
            <div style={{ fontSize: '0.875rem', color: '#047857' }}>
              Redirecting you to your workspace dashboard...
            </div>
          </div>
        ) : (
          <div>
            {invitation && (
              <div
                style={{
                  backgroundColor: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#0369A1',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  Workspace Invitation
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0F172A',
                    fontSize: '1rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {invitation.workspaceName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem' }}>
                  Invited as: <strong>{invitation.roleName}</strong> ({invitation.email})
                </div>
              </div>
            )}

            {submitError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#DC2626',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                }}
              >
                {submitError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '0.375rem',
                  }}
                >
                  Create Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    color: '#0F172A',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '0.375rem',
                  }}
                >
                  Confirm Password <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    color: '#0F172A',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '8px',
                  backgroundColor: '#164CFF',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 2px 4px rgba(22, 76, 255, 0.2)',
                  marginTop: '0.5rem',
                }}
              >
                {isSubmitting ? 'Activating Account...' : 'Set Password & Activate'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Loading...
        </div>
      }
    >
      <ActivateContent />
    </Suspense>
  );
}
