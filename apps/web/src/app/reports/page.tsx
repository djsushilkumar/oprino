'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderNav } from '../../components/HeaderNav';
import { Icon } from '../../components/Icon';
import { webApi } from '../../lib/api';
import type {
  MeResponse,
  AttendanceReportResponse,
  TaskSlaReportResponse,
  VisitReportResponse,
} from '@oprino/contracts';

export default function ReportsPage() {
  const router = useRouter();
  const [context, setContext] = useState<MeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'tasks' | 'visits'>('attendance');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date Filters (default: current month)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Report Data States
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportResponse | null>(null);
  const [taskSlaReport, setTaskSlaReport] = useState<TaskSlaReportResponse | null>(null);
  const [visitReport, setVisitReport] = useState<VisitReportResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const meRes = await webApi.getMe();
      if (!meRes.activeWorkspace) {
        router.push('/onboarding/workspace');
        return;
      }
      setContext(meRes);

      const [attRes, taskRes, visRes] = await Promise.all([
        webApi.getAttendanceReport({ startDate, endDate }),
        webApi.getTaskSlaReport({ startDate, endDate }),
        webApi.getVisitReport({ startDate, endDate }),
      ]);

      setAttendanceReport(attRes);
      setTaskSlaReport(taskRes);
      setVisitReport(visRes);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/signin');
      } else {
        setError(err.message || 'Failed to load operational reports');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSignOut = async () => {
    await webApi.signOut();
    router.push('/auth/signin');
  };

  const handleDownloadCsv = () => {
    const url = webApi.getAttendanceCsvUrl({ startDate, endDate });
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <HeaderNav context={context} onSignOut={handleSignOut} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 flex items-center justify-center">
                <Icon name="reports" size={20} color="#818CF8" />
              </span>
              Operational Reports & Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Authoritative workforce metrics, task SLA compliance, and customer site audit logs.
            </p>
          </div>

          {/* Date Range Selectors & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <label htmlFor="report-start-date" className="text-xs font-semibold text-slate-400 uppercase">From:</label>
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <label htmlFor="report-end-date" className="text-xs font-semibold text-slate-400 uppercase">To:</label>
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleDownloadCsv}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
            >
              <Icon name="download" size={16} color="#FFFFFF" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon name="clock" size={16} color={activeTab === 'attendance' ? '#FFFFFF' : '#94A3B8'} />
            <span>Attendance Summary</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon name="tasks" size={16} color={activeTab === 'tasks' ? '#FFFFFF' : '#94A3B8'} />
            <span>Task SLAs & Completion</span>
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'visits'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon name="visits" size={16} color={activeTab === 'visits' ? '#FFFFFF' : '#94A3B8'} />
            <span>Customer Visits Audit</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {isLoading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mb-2"></div>
            <p>Compiling operational analytics...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: ATTENDANCE SUMMARY */}
            {activeTab === 'attendance' && attendanceReport && (
              <div className="flex flex-col gap-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Total Company Hours</p>
                    <p className="text-3xl font-black text-indigo-400 mt-2">
                      {attendanceReport.totalCompanyHours} hrs
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Active Staff</p>
                    <p className="text-3xl font-black text-white mt-2">
                      {attendanceReport.totalEmployees}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Total Late Incidents</p>
                    <p className="text-3xl font-black text-amber-400 mt-2">
                      {(attendanceReport.items ?? []).reduce((acc, i) => acc + (i.lateDays || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Avg Hours / Member</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">
                      {attendanceReport.totalEmployees > 0
                        ? Math.round(
                            (attendanceReport.totalCompanyHours / attendanceReport.totalEmployees) * 10
                          ) / 10
                        : 0}{' '}
                      hrs
                    </p>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-slate-800/80 rounded-2xl border border-slate-700/60 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 text-xs uppercase font-bold">
                          <th className="p-4">Employee</th>
                          <th className="p-4">Email</th>
                          <th className="p-4 text-center">Present Days</th>
                          <th className="p-4 text-center">Duty Hours</th>
                          <th className="p-4 text-center">Late Days</th>
                          <th className="p-4 text-center">Late Minutes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {(!attendanceReport.items || attendanceReport.items.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              No attendance records found for this period.
                            </td>
                          </tr>
                        ) : (
                          attendanceReport.items.map((item) => (
                            <tr key={item.userId} className="hover:bg-slate-700/30 transition-colors">
                              <td className="p-4 font-bold text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-black text-indigo-400">
                                  {item.userName.charAt(0)}
                                </span>
                                {item.userName}
                              </td>
                              <td className="p-4 text-slate-400">{item.userEmail}</td>
                              <td className="p-4 text-center font-bold text-emerald-400">
                                {item.presentDays}
                              </td>
                              <td className="p-4 text-center font-mono font-bold text-indigo-400">
                                {item.totalHours} hrs
                              </td>
                              <td className="p-4 text-center">
                                {item.lateDays > 0 ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    {item.lateDays} days
                                  </span>
                                ) : (
                                  <span className="text-slate-500">0</span>
                                )}
                              </td>
                              <td className="p-4 text-center font-mono text-slate-400">
                                {item.totalLateMinutes} m
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TASK SLA REPORT */}
            {activeTab === 'tasks' && taskSlaReport && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Total Tasks</p>
                    <p className="text-3xl font-black text-white mt-2">
                      {taskSlaReport.totalTasks}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Completed</p>
                    <p className="text-3xl font-black text-indigo-400 mt-2">
                      {taskSlaReport.completedTasks}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Verified</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">
                      {taskSlaReport.verifiedTasks}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Overdue SLA</p>
                    <p className="text-3xl font-black text-rose-400 mt-2">
                      {taskSlaReport.overdueTasks}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">On-Time Rate</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">
                      {taskSlaReport.onTimeRate}%
                    </p>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60">
                  <h3 className="font-bold text-white mb-4">Task Status Distribution</h3>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(taskSlaReport.statusDistribution ?? {}).map(([status, count]) => (
                      <div
                        key={status}
                        className="p-4 bg-slate-900/60 rounded-xl border border-slate-700 flex items-center gap-3 min-w-[140px]"
                      >
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                        <div>
                          <p className="text-xs font-bold text-slate-400">{status}</p>
                          <p className="text-xl font-black text-white">{count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VISITS REPORT */}
            {activeTab === 'visits' && visitReport && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Total Stops</p>
                    <p className="text-3xl font-black text-white mt-2">
                      {visitReport.totalVisits}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Completed Stops</p>
                    <p className="text-3xl font-black text-emerald-400 mt-2">
                      {visitReport.completedVisits}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Total Time on Site</p>
                    <p className="text-3xl font-black text-indigo-400 mt-2">
                      {visitReport.totalDurationMinutes} mins
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60">
                    <p className="text-xs uppercase font-bold text-slate-400">Average Duration</p>
                    <p className="text-3xl font-black text-amber-400 mt-2">
                      {visitReport.averageDurationMinutes} mins
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
