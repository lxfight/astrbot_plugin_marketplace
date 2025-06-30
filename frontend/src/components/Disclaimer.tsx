'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DisclaimerProps {
  className?: string;
}

export function Disclaimer({ className = '' }: DisclaimerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const disclaimerContent = {
    zh: {
      title: '免责声明',
      summary: '使用本插件市场前，请仔细阅读以下免责声明。',
      content: [
        '1. **安全性声明**：本平台对所有提交的插件进行自动化安全审查，但无法保证100%的安全性。用户在使用任何插件前应自行评估风险。',
        '2. **内容责任**：插件的功能、质量和安全性由插件作者负责。本平台不对插件的功能缺陷、数据丢失或任何损害承担责任。',
        '3. **使用风险**：用户使用插件的风险由用户自行承担。建议在生产环境使用前进行充分测试。',
        '4. **知识产权**：用户应确保使用的插件不侵犯第三方知识产权。如有侵权，责任由用户承担。',
        '5. **服务可用性**：本平台不保证服务的持续可用性，可能因维护、升级或其他原因暂停服务。',
        '6. **数据隐私**：插件可能收集用户数据，请查看各插件的隐私政策。本平台不对插件的数据处理行为负责。',
        '7. **法律适用**：本声明受中华人民共和国法律管辖。如有争议，应通过友好协商解决。',
        '8. **使用提醒**: 本平台利用 AI 技术实现对插件代码安全的基础审核，并不代表着绝对的安全，用户应首选 AstrBot 官方的插件市场，最大化程度保证个人数据安全。'
      ]
    },
    en: {
      title: 'Disclaimer',
      summary: 'Please read the following disclaimer carefully before using this plugin marketplace.',
      content: [
        '1. **Security Statement**: This platform conducts automated security reviews of all submitted plugins, but cannot guarantee 100% security. Users should assess risks before using any plugin.',
        '2. **Content Responsibility**: Plugin functionality, quality, and security are the responsibility of plugin authors. This platform is not liable for plugin defects, data loss, or any damages.',
        '3. **Usage Risk**: Users assume all risks associated with plugin usage. Thorough testing is recommended before production use.',
        '4. **Intellectual Property**: Users must ensure that plugins used do not infringe third-party intellectual property rights. Users bear responsibility for any infringement.',
        '5. **Service Availability**: This platform does not guarantee continuous service availability and may suspend services for maintenance, upgrades, or other reasons.',
        '6. **Data Privacy**: Plugins may collect user data. Please review each plugin\'s privacy policy. This platform is not responsible for plugin data processing practices.',
        '7. **Governing Law**: This disclaimer is governed by the laws of the People\'s Republic of China. Disputes should be resolved through friendly consultation.',
        '8. ** Usage Reminder **: This platform uses AI technology to conduct a basic review of the security of plugin codes. This does not guarantee absolute security. Users should first choose the official AstrBot plugin market to ensure the security of their personal data to the greatest extent.'
      ]
    }
  };

  const currentContent = disclaimerContent[language];

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-yellow-800">{currentContent.title}</h3>
            </div>
            
            {/* 语言切换按钮 */}
            <div className="flex bg-white rounded-md border border-yellow-300 overflow-hidden">
              <button
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  language === 'zh' 
                    ? 'bg-yellow-200 text-yellow-800' 
                    : 'text-yellow-600 hover:bg-yellow-100'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  language === 'en' 
                    ? 'bg-yellow-200 text-yellow-800' 
                    : 'text-yellow-600 hover:bg-yellow-100'
                }`}
              >
                EN
              </button>
            </div>
          </div>
          
          <p className="text-yellow-700 text-sm mb-3">{currentContent.summary}</p>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 text-sm text-yellow-700">
                  {currentContent.content.map((item, index) => (
                    <div key={index} className="leading-relaxed">
                      {item.split('**').map((part, partIndex) => (
                        partIndex % 2 === 1 ? (
                          <strong key={partIndex} className="font-semibold text-yellow-800">{part}</strong>
                        ) : (
                          <span key={partIndex}>{part}</span>
                        )
                      ))}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-yellow-300">
                  <p className="text-xs text-yellow-600">
                    {language === 'zh' 
                      ? '最后更新：2025年6月29日 | 继续使用本平台即表示您同意上述条款。'
                      : 'Last updated: June 29, 2025 | Continued use of this platform indicates your agreement to the above terms.'
                    }
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 flex-shrink-0 text-yellow-600 hover:text-yellow-800 transition-colors"
          aria-label={isExpanded ? 'Collapse disclaimer' : 'Expand disclaimer'}
        >
          <motion.svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
      </div>
    </div>
  );
}
