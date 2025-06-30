'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ApiClient } from '../utils/auth';

interface PluginSignature {
  id: string;
  version: string;
  signatureType: 'commit' | 'tag' | 'release' | 'metadata';
  status: 'valid' | 'invalid' | 'expired' | 'revoked' | 'unknown_key';
  signerKeyId: string;
  signerFingerprint: string;
  verificationDetails: {
    algorithm?: string;
    hashAlgorithm?: string;
    creationTime?: string;
    expirationTime?: string;
    trustLevel?: string;
    errorMessage?: string;
  };
  verifiedAt?: string;
  gitCommitHash?: string;
  gitTagName?: string;
  gpgKey?: {
    keyId: string;
    fingerprint: string;
    userIds: string[];
    status: string;
  };
  createdAt: string;
}

interface SignatureStatusProps {
  pluginId: string;
  className?: string;
}

export function SignatureStatus({ pluginId, className = '' }: SignatureStatusProps) {
  const [signatures, setSignatures] = useState<PluginSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadSignatures();
  }, [pluginId]);

  const loadSignatures = async () => {
    try {
      const response = await ApiClient.get(`/gpg/signatures/plugin/${pluginId}`);
      if (response.data.success) {
        setSignatures(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load signatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-100 border-green-200';
      case 'invalid': return 'text-red-600 bg-red-100 border-red-200';
      case 'expired': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'revoked': return 'text-red-600 bg-red-100 border-red-200';
      case 'unknown_key': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'invalid':
      case 'revoked':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'expired':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'unknown_key':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'commit': return 'Git Commit';
      case 'tag': return 'Git Tag';
      case 'release': return 'Release';
      case 'metadata': return 'Metadata';
      default: return type;
    }
  };

  const getOverallStatus = () => {
    if (signatures.length === 0) return { status: 'unsigned', label: 'Unsigned', color: 'text-gray-600' };
    
    const hasValid = signatures.some(sig => sig.status === 'valid');
    const hasInvalid = signatures.some(sig => sig.status === 'invalid' || sig.status === 'revoked');
    
    if (hasValid && !hasInvalid) {
      return { status: 'signed', label: 'Signed & Verified', color: 'text-green-600' };
    } else if (hasValid && hasInvalid) {
      return { status: 'partial', label: 'Partially Signed', color: 'text-yellow-600' };
    } else {
      return { status: 'invalid', label: 'Invalid Signatures', color: 'text-red-600' };
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span className="text-sm text-gray-500">Checking signatures...</span>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border transition-colors hover:bg-opacity-80 ${
            overallStatus.status === 'signed' 
              ? 'text-green-700 bg-green-100 border-green-200 hover:bg-green-200'
              : overallStatus.status === 'partial'
              ? 'text-yellow-700 bg-yellow-100 border-yellow-200 hover:bg-yellow-200'
              : overallStatus.status === 'invalid'
              ? 'text-red-700 bg-red-100 border-red-200 hover:bg-red-200'
              : 'text-gray-700 bg-gray-100 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {overallStatus.status === 'signed' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) : overallStatus.status === 'partial' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ) : overallStatus.status === 'invalid' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
            </svg>
          )}
          <span>{overallStatus.label}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {signatures.length > 0 && (
          <span className="text-xs text-gray-500">
            {signatures.length} signature{signatures.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {expanded && signatures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 space-y-2"
        >
          {signatures.map((signature) => (
            <div
              key={signature.id}
              className={`p-3 rounded-lg border ${getStatusColor(signature.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(signature.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {getTypeLabel(signature.signatureType)}
                      </span>
                      <span className="text-xs opacity-75">v{signature.version}</span>
                    </div>
                    {signature.gpgKey && (
                      <div className="text-xs opacity-75 mt-1">
                        Signed by: {signature.gpgKey.userIds[0]} ({signature.gpgKey.keyId})
                      </div>
                    )}
                    {signature.verificationDetails?.errorMessage && (
                      <div className="text-xs opacity-75 mt-1">
                        Error: {signature.verificationDetails.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs opacity-75">
                  {signature.verifiedAt 
                    ? new Date(signature.verifiedAt).toLocaleDateString()
                    : 'Not verified'
                  }
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
