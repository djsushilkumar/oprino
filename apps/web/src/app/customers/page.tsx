'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi, getStoredToken } from '../../lib/api';
import type { MeResponse, Customer, CustomerSite } from '@oprino/contracts';

export default function CustomersPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sitesByCustomer, setSitesByCustomer] = useState<Record<string, CustomerSite[]>>({});
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custCompanyName, setCustCompanyName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

  // Create Site Modal State
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [targetCustomerIdForSite, setTargetCustomerIdForSite] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteLatitude, setSiteLatitude] = useState('');
  const [siteLongitude, setSiteLongitude] = useState('');
  const [siteRadius, setSiteRadius] = useState('100');
  const [siteContactName, setSiteContactName] = useState('');
  const [siteContactPhone, setSiteContactPhone] = useState('');
  const [isSubmittingSite, setIsSubmittingSite] = useState(false);

  const loadData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const meRes = await webApi.getMe();
      if (!meRes.activeWorkspace) {
        router.push('/onboarding/workspace');
        return;
      }
      setContext(meRes);

      const custList = await webApi.listCustomers(searchQuery || undefined);
      setCustomers(custList.customers);

      // Load sites for all customers in parallel
      const sitesMap: Record<string, CustomerSite[]> = {};
      await Promise.all(
        custList.customers.map(async (c) => {
          try {
            const sitesRes = await webApi.listCustomerSites(c.id);
            sitesMap[c.id] = sitesRes.sites;
          } catch {
            sitesMap[c.id] = [];
          }
        }),
      );
      setSitesByCustomer(sitesMap);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load customers');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSignOut = async () => {
    await webApi.signOut();
    router.push('/auth/signin');
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    try {
      setIsSubmittingCustomer(true);
      setError(null);
      await webApi.createCustomer({
        name: custName.trim(),
        companyName: custCompanyName.trim() || undefined,
        email: custEmail.trim() || undefined,
        phone: custPhone.trim() || undefined,
        notes: custNotes.trim() || undefined,
      });

      setIsCustomerModalOpen(false);
      setCustName('');
      setCustCompanyName('');
      setCustEmail('');
      setCustPhone('');
      setCustNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomerIdForSite || !siteName.trim() || !siteAddress.trim()) return;

    try {
      setIsSubmittingSite(true);
      setError(null);
      await webApi.createCustomerSite(targetCustomerIdForSite, {
        name: siteName.trim(),
        address: siteAddress.trim(),
        latitude: siteLatitude ? Number.parseFloat(siteLatitude) : undefined,
        longitude: siteLongitude ? Number.parseFloat(siteLongitude) : undefined,
        geofenceRadiusMeters: siteRadius ? Number.parseFloat(siteRadius) : 100.0,
        contactName: siteContactName.trim() || undefined,
        contactPhone: siteContactPhone.trim() || undefined,
      });

      setIsSiteModalOpen(false);
      setSiteName('');
      setSiteAddress('');
      setSiteLatitude('');
      setSiteLongitude('');
      setSiteRadius('100');
      setSiteContactName('');
      setSiteContactPhone('');

      // Refresh sites
      const sitesRes = await webApi.listCustomerSites(targetCustomerIdForSite);
      setSitesByCustomer((prev) => ({ ...prev, [targetCustomerIdForSite]: sitesRes.sites }));
    } catch (err: any) {
      setError(err.message || 'Failed to create customer site');
    } finally {
      setIsSubmittingSite(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main
        style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Customers & Customer Sites
            </h1>
            <p style={{ color: '#64748B', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Manage corporate clients, branch facilities, and GPS dispatch locations
            </p>
          </div>

          <button
            onClick={() => setIsCustomerModalOpen(true)}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            <span>+</span> Add Customer
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by customer name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: '#FFFFFF',
            }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#991B1B',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748B' }}>
            Loading customers and physical sites...
          </div>
        ) : customers.length === 0 ? (
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px dashed #CBD5E1',
            }}
          >
            <p style={{ fontSize: '1rem', color: '#64748B', marginBottom: '1rem' }}>
              No customers found in this workspace.
            </p>
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Add First Customer
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {customers.map((cust) => {
              const sites = sitesByCustomer[cust.id] || [];
              const isExpanded = expandedCustomerId === cust.id;

              return (
                <div
                  key={cust.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                    }}
                    onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.125rem',
                        }}
                      >
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A' }}>
                            {cust.name}
                          </span>
                          {cust.companyName && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: '#64748B',
                                backgroundColor: '#F1F5F9',
                                padding: '0.1rem 0.5rem',
                                borderRadius: '4px',
                              }}
                            >
                              {cust.companyName}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            marginTop: '0.25rem',
                            fontSize: '0.8125rem',
                            color: '#64748B',
                          }}
                        >
                          {cust.email && <span>✉ {cust.email}</span>}
                          {cust.phone && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <Icon name="phone" size={12} color="#64748B" />
                              {cust.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.625rem',
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          borderRadius: '9999px',
                          fontWeight: 600,
                        }}
                      >
                        {sites.length} {sites.length === 1 ? 'Site' : 'Sites'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetCustomerIdForSite(cust.id);
                          setIsSiteModalOpen(true);
                        }}
                        style={{
                          padding: '0.4rem 0.75rem',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Add Site
                      </button>
                      <span style={{ color: '#94A3B8', fontSize: '1rem' }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Sites List */}
                  {isExpanded && (
                    <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#FAFAFA' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: '#475569',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Registered Customer Facilities & Depots
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCustomerIdForSite(cust.id);
                            setIsSiteModalOpen(true);
                          }}
                          style={{
                            padding: '0.3rem 0.75rem',
                            backgroundColor: '#4F46E5',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          + Add Facility
                        </button>
                      </div>

                      {sites.length === 0 ? (
                        <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0.5rem 0' }}>
                          No physical sites registered yet. Add a facility to dispatch visits and
                          enforce geofenced attendance.
                        </p>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '1rem',
                          }}
                        >
                          {sites.map((site) => (
                            <div
                              key={site.id}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '1rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                              }}
                            >
                              <div
                                style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem' }}
                              >
                                {site.name}
                              </div>
                              <div
                                style={{
                                  color: '#64748B',
                                  fontSize: '0.8125rem',
                                  marginTop: '0.25rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <Icon name="pin" size={13} color="#64748B" />
                                <span>{site.address}</span>
                              </div>

                              <div
                                style={{
                                  marginTop: '0.75rem',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {site.latitude != null && site.longitude != null && (
                                  <span
                                    style={{
                                      padding: '0.2rem 0.5rem',
                                      backgroundColor: '#F1F5F9',
                                      borderRadius: '4px',
                                      color: '#334155',
                                    }}
                                  >
                                    GPS: {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                                  </span>
                                )}
                                <span
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    backgroundColor: '#EEF2FF',
                                    borderRadius: '4px',
                                    color: '#4F46E5',
                                    fontWeight: 600,
                                  }}
                                >
                                  Geofence: {site.geofenceRadiusMeters}m
                                </span>
                              </div>

                              {(site.contactName || site.contactPhone) && (
                                <div
                                  style={{
                                    marginTop: '0.75rem',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid #F1F5F9',
                                    fontSize: '0.75rem',
                                    color: '#64748B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                  }}
                                >
                                  <Icon name="user" size={12} color="#64748B" />
                                  <span>
                                    {site.contactName || 'On-site Lead'}{' '}
                                    {site.contactPhone && `(${site.contactPhone})`}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Customer Modal */}
        {isCustomerModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '520px',
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: 0 }}>
                Register New Customer
              </h2>
              <form onSubmit={handleCreateCustomer}>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Customer / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Apex Facilities Management"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Company / Entity Name
                  </label>
                  <input
                    type="text"
                    value={custCompanyName}
                    onChange={(e) => setCustCompanyName(e.target.value)}
                    placeholder="e.g. Apex Corporate Group"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="client@apex.com"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="+1-555-0100"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Operational Notes
                  </label>
                  <textarea
                    rows={3}
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="Key contractual terms, gate codes, or site preferences..."
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#F1F5F9',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCustomer}
                    style={{
                      padding: '0.5rem 1.25rem',
                      backgroundColor: '#4F46E5',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    {isSubmittingCustomer ? 'Saving...' : 'Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Site Modal */}
        {isSiteModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '520px',
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: 0 }}>
                Register Customer Facility / Site
              </h2>
              <form onSubmit={handleCreateSite}>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Facility / Depot Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. North Distribution Hub"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Physical Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="742 Evergreen Terrace, Springfield"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={siteLatitude}
                      onChange={(e) => setSiteLatitude(e.target.value)}
                      placeholder="28.6139"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={siteLongitude}
                      onChange={(e) => setSiteLongitude(e.target.value)}
                      placeholder="77.2090"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Radius (m)
                    </label>
                    <input
                      type="number"
                      value={siteRadius}
                      onChange={(e) => setSiteRadius(e.target.value)}
                      placeholder="100"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Site Contact Person
                    </label>
                    <input
                      type="text"
                      value={siteContactName}
                      onChange={(e) => setSiteContactName(e.target.value)}
                      placeholder="John Depot Manager"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                        marginBottom: '0.25rem',
                      }}
                    >
                      Site Contact Phone
                    </label>
                    <input
                      type="text"
                      value={siteContactPhone}
                      onChange={(e) => setSiteContactPhone(e.target.value)}
                      placeholder="+1-555-0105"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsSiteModalOpen(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#F1F5F9',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSite}
                    style={{
                      padding: '0.5rem 1.25rem',
                      backgroundColor: '#4F46E5',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    {isSubmittingSite ? 'Saving...' : 'Register Facility'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
