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

interface PluginSubmissionSuccessProps {
  plugin: Plugin;
  onClose: () => void;
}

export default function PluginSubmissionSuccess({ plugin, onClose }: PluginSubmissionSuccessProps) {
  const [autoSubmitLoading, setAutoSubmitLoading] = useState(false);
  const [manualSubmitLoading, setManualSubmitLoading] = useState(false);

  const handleAutoSubmit = async () => {
    setAutoSubmitLoading(true);
    try {
      // 由于插件刚提交，状态是PENDING，我们需要直接生成Issue内容
      const issueContent = generateIssueContent(plugin);
      const issueUrl = generateGitHubIssueUrl(issueContent);

      // 打开GitHub Issue创建页面
      window.open(issueUrl, '_blank');
      alert(`GitHub Issue template opened with plugin "${plugin.name}". Please fill in the JSON information and submit the issue.`);
    } catch (error: any) {
      console.error('Auto submit error:', error);
      alert(`Failed to create issue: ${error.message || 'Unknown error'}`);
    } finally {
      setAutoSubmitLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    setManualSubmitLoading(true);
    try {
      // 生成Issue内容并打开GitHub页面
      const issueContent = generateIssueContent(plugin);
      const issueUrl = generateGitHubIssueUrl(issueContent);

      // 打开GitHub Issue创建页面
      window.open(issueUrl, '_blank');
      alert(`GitHub Issue template opened with plugin "${plugin.name}". Please fill in the JSON information and submit the issue.`);
    } finally {
      setManualSubmitLoading(false);
    }
  };

  const generateIssueContent = (plugin: Plugin) => {
    // 使用模板时，标题会从模板的YAML前置元数据中获取，我们只需要替换插件名
    const title = `[Plugin] ${plugin.name}`;

    // 生成预填充的JSON内容，这将替换模板中的默认值
    const pluginJson = {
      "name": plugin.name,
      "desc": plugin.description,
      "repo": plugin.repoUrl,
      "tags": [],
      "social_link": ""
    };

    // 将JSON转换为格式化的字符串，用于预填充
    const jsonString = JSON.stringify(pluginJson, null, 2);

    return { title, jsonString };
  };

  const generateGitHubIssueUrl = (issueContent: { title: string; jsonString: string }) => {
    // 使用GitHub的Issue模板，并预填充插件名称到标题中
    const params = new URLSearchParams({
      template: 'PLUGIN_PUBLISH.md',
      title: issueContent.title
    });

    return `https://github.com/AstrBotDevs/AstrBot/issues/new?${params.toString()}`;
  };

  const handleDirectLink = () => {
    window.open('https://github.com/AstrBotDevs/AstrBot/issues', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Plugin Submitted Successfully!</h3>
              <p className="text-sm text-gray-500">Your plugin "{plugin.name}" has been submitted for review.</p>
            </div>
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

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">📋 Next Steps</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your plugin will undergo automated security review</li>
              <li>• Once approved, you can submit it to the official AstrBot repository</li>
              <li>• You'll be notified when the review is complete</li>
            </ul>
          </div>

          <h4 className="text-lg font-medium text-gray-900 mb-4">
            🚀 Submit to AstrBot Official Repository
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Would you like to submit your plugin to the official AstrBot repository now?
            This will open GitHub's official plugin submission template with your plugin name pre-filled.
          </p>

          {/* Plugin Information Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h5 className="font-medium text-gray-900 mb-2">📋 Plugin Information to Fill</h5>
            <p className="text-sm text-gray-600 mb-2">
              You'll need to copy and paste this JSON into the GitHub template:
            </p>
            <pre className="bg-white border border-gray-200 rounded p-3 text-xs overflow-x-auto">
{JSON.stringify({
  "name": plugin.name,
  "desc": plugin.description,
  "repo": plugin.repoUrl,
  "tags": [],
  "social_link": ""
}, null, 2)}
            </pre>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quick Submit Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">⚡ Quick Submit (Recommended)</h5>
            <p className="text-sm text-gray-600 mb-3">
              Open GitHub's official plugin submission template with your plugin name pre-filled. You'll need to fill in the JSON information manually.
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
                  Opening GitHub...
                </>
              ) : (
                'Quick Submit to AstrBot'
              )}
            </button>
          </div>

          {/* Alternative Submit Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">📝 Alternative Submit</h5>
            <p className="text-sm text-gray-600 mb-3">
              Same as above - opens the official GitHub template. Both options do the same thing.
            </p>
            <button
              onClick={handleManualSubmit}
              disabled={manualSubmitLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {manualSubmitLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Opening GitHub...
                </>
              ) : (
                'Submit to AstrBot'
              )}
            </button>
          </div>

          {/* Direct Link Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">🔗 Direct Link</h5>
            <p className="text-sm text-gray-600 mb-3">
              Visit the AstrBot Issues page directly to create an issue manually.
            </p>
            <button
              onClick={handleDirectLink}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Open AstrBot Issues
            </button>
          </div>

          {/* Skip Option */}
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Skip for Now
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              You can always submit to AstrBot later from your plugin management page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
