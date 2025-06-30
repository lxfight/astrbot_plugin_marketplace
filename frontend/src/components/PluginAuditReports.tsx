'use client';

import { useState, useEffect } from 'react';
import { PluginAPI } from '../utils/auth';

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

interface Plugin {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  status: string;
  latestVersion: string;
  author: string;
}

interface PluginAuditReportsProps {
  plugin: Plugin;
  onClose: () => void;
}

export default function PluginAuditReports({ plugin, onClose }: PluginAuditReportsProps) {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);

  useEffect(() => {
    fetchReports();
  }, [plugin.id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await PluginAPI.getMyPluginAudits(plugin.id);
      setReports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (report: AuditReport) => {
    if (report.status === 'success' && report.isSafe) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Safe
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⚠ Issues Found
        </span>
      );
    }
  };

  const getVisibilityBadge = (report: AuditReport) => {
    if (report.isPublic) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          👁 Public
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          🔒 Private
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading audit reports...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Security Audit Reports</h3>
            <p className="text-sm text-gray-500">Plugin: {plugin.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No audit reports found for this plugin.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">Version {report.version}</h4>
                      {getStatusBadge(report)}
                      {getVisibilityBadge(report)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{report.reportSummary}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!reports.some(r => !r.isPublic) && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ All your audit reports are public and can be viewed by everyone.
            </p>
          </div>
        )}

        {reports.some(r => !r.isPublic) && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-orange-800 text-sm">
              🔒 Some audit reports are private due to security concerns. These are only visible to you as the plugin author.
            </p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                Audit Report - Version {selectedReport.version}
              </h4>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex space-x-2">
                {getStatusBadge(selectedReport)}
                {getVisibilityBadge(selectedReport)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <p className="mt-1 text-sm text-gray-900">{selectedReport.reportSummary}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedReport.createdAt)}</p>
              </div>

              {selectedReport.rawReport && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Detailed Report</label>
                  <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(selectedReport.rawReport, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
