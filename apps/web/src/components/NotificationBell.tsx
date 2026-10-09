'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { webApi } from '../lib/api';
import type { Notification } from '@oprino/contracts';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await webApi.listNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // Graceful fallback for non-authenticated or network issues
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await webApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await webApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TASK_OVERDUE':
      case 'PROOF_REJECTED':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'MISSED_SHIFT':
        return { bg: '#FFEDD5', text: '#EA580C' };
      case 'TASK_ASSIGNED':
        return { bg: '#EFF6FF', text: '#2563EB' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '0.45rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          backgroundColor: isOpen ? '#F1F5F9' : '#FFFFFF',
          transition: 'all 0.15s ease',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '9999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.1rem 0.35rem',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            maxHeight: '440px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FAFAFA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#EEF2FF',
                    color: '#4F46E5',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4F46E5',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Body / Notification List */}
          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '360px',
            }}
          >
            {isLoading && notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8125rem' }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>No notifications yet</p>
                <p style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
                  Operational and dispatch alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const typeBadge = getTypeBadge(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) handleMarkAsRead(n.id);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #F8FAFC',
                      backgroundColor: n.isRead ? '#FFFFFF' : '#F8FAFC',
                      cursor: n.isRead ? 'default' : 'pointer',
                      transition: 'background-color 0.1s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: n.isRead ? 600 : 700,
                          color: '#1E293B',
                          lineHeight: 1.3,
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          backgroundColor: typeBadge.bg,
                          color: typeBadge.text,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {n.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: '#64748B',
                        lineHeight: 1.4,
                      }}
                    >
                      {n.body}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!n.isRead && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#4F46E5',
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
