'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Disclaimer } from '../../components/Disclaimer';
import { Footer } from '../../components/Footer';
import { ApiClient } from '../../utils/auth';

interface AuditReport {
  id: string;
  pluginId: string;
  pluginName: string;
  version: string;
  status: 'success' | 'failure';
  isSafe: boolean;
  reportSummary: string;
  rawReport: any;
  isPublic: boolean;
  createdAt: string;
  plugin?: {
    name: string;
    author: string;
    repoUrl: string;
    status: string;
  };
}

interface AuditStatistics {
  totalAudits: number;
  successfulAudits: number;
  failedAudits: number;
  safePlugins: number;
  unsafePlugins: number;
  recentAudits: AuditReport[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<AuditReport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [auditsData, statsData] = await Promise.all([
          ApiClient.get<AuditReport[]>('/audits?limit=100'),
          ApiClient.get<AuditStatistics>('/audits/statistics'),
        ]);
        setAudits(auditsData);
        setStatistics(statsData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load audit reports');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (audit: AuditReport) => {
    if (audit.status === 'failure') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
    }
    
    if (!audit.isSafe) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Unsafe</span>;
    }
    
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Safe</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading audit reports..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Error Loading Audit Reports</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Security Audit Reports</h1>
                <p className="mt-1 text-sm text-gray-500">AI-powered security analysis for all submitted plugins</p>
              </div>
              <div className="flex space-x-4">
                <a
                  href="/disclaimer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Disclaimer
                </a>
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ← Back to Marketplace
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Disclaimer />
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-gray-900">{statistics.totalAudits}</div>
                <div className="text-sm text-gray-500">Total Audits</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">{statistics.successfulAudits}</div>
                <div className="text-sm text-gray-500">Successful</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">{statistics.failedAudits}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-green-600">{statistics.safePlugins}</div>
                <div className="text-sm text-gray-500">Safe Plugins</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-2xl font-bold text-red-600">{statistics.unsafePlugins}</div>
                <div className="text-sm text-gray-500">Unsafe Plugins</div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Reports List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {audits.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audit reports found</h3>
              <p className="mt-1 text-sm text-gray-500">No plugins have been audited yet.</p>
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {audits.map((audit) => (
                <motion.div
                  key={audit.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  variants={itemVariants}
                  onClick={() => setSelectedAudit(audit)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{audit.pluginName}</h3>
                        {getStatusBadge(audit)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Version {audit.version} • {audit.plugin?.author} • {formatDate(audit.createdAt)}
                      </p>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{audit.reportSummary}</p>
                    </div>
                    <div className="ml-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Audit Detail Modal */}
        {selectedAudit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Audit Report Details</h3>
                  <button
                    onClick={() => setSelectedAudit(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plugin</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAudit.pluginName} v{selectedAudit.version}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedAudit)}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Audit Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedAudit.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Summary</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAudit.reportSummary}</p>
                  </div>
                  
                  {selectedAudit.rawReport && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Raw Report</label>
                      <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(selectedAudit.rawReport, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedAudit.plugin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Repository</label>
                      <a
                        href={selectedAudit.plugin.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        {selectedAudit.plugin.repoUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer is now in layout.tsx */}
      </div>
    </ErrorBoundary>
  );
}
