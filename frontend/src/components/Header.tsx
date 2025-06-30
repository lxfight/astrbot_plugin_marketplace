'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthTokenManager, AuthAPI } from '../utils/auth';
import Image from 'next/image';

interface User {
  id: string;
  username: string;
  email?: string;
  avatar_url: string;
}

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = AuthTokenManager.getToken();
      if (token) {
        try {
          const userData = await AuthAPI.getCurrentUser();
          setUser(userData);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Failed to get user data:', error);
          AuthTokenManager.clearToken();
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      setIsLoggedIn(false);
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使API调用失败，也清除本地token
      AuthTokenManager.clearToken();
      setIsLoggedIn(false);
      setUser(null);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            AstrBot Marketplace
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-lg font-semibold text-gray-900">
              AstrBot Marketplace
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Plugins
              </Link>
              <Link href="/audits" className="text-gray-600 hover:text-gray-900 transition-colors">
                Security Reports
              </Link>
              <Link href="/disclaimer" className="text-gray-600 hover:text-gray-900 transition-colors">
                Disclaimer
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isLoggedIn && user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {user.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-700 font-medium">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <a
                  href="http://localhost:3001/auth/github/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Login with GitHub
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}