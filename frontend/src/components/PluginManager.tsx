'use client';

import { useState, useEffect } from 'react';
import { PluginAPI } from '../utils/auth';
import IssueSubmission from './IssueSubmission';
import PluginAuditReports from './PluginAuditReports';

interface Publisher {
  username: string;
  avatarUrl?: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  status: string;
  latestVersion: string;
  author: string; // The author from metadata
  publisher: Publisher; // The user who submitted the plugin
  createdAt: string;
  updatedAt: string;
}

export default function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [showIssueSubmission, setShowIssueSubmission] = useState(false);
  const [resubmitting, setResubmitting] = useState<string | null>(null);
  const [showAuditReports, setShowAuditReports] = useState(false);
  const [auditReportPlugin, setAuditReportPlugin] = useState<Plugin | null>(null);

  useEffect(() => {
    fetchUserPlugins();
  }, []);

  const fetchUserPlugins = async () => {
    try {
      setLoading(true);
      const data = await PluginAPI.getUserPlugins();
      setPlugins(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plugins');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'DELISTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'PENDING':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'REJECTED':
      case 'FAILED':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'DELISTED':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleIssueSubmission = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setShowIssueSubmission(true);
  };

  const handleIssueSuccess = () => {
    setShowIssueSubmission(false);
    setSelectedPlugin(null);
    // 可以在这里添加成功提示
  };

  const handleIssueError = (error: string) => {
    alert(`Error: ${error}`);
  };

  const handleResubmit = async (plugin: Plugin) => {
    if (!confirm(`Are you sure you want to resubmit "${plugin.name}"? This will reset the plugin status to pending and trigger a new review.`)) {
      return;
    }

    setResubmitting(plugin.id);
    try {
      const result = await PluginAPI.resubmitPlugin(plugin.repoUrl);
      alert(`Plugin "${plugin.name}" has been resubmitted successfully! It will undergo a new review process.`);

      // 刷新插件列表
      await fetchUserPlugins();
    } catch (err: any) {
      alert(`Failed to resubmit plugin: ${err.message || 'Unknown error'}`);
    } finally {
      setResubmitting(null);
    }
  };

  const handleViewAuditReports = (plugin: Plugin) => {
    setAuditReportPlugin(plugin);
    setShowAuditReports(true);
  };

  const handleCloseAuditReports = () => {
    setShowAuditReports(false);
    setAuditReportPlugin(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading your plugins...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Plugins</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchUserPlugins}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Plugins</h2>
        <span className="text-sm text-gray-500">{plugins.length} plugin(s)</span>
      </div>

      {plugins.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins submitted</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by submitting your first plugin from the repositories below.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <div key={plugin.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{plugin.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plugin.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>Version: v{plugin.latestVersion}</p>
                    <p>Author: {plugin.author}</p>
                    <p className="flex items-center">
                      Publisher:
                      <a
                        href={`https://github.com/${plugin.publisher.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:underline flex items-center"
                      >
                        {plugin.publisher.avatarUrl && (
                          <img src={plugin.publisher.avatarUrl} alt={plugin.publisher.username} className="w-4 h-4 rounded-full mr-1" />
                        )}
                        {plugin.publisher.username}
                      </a>
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plugin.status)}`}>
                      {getStatusIcon(plugin.status)}
                      <span className="ml-1">{plugin.status}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      {plugin.status === 'APPROVED' && (
                        <button
                          onClick={() => handleIssueSubmission(plugin)}
                          className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                        >
                          Submit to AstrBot →
                        </button>
                      )}

                      {(plugin.status === 'FAILED' || plugin.status === 'REJECTED') && (
                        <button
                          onClick={() => handleResubmit(plugin)}
                          disabled={resubmitting === plugin.id}
                          className="text-xs text-orange-600 hover:text-orange-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resubmitting === plugin.id ? 'Resubmitting...' : 'Resubmit →'}
                        </button>
                      )}

                      <button
                        onClick={() => handleViewAuditReports(plugin)}
                        className="text-xs text-gray-600 hover:text-gray-500 font-medium"
                      >
                        🔍 Security Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <a
                  href={plugin.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  View Repository
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Submission Modal */}
      {showIssueSubmission && selectedPlugin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Submit Plugin to AstrBot</h3>
              <button
                onClick={() => setShowIssueSubmission(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <IssueSubmission
              plugin={selectedPlugin}
              onSuccess={handleIssueSuccess}
              onError={handleIssueError}
            />
          </div>
        </div>
      )}

      {/* Plugin Audit Reports Modal */}
      {showAuditReports && auditReportPlugin && (
        <PluginAuditReports
          plugin={auditReportPlugin}
          onClose={handleCloseAuditReports}
        />
      )}
    </div>
  );
}
