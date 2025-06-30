'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Disclaimer } from '../../components/Disclaimer';
import { Footer } from '../../components/Footer';
import { GPGKeyManager } from '../../components/GPGKeyManager';
import PluginManager from '../../components/PluginManager';
import PluginSubmissionSuccess from '../../components/PluginSubmissionSuccess';

import { AuthTokenManager, ApiClient } from '../../utils/auth';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string;
}

interface SubmitResponse {
  id: string;
  message: string;
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

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('plugins');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedPlugin, setSubmittedPlugin] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      AuthTokenManager.setToken(token, 24 * 3600); // 24 hours
      window.history.replaceState({}, document.title, '/dashboard');
    }

    if (!AuthTokenManager.isTokenValid()) {
      AuthTokenManager.redirectToLogin();
      return;
    }

    const fetchRepos = async () => {
      try {
        const data = await ApiClient.get<Repo[]>('/plugins/github/repos');
        setRepos(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [searchParams]);

  const handleSubmit = async (repo: Repo) => {
    setSubmitting(repo.id);
    try {
      const result = await ApiClient.post<SubmitResponse>('/plugins/submit', {
        repoUrl: `https://github.com/${repo.full_name}`,
      });

      // 设置提交成功的插件信息
      setSubmittedPlugin({
        id: result.id,
        name: repo.name,
        description: repo.description || 'No description provided',
        repoUrl: `https://github.com/${repo.full_name}`,
        status: 'PENDING',
        latestVersion: '1.0.0', // 默认版本
        author: repo.full_name.split('/')[0] // 从仓库全名中提取作者
      });

      // 显示成功模态窗口
      setShowSuccessModal(true);
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('An unknown error occurred during submission.');
      }
    } finally {
      setSubmitting(null);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSubmittedPlugin(null);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your repositories..." />;
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
            <h3 className="text-lg font-medium text-gray-900">Error Loading Dashboard</h3>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Disclaimer */}
          <div className="mb-8">
            <Disclaimer />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Developer Dashboard</h1>
            <p className="text-gray-600">Manage your plugins and submit new ones for review</p>
          </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('plugins')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'plugins'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Plugins
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Submit New Plugin
              </button>
              <button
                onClick={() => setActiveTab('gpg')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gpg'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                GPG Keys
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'plugins' && (
          <PluginManager />
        )}

        {activeTab === 'gpg' && (
          <GPGKeyManager />
        )}

        {activeTab === 'submit' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Submit New Plugin</h2>
              <p className="text-gray-600 mb-6">Select a repository from your GitHub account to submit as a plugin.</p>
            </div>
            {repos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No repositories found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any repositories that can be submitted as plugins.
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {repos.map((repo) => (
                <motion.div
                  key={repo.id}
                  className="border rounded-lg p-4 shadow-sm bg-white flex flex-col"
                  variants={itemVariants}
                >
                  <h3 className="text-xl font-semibold">{repo.name}</h3>
                  <p className="text-gray-600 mt-2 flex-grow">{repo.description || 'No description'}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleSubmit(repo)}
                      disabled={submitting === repo.id}
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                      {submitting === repo.id ? 'Submitting...' : 'Submit Plugin'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Plugin Submission Requirements</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Repository must contain a <code className="bg-blue-100 px-1 rounded">metadata.yaml</code> file in the root directory</li>
                <li>• The metadata file should include: name, author, version, description, and repo URL</li>
                <li>• Code will be automatically reviewed for security issues</li>
                <li>• Approved plugins will appear in the public marketplace</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
        </div>
      </div>

      {/* Plugin Submission Success Modal */}
      {showSuccessModal && submittedPlugin && (
        <PluginSubmissionSuccess
          plugin={submittedPlugin}
          onClose={handleCloseSuccessModal}
        />
      )}
    </ErrorBoundary>
  );
}
