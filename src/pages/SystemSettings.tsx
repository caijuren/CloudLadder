import { useState, useRef } from 'react'
import {
  Globe,
  Shield,
  Bell,
  Server,
  Info,
  Upload,
  Save,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'
import { useAuthStore } from '@/lib/store'

interface PlatformConfig {
  platformName: string
  platformDescription: string
  platformLogo: string | null
}

interface SecurityConfig {
  sessionTimeout: number
  passwordMinLength: number
  requireLetterAndNumber: boolean
  maxLoginAttempts: number
}

interface NotificationConfig {
  policyAlert: boolean
  deadlineReminder: boolean
  matchNotification: boolean
  systemNotice: boolean
  emailDigest: boolean
  digestHour: number
}

const menuItems = [
  { key: 'platform', label: '平台信息', icon: Globe, desc: '配置平台名称、Logo 和描述' },
  { key: 'security', label: '安全策略', icon: Shield, desc: '管理会话超时、密码规则等安全设置' },
  { key: 'notification', label: '通知设置', icon: Bell, desc: '配置系统通知和邮件推送' },
  { key: 'maintenance', label: '系统维护', icon: Server, desc: '缓存清理、数据维护等操作' },
  { key: 'about', label: '关于系统', icon: Info, desc: '查看系统版本和相关信息' },
]

const DEFAULT_SECURITY: SecurityConfig = {
  sessionTimeout: 30,
  passwordMinLength: 8,
  requireLetterAndNumber: true,
  maxLoginAttempts: 5,
}

const DEFAULT_NOTIFICATION: NotificationConfig = {
  policyAlert: true,
  deadlineReminder: true,
  matchNotification: true,
  systemNotice: true,
  emailDigest: false,
  digestHour: 9,
}

function loadPlatformConfig(): PlatformConfig {
  return {
    platformName: localStorage.getItem('platformName') || '项目申报平台',
    platformDescription: localStorage.getItem('platformDescription') || '智能政策匹配与申报管理平台',
    platformLogo: localStorage.getItem('platformLogo') || null,
  }
}

function loadSecurityConfig(): SecurityConfig {
  try {
    const saved = localStorage.getItem('securityConfig')
    return saved ? { ...DEFAULT_SECURITY, ...JSON.parse(saved) } : DEFAULT_SECURITY
  } catch {
    return DEFAULT_SECURITY
  }
}

function loadNotificationConfig(): NotificationConfig {
  try {
    const saved = localStorage.getItem('notificationConfig')
    return saved ? { ...DEFAULT_NOTIFICATION, ...JSON.parse(saved) } : DEFAULT_NOTIFICATION
  } catch {
    return DEFAULT_NOTIFICATION
  }
}

export default function SystemSettings() {
  const { showToast } = useToast()
  const { user } = useAuthStore()
  const [activeSection, setActiveSection] = useState('platform')

  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(loadPlatformConfig)
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(loadSecurityConfig)
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(loadNotificationConfig)

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(platformConfig.platformLogo)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [confirmClear, setConfirmClear] = useState<string | null>(null)
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('maintenanceMode') === 'true')

  const isAdmin = user?.role === 'admin'

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', '请上传图片文件')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', '图片大小不能超过 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setLogoPreview(dataUrl)
      setPlatformConfig((prev) => ({ ...prev, platformLogo: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const savePlatformConfig = async () => {
    setSaving((prev) => ({ ...prev, platform: true }))
    try {
      localStorage.setItem('platformName', platformConfig.platformName)
      localStorage.setItem('platformDescription', platformConfig.platformDescription)
      if (platformConfig.platformLogo) {
        localStorage.setItem('platformLogo', platformConfig.platformLogo)
      } else {
        localStorage.removeItem('platformLogo')
      }
      await new Promise((r) => setTimeout(r, 300))
      showToast('success', '平台信息保存成功')
    } catch {
      showToast('error', '保存失败，请重试')
    }
    setSaving((prev) => ({ ...prev, platform: false }))
  }

  const saveSecurityConfig = async () => {
    setSaving((prev) => ({ ...prev, security: true }))
    try {
      localStorage.setItem('securityConfig', JSON.stringify(securityConfig))
      await new Promise((r) => setTimeout(r, 300))
      showToast('success', '安全策略保存成功')
    } catch {
      showToast('error', '保存失败，请重试')
    }
    setSaving((prev) => ({ ...prev, security: false }))
  }

  const saveNotificationConfig = async () => {
    setSaving((prev) => ({ ...prev, notification: true }))
    try {
      localStorage.setItem('notificationConfig', JSON.stringify(notificationConfig))
      await new Promise((r) => setTimeout(r, 300))
      showToast('success', '通知设置保存成功')
    } catch {
      showToast('error', '保存失败，请重试')
    }
    setSaving((prev) => ({ ...prev, notification: false }))
  }

  const handleClearCache = () => {
    localStorage.removeItem('policyCache')
    localStorage.removeItem('subscriptionCache')
    showToast('success', '缓存已清理')
    setConfirmClear(null)
  }

  const handleResetSettings = () => {
    localStorage.removeItem('platformName')
    localStorage.removeItem('platformDescription')
    localStorage.removeItem('platformLogo')
    localStorage.removeItem('securityConfig')
    localStorage.removeItem('notificationConfig')
    setPlatformConfig({ platformName: '项目申报平台', platformDescription: '智能政策匹配与申报管理平台', platformLogo: null })
    setSecurityConfig(DEFAULT_SECURITY)
    setNotificationConfig(DEFAULT_NOTIFICATION)
    setLogoPreview(null)
    showToast('success', '所有设置已重置为默认值')
    setConfirmClear(null)
  }

  const toggleMaintenanceMode = () => {
    const newMode = !maintenanceMode
    setMaintenanceMode(newMode)
    localStorage.setItem('maintenanceMode', String(newMode))
    showToast(newMode ? 'warning' : 'success', newMode ? '维护模式已开启' : '维护模式已关闭')
  }

  const renderPlatformSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-2">平台 Logo</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center overflow-hidden shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="平台Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-lg font-bold">项</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-sm gap-1.5"
            >
              <Upload size={14} />
              上传图片
            </button>
            {logoPreview && (
              <button
                onClick={() => {
                  setLogoPreview(null)
                  setPlatformConfig((prev) => ({ ...prev, platformLogo: null }))
                }}
                className="ml-2 text-xs text-red-500 hover:text-red-600"
              >
                移除
              </button>
            )}
            <p className="text-xs text-slate-400 mt-1">建议尺寸 128x128，不超过 2MB</p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">平台名称</label>
        <input
          type="text"
          value={platformConfig.platformName}
          onChange={(e) => setPlatformConfig((prev) => ({ ...prev, platformName: e.target.value }))}
          className="input-field text-sm max-w-md"
          placeholder="请输入平台名称"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">平台描述</label>
        <textarea
          value={platformConfig.platformDescription}
          onChange={(e) => setPlatformConfig((prev) => ({ ...prev, platformDescription: e.target.value }))}
          className="input-field text-sm max-w-md resize-none"
          rows={3}
          placeholder="请输入平台描述"
        />
      </div>

      <div>
        <button
          onClick={savePlatformConfig}
          disabled={saving.platform}
          className="btn-primary text-sm gap-1.5"
        >
          <Save size={15} />
          {saving.platform ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-6 max-w-lg">
      <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">修改安全策略将在下次登录时生效。请确保新策略不会影响正常使用。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">会话超时时间（分钟）</label>
          <select
            value={securityConfig.sessionTimeout}
            onChange={(e) => setSecurityConfig((prev) => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
            className="input-field text-sm"
          >
            <option value={15}>15 分钟</option>
            <option value={30}>30 分钟</option>
            <option value={60}>60 分钟</option>
            <option value={120}>2 小时</option>
            <option value={480}>8 小时</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">最大登录尝试次数</label>
          <select
            value={securityConfig.maxLoginAttempts}
            onChange={(e) => setSecurityConfig((prev) => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
            className="input-field text-sm"
          >
            {[3, 5, 10, 0].map((n) => (
              <option key={n} value={n}>{n === 0 ? '不限制' : `${n} 次`}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">密码最小长度</label>
          <select
            value={securityConfig.passwordMinLength}
            onChange={(e) => setSecurityConfig((prev) => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
            className="input-field text-sm"
          >
            {[6, 8, 10, 12, 16].map((n) => (
              <option key={n} value={n}>{n} 位</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={() => setSecurityConfig((prev) => ({ ...prev, requireLetterAndNumber: !prev.requireLetterAndNumber }))}
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative',
                securityConfig.requireLetterAndNumber ? 'bg-blue-500' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                  securityConfig.requireLetterAndNumber ? 'translate-x-5 left-0.5' : 'left-0.5'
                )}
              />
            </button>
            <span className="text-sm text-slate-600">密码必须包含字母和数字</span>
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">管理员密码验证</h4>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type={showAdminPassword ? 'text' : 'password'}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="input-field text-sm pr-10 w-60"
              placeholder="输入当前管理员密码确认"
            />
            <button
              onClick={() => setShowAdminPassword(!showAdminPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button
            onClick={saveSecurityConfig}
            disabled={saving.security}
            className="btn-primary text-sm gap-1.5"
          >
            <Save size={15} />
            {saving.security ? '保存中...' : '保存安全策略'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">修改安全设置需要验证管理员身份</p>
      </div>
    </div>
  )

  const renderNotificationSection = () => (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-3">
        {[
          { key: 'policyAlert', label: '政策更新提醒', desc: '当有新的匹配政策发布时通知用户' },
          { key: 'deadlineReminder', label: '申报截止提醒', desc: '在申报截止日期前自动提醒用户' },
          { key: 'matchNotification', label: '智能匹配通知', desc: '系统匹配到新的适合政策时通知' },
          { key: 'systemNotice', label: '系统公告', desc: '向用户推送系统维护和更新公告' },
          { key: 'emailDigest', label: '邮件周报', desc: '每周向用户发送政策汇总邮件' },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-slate-700">{item.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => setNotificationConfig((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof NotificationConfig] }))}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                notificationConfig[item.key as keyof NotificationConfig] ? 'bg-blue-500' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                  notificationConfig[item.key as keyof NotificationConfig] ? 'translate-x-5.5 left-0.5' : 'left-0.5'
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {notificationConfig.emailDigest && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">邮件周报发送时间</label>
          <select
            value={notificationConfig.digestHour}
            onChange={(e) => setNotificationConfig((prev) => ({ ...prev, digestHour: Number(e.target.value) }))}
            className="input-field text-sm"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{`${String(i).padStart(2, '0')}:00`}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">每周一自动发送上周政策汇总</p>
        </div>
      )}

      <div>
        <button
          onClick={saveNotificationConfig}
          disabled={saving.notification}
          className="btn-primary text-sm gap-1.5"
        >
          <Save size={15} />
          {saving.notification ? '保存中...' : '保存通知设置'}
        </button>
      </div>
    </div>
  )

  const renderMaintenanceSection = () => (
    <div className="space-y-6 max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">清理系统缓存</p>
            <p className="text-xs text-slate-400 mt-0.5">清除本地缓存的政策数据和订阅信息</p>
          </div>
          {confirmClear === 'cache' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearCache}
                className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
              >
                确认清理
              </button>
              <button
                onClick={() => setConfirmClear(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear('cache')}
              className="btn-secondary text-xs gap-1.5"
            >
              <Trash2 size={13} />
              清理
            </button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">恢复默认设置</p>
            <p className="text-xs text-slate-400 mt-0.5">将所有系统设置重置为出厂默认值</p>
          </div>
          {confirmClear === 'reset' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetSettings}
                className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
              >
                确认重置
              </button>
              <button
                onClick={() => setConfirmClear(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear('reset')}
              className="btn-secondary text-xs gap-1.5"
            >
              <RotateCcw size={13} />
              重置
            </button>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">维护模式</p>
            <p className="text-xs text-slate-400 mt-0.5">开启后仅管理员可访问系统，其他用户将看到维护提示</p>
          </div>
          <button
            onClick={toggleMaintenanceMode}
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative',
              maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                maintenanceMode ? 'translate-x-5.5 left-0.5' : 'left-0.5'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  )

  const renderAboutSection = () => (
    <div className="space-y-6 max-w-lg">
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white text-lg font-bold">项</span>
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-800">{platformConfig.platformName}</h4>
            <p className="text-xs text-slate-500">v2.0.0</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">{platformConfig.platformDescription}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-medium text-slate-400 mb-1">前端框架</label>
          <p className="text-sm text-slate-700">React 18 + TypeScript</p>
        </div>
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-medium text-slate-400 mb-1">构建工具</label>
          <p className="text-sm text-slate-700">Vite 5</p>
        </div>
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-medium text-slate-400 mb-1">样式方案</label>
          <p className="text-sm text-slate-700">Tailwind CSS</p>
        </div>
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <label className="block text-xs font-medium text-slate-400 mb-1">状态管理</label>
          <p className="text-sm text-slate-700">Zustand</p>
        </div>
      </div>

      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">系统状态</p>
            <p className="text-xs text-slate-400 mt-0.5">所有服务运行正常</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            正常运行
          </span>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
          <p className="text-xs text-amber-700">
            部分系统设置仅限管理员操作。如需修改请联系管理员。
          </p>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'platform':
        return renderPlatformSection()
      case 'security':
        return renderSecuritySection()
      case 'notification':
        return renderNotificationSection()
      case 'maintenance':
        return renderMaintenanceSection()
      case 'about':
        return renderAboutSection()
      default:
        return null
    }
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h3 className="text-base font-semibold text-slate-800">系统管理</h3>
        <p className="text-sm text-slate-400 mt-0.5">管理平台配置、安全策略和系统维护</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                  activeSection === item.key
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-slate-50 border border-transparent'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                  activeSection === item.key ? 'bg-blue-100' : 'bg-slate-100'
                )}>
                  <Icon size={16} className={activeSection === item.key ? 'text-blue-600' : 'text-slate-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    activeSection === item.key ? 'text-blue-700' : 'text-slate-700'
                  )}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-3">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-6">
              {menuItems.find((i) => i.key === activeSection)?.label}
            </h3>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}