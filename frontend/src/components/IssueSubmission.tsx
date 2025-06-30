'use client';

import { useState } from 'react';
import { PluginAPI } from '../utils/auth';

interface Plugin {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  status: string;
  latestVersion: string;
  author: string;
}

interface IssueSubmissionProps {
  plugin: Plugin;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function IssueSubmission({ plugin, onSuccess, onError }: IssueSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const [autoSubmitLoading, setAutoSubmitLoading] = useState(false);

  const handleAutoSubmit = async () => {
    setAutoSubmitLoading(true);
    try {
      const response = await PluginAPI.createAstrBotIssue(plugin.id);
      if (response.success) {
        onSuccess?.();
        // 打开创建的Issue
        window.open(response.data.issueUrl, '_blank');
      } else {
        onError?.('Failed to create issue automatically');
      }
    } catch (error: any) {
      console.error('Auto submit error:', error);
      onError?.(error.message || 'Failed to create issue automatically');
    } finally {
      setAutoSubmitLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    setLoading(true);
    try {
      const response = await PluginAPI.getManualIssueUrl(plugin.id);
      if (response.success) {
        // 打开GitHub Issue创建页面
        window.open(response.data.issueUrl, '_blank');
        onSuccess?.();
      } else {
        onError?.('Failed to generate manual issue URL');
      }
    } catch (error: any) {
      console.error('Manual submit error:', error);
      onError?.(error.message || 'Failed to generate manual issue URL');
    } finally {
      setLoading(false);
    }
  };

  if (plugin.status !== 'APPROVED') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Plugin Not Approved</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Only approved plugins can be submitted to the AstrBot repository. 
              Current status: <span className="font-semibold">{plugin.status}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Submit to AstrBot Repository
        </h3>
        <p className="text-sm text-gray-600">
          Your plugin <strong>{plugin.name}</strong> has been approved! 
          You can now submit it to the official AstrBot plugin repository.
        </p>
      </div>

      <div className="space-y-4">
        {/* Auto Submit Option */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">🤖 Automatic Submission</h4>
          <p className="text-sm text-gray-600 mb-3">
            We'll automatically create an issue in the AstrBot repository with your plugin information.
          </p>
          <button
            onClick={handleAutoSubmit}
            disabled={autoSubmitLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {autoSubmitLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Issue...
              </>
            ) : (
              'Auto Submit Issue'
            )}
          </button>
        </div>

        {/* Manual Submit Option */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">✋ Manual Submission</h4>
          <p className="text-sm text-gray-600 mb-3">
            Open the GitHub issue creation page with pre-filled information. You can review and modify before submitting.
          </p>
          <button
            onClick={handleManualSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating URL...
              </>
            ) : (
              'Manual Submit Issue'
            )}
          </button>
        </div>

        {/* Direct Link */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            You can also visit the{' '}
            <a 
              href="https://github.com/AstrBotDevs/AstrBot/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              AstrBot Issues page
            </a>{' '}
            directly to create an issue manually.
          </p>
        </div>
      </div>
    </div>
  );
}
