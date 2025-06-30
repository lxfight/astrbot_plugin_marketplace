'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiClient } from '../utils/auth';

interface GPGKey {
  id: string;
  keyId: string;
  fingerprint: string;
  keyType: string;
  keySize: number;
  userIds: string[];
  status: 'pending' | 'verified' | 'revoked' | 'expired';
  creationTime: string;
  expirationTime?: string;
  verifiedAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

interface GPGKeyManagerProps {
  className?: string;
}

export function GPGKeyManager({ className = '' }: GPGKeyManagerProps) {
  const [keys, setKeys] = useState<GPGKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState<string | null>(null);
  const [importKey, setImportKey] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const response = await ApiClient.get('/gpg/keys');
      if (response.data.success) {
        setKeys(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load GPG keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportKey = async () => {
    if (!importKey.trim()) return;

    try {
      setLoading(true);
      const response = await ApiClient.post('/gpg/keys/import', {
        publicKey: importKey
      });

      if (response.data.success) {
        setVerificationToken(response.data.data.verificationToken);
        setImportKey('');
        setShowImportForm(false);
        await loadKeys();
        
        // 自动显示验证表单
        setShowVerifyForm(response.data.data.keyId);
      }
    } catch (error: any) {
      alert(`Failed to import key: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKey = async (keyId: string) => {
    if (!verifyMessage.trim()) return;

    try {
      setLoading(true);
      const response = await ApiClient.post('/gpg/keys/verify', {
        keyId,
        signedMessage: verifyMessage
      });

      if (response.data.success) {
        setVerifyMessage('');
        setShowVerifyForm(null);
        setVerificationToken('');
        await loadKeys();
        alert('GPG key verified successfully!');
      }
    } catch (error: any) {
      alert(`Verification failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this GPG key? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await ApiClient.delete(`/gpg/keys/${keyId}`);

      if (response.data.success) {
        await loadKeys();
        alert('GPG key revoked successfully');
      }
    } catch (error: any) {
      alert(`Failed to revoke key: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'revoked': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'revoked':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading && keys.length === 0) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">GPG Keys</h3>
            <p className="text-sm text-gray-500">Manage your GPG keys for plugin signing</p>
          </div>
          <button
            onClick={() => setShowImportForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Import Key
          </button>
        </div>

        {/* Import Form */}
        <AnimatePresence>
          {showImportForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-gray-50 rounded-lg border"
            >
              <h4 className="text-md font-medium text-gray-900 mb-3">Import GPG Public Key</h4>
              <textarea
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                placeholder="Paste your GPG public key here (-----BEGIN PGP PUBLIC KEY BLOCK-----)"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <div className="flex justify-end space-x-3 mt-3">
                <button
                  onClick={() => setShowImportForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportKey}
                  disabled={!importKey.trim() || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Import Key
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keys List */}
        {keys.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No GPG keys</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by importing your first GPG key.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(key.status)}`}>
                        {getStatusIcon(key.status)}
                        <span className="ml-1 capitalize">{key.status}</span>
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {key.keyType} {key.keySize}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><strong>Key ID:</strong> <code className="bg-gray-100 px-1 rounded">{key.keyId}</code></div>
                      <div><strong>Fingerprint:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{key.fingerprint}</code></div>
                      <div><strong>User IDs:</strong> {key.userIds.join(', ')}</div>
                      <div><strong>Created:</strong> {new Date(key.creationTime).toLocaleDateString()}</div>
                      {key.expirationTime && (
                        <div><strong>Expires:</strong> {new Date(key.expirationTime).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {key.status === 'pending' && (
                      <button
                        onClick={() => setShowVerifyForm(key.keyId)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Verify
                      </button>
                    )}
                    {key.status === 'verified' && (
                      <button
                        onClick={() => handleRevokeKey(key.keyId)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>

                {/* Verification Form */}
                <AnimatePresence>
                  {showVerifyForm === key.keyId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-3 bg-blue-50 rounded border"
                    >
                      <h5 className="text-sm font-medium text-blue-900 mb-2">Verify Key Ownership</h5>
                      {verificationToken && (
                        <div className="mb-3 p-2 bg-white rounded border">
                          <p className="text-xs text-gray-600 mb-1">Sign this message with your private key:</p>
                          <code className="text-xs bg-gray-100 p-1 rounded block">{verificationToken}</code>
                        </div>
                      )}
                      <textarea
                        value={verifyMessage}
                        onChange={(e) => setVerifyMessage(e.target.value)}
                        placeholder="Paste the signed message here"
                        className="w-full h-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => setShowVerifyForm(null)}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleVerifyKey(key.keyId)}
                          disabled={!verifyMessage.trim() || loading}
                          className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Verify
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
