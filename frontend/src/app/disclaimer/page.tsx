'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export default function DisclaimerPage() {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const disclaimerContent = {
    zh: {
      title: '免责声明',
      lastUpdated: '最后更新：2025年6月29日',
      sections: [
        {
          title: '1. 安全性声明',
          content: [
            '本AstrBot插件市场（以下简称"本平台"）对所有提交的插件进行自动化安全审查，采用先进的AI技术和静态代码分析工具。',
            '尽管我们努力确保插件的安全性，但无法保证100%的安全性。自动化审查可能无法检测到所有潜在的安全风险。',
            '用户在使用任何插件前应自行评估风险，特别是在生产环境中使用时。',
            '建议用户在隔离环境中测试插件，确认其功能和安全性后再正式使用。'
          ]
        },
        {
          title: '2. 内容责任',
          content: [
            '插件的功能、质量、安全性和合法性完全由插件作者负责。',
            '本平台仅提供插件发布和分发的技术平台，不对插件的具体功能或效果做任何保证。',
            '本平台不对因使用插件而导致的任何直接或间接损失承担责任，包括但不限于：',
            '• 数据丢失或损坏',
            '• 系统故障或崩溃',
            '• 业务中断或经济损失',
            '• 隐私泄露或安全漏洞',
            '• 任何其他形式的损害'
          ]
        },
        {
          title: '3. 使用风险',
          content: [
            '用户使用本平台及其插件的所有风险由用户自行承担。',
            '强烈建议用户在生产环境使用前进行充分的测试和评估。',
            '用户应定期备份重要数据，以防止因插件使用而导致的数据丢失。',
            '对于关键业务系统，建议咨询专业技术人员后再决定是否使用特定插件。'
          ]
        },
        {
          title: '4. 知识产权',
          content: [
            '用户应确保使用的插件不侵犯任何第三方的知识产权，包括但不限于版权、商标权、专利权等。',
            '如因使用插件而产生知识产权纠纷，责任完全由用户承担。',
            '本平台不对插件的知识产权状况进行审查或保证。',
            '用户在使用插件时应遵守相关的开源许可证条款。'
          ]
        },
        {
          title: '5. 服务可用性',
          content: [
            '本平台不保证服务的持续可用性和稳定性。',
            '服务可能因以下原因暂停或中断：',
            '• 系统维护和升级',
            '• 技术故障或网络问题',
            '• 不可抗力因素',
            '• 政策法规要求',
            '本平台将尽力提前通知服务中断，但不承担因服务中断而造成的任何损失。'
          ]
        },
        {
          title: '6. 数据隐私',
          content: [
            '插件可能会收集、处理或存储用户数据，请仔细查看各插件的隐私政策和使用条款。',
            '本平台不对插件的数据处理行为负责，用户应直接与插件作者就数据隐私问题进行沟通。',
            '用户在使用插件前应了解其数据收集和使用方式，确保符合相关法律法规要求。',
            '对于涉及敏感数据的插件，建议用户特别谨慎使用。'
          ]
        },
        {
          title: '7. 法律适用',
          content: [
            '本免责声明受中华人民共和国法律管辖。',
            '如因本声明或使用本平台产生任何争议，各方应首先通过友好协商解决。',
            '协商不成的，任何一方均可向本平台所在地有管辖权的人民法院提起诉讼。'
          ]
        },
        {
          title: '8. 声明变更',
          content: [
            '本平台保留随时修改本免责声明的权利。',
            '声明修改后将在平台上公布，用户继续使用平台即视为同意修改后的声明。',
            '建议用户定期查看本声明的最新版本。'
          ]
        }
      ],
      agreement: '继续使用本平台即表示您已阅读、理解并同意遵守上述所有条款。如果您不同意任何条款，请立即停止使用本平台。'
    },
    en: {
      title: 'Disclaimer',
      lastUpdated: 'Last updated: June 29, 2025',
      sections: [
        {
          title: '1. Security Statement',
          content: [
            'This AstrBot Plugin Marketplace (the "Platform") conducts automated security reviews of all submitted plugins using advanced AI technology and static code analysis tools.',
            'While we strive to ensure plugin security, we cannot guarantee 100% security. Automated reviews may not detect all potential security risks.',
            'Users should assess risks before using any plugin, especially in production environments.',
            'We recommend testing plugins in isolated environments and confirming their functionality and security before official use.'
          ]
        },
        {
          title: '2. Content Responsibility',
          content: [
            'Plugin functionality, quality, security, and legality are entirely the responsibility of plugin authors.',
            'This platform only provides technical infrastructure for plugin publishing and distribution, without guaranteeing specific plugin functionality or effectiveness.',
            'This platform is not liable for any direct or indirect losses caused by plugin usage, including but not limited to:',
            '• Data loss or corruption',
            '• System failures or crashes',
            '• Business interruption or economic losses',
            '• Privacy breaches or security vulnerabilities',
            '• Any other forms of damage'
          ]
        },
        {
          title: '3. Usage Risk',
          content: [
            'Users assume all risks associated with using this platform and its plugins.',
            'We strongly recommend thorough testing and evaluation before production use.',
            'Users should regularly backup important data to prevent data loss from plugin usage.',
            'For critical business systems, consult professional technical personnel before deciding to use specific plugins.'
          ]
        },
        {
          title: '4. Intellectual Property',
          content: [
            'Users must ensure that plugins used do not infringe any third-party intellectual property rights, including but not limited to copyrights, trademarks, and patents.',
            'Users bear full responsibility for any intellectual property disputes arising from plugin usage.',
            'This platform does not review or guarantee the intellectual property status of plugins.',
            'Users should comply with relevant open source license terms when using plugins.'
          ]
        },
        {
          title: '5. Service Availability',
          content: [
            'This platform does not guarantee continuous service availability and stability.',
            'Service may be suspended or interrupted due to:',
            '• System maintenance and upgrades',
            '• Technical failures or network issues',
            '• Force majeure factors',
            '• Policy and regulatory requirements',
            'We will strive to provide advance notice of service interruptions but are not liable for any losses caused by service interruptions.'
          ]
        },
        {
          title: '6. Data Privacy',
          content: [
            'Plugins may collect, process, or store user data. Please carefully review each plugin\'s privacy policy and terms of use.',
            'This platform is not responsible for plugin data processing practices. Users should communicate directly with plugin authors regarding data privacy issues.',
            'Users should understand data collection and usage methods before using plugins, ensuring compliance with relevant laws and regulations.',
            'Exercise particular caution when using plugins involving sensitive data.'
          ]
        },
        {
          title: '7. Governing Law',
          content: [
            'This disclaimer is governed by the laws of the People\'s Republic of China.',
            'Any disputes arising from this disclaimer or platform usage should first be resolved through friendly consultation.',
            'If consultation fails, any party may file a lawsuit with a competent people\'s court in the jurisdiction where this platform is located.'
          ]
        },
        {
          title: '8. Statement Changes',
          content: [
            'This platform reserves the right to modify this disclaimer at any time.',
            'Modified statements will be published on the platform. Continued use of the platform constitutes agreement to the modified statement.',
            'Users are advised to regularly review the latest version of this statement.'
          ]
        }
      ],
      agreement: 'Continued use of this platform indicates that you have read, understood, and agree to comply with all the above terms. If you disagree with any terms, please stop using this platform immediately.'
    }
  };

  const currentContent = disclaimerContent[language];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentContent.title}</h1>
                <p className="mt-1 text-sm text-gray-500">{currentContent.lastUpdated}</p>
              </div>
              <div className="flex space-x-4">
                {/* 语言切换 */}
                <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      language === 'zh' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      language === 'en' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    English
                  </button>
                </div>
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ← Back to Marketplace
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-8">
              <div className="prose prose-gray max-w-none">
                {currentContent.sections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="mb-8"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                    <div className="space-y-3">
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-gray-700 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </motion.div>
                ))}
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">
                        {language === 'zh' ? '重要提醒' : 'Important Notice'}
                      </h3>
                      <p className="text-blue-800 leading-relaxed">
                        {currentContent.agreement}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
