'use client';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">AstrBot Plugin Marketplace</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Discover and share trusted plugins for your AstrBot. Our platform provides automated security reviews 
              and a curated collection of community-contributed plugins.
            </p>
            <p className="text-gray-400 text-xs">
              © 2025 AstrBot Plugin Marketplace. All rights reserved.
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-200">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Marketplace
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Developer Dashboard
                </a>
              </li>
              <li>
                <a href="/audits" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Audit Reports
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>

          {/* 法律信息 */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-200">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="/disclaimer" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="text-gray-300 hover:text-white text-sm transition-colors">
                  Security Policy
                </a>
              </li>
              <li>
                <a href="https://github.com/Soulter/AstrBot" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white text-sm transition-colors">
                  AstrBot GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部分隔线和重要声明 */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-xs mb-4 md:mb-0">
              <p>
                ⚠️ Please read our{' '}
                <a href="/disclaimer" className="text-yellow-400 hover:text-yellow-300 underline">
                  disclaimer
                </a>{' '}
                before using any plugins. Use at your own risk.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="/disclaimer" className="text-gray-400 hover:text-white text-xs transition-colors">
                免责声明
              </a>
              <a href="/disclaimer" className="text-gray-400 hover:text-white text-xs transition-colors">
                Disclaimer
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
