import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  User,
  Lock,
  Bell,
  Shield,
  ChevronRight,
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/utils'

const menuItems = [
  { key: 'profile', label: '个人信息', icon: User, desc: '查看和管理您的基本信息' },
  { key: 'password', label: '修改密码', icon: Lock, desc: '更新您的登录密码' },
  { key: 'notifications', label: '通知设置', icon: Bell, desc: '管理消息通知偏好' },
  { key: 'security', label: '账号安全', icon: Shield, desc: '查看登录记录和安全状态' },
]

export default function UserSettings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, fetchUser, updatePassword } = useAuthStore()
  const { showToast } = useToast()
  const [activeSection, setActiveSection] = useState(() => {
    const tab = searchParams.get('tab')
    return ['profile', 'password', 'notifications', 'security'].includes(tab || '') ? tab! : 'profile'
  })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    policyAlert: true,
    deadlineReminder: true,
    matchNotification: true,
    systemNotice: true,
    emailDigest: false,
  })

  useEffect(() => {
    if (!user) {
      fetchUser()
    }
  }, [user, fetchUser])

  const handlePasswordChange = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast('error', '请填写所有密码字段')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      showToast('error', '新密码至少8位')
      return
    }
    if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/[0-9]/.test(passwordForm.newPassword)) {
      showToast('error', '新密码必须包含字母和数字')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', '两次输入的新密码不一致')
      return
    }

    setSaving(true)
    try {
      await updatePassword(passwordForm.oldPassword, passwordForm.newPassword)
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      showToast('success', '密码修改成功')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '修改密码失败'
      showToast('error', msg)
    }
    setSaving(false)
  }

  const toggleNotification = (key: string) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
    showToast('success', '设置已更新')
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {user?.companyName?.charAt(0) || '用'}
                </span>
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-800">{user?.companyName || '未设置企业名称'}</h4>
                <p className="text-sm text-slate-400">{user?.email || ''}</p>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                  user?.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                )}>
                  {user?.role === 'admin' ? '管理员' : '企业用户'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <label className="block text-xs font-medium text-slate-400 mb-1">用户ID</label>
                <p className="text-sm text-slate-700 font-mono">{user?.id || '-'}</p>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <label className="block text-xs font-medium text-slate-400 mb-1">注册邮箱</label>
                <p className="text-sm text-slate-700">{user?.email || '-'}</p>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <label className="block text-xs font-medium text-slate-400 mb-1">企业名称</label>
                <p className="text-sm text-slate-700">{user?.companyName || '-'}</p>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <label className="block text-xs font-medium text-slate-400 mb-1">角色权限</label>
                <p className="text-sm text-slate-700">{user?.role === 'admin' ? '管理员' : '企业用户'}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <p className="text-sm text-amber-700">
                如需修改企业详细信息，请前往 <button onClick={() => navigate('/company/profile')} className="font-medium underline hover:text-amber-800">企业档案</button> 页面。
              </p>
            </div>
          </div>
        )

      case 'password':
        return (
          <div className="space-y-5 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">当前密码</label>
              <div className="relative">
                <input
                  type={showPassword.old ? 'text' : 'password'}
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                  className="input-field text-sm pr-10"
                  placeholder="请输入当前密码"
                />
                <button
                  onClick={() => setShowPassword((p) => ({ ...p, old: !p.old }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.old ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">新密码</label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="input-field text-sm pr-10"
                  placeholder="至少8位，包含字母和数字"
                />
                <button
                  onClick={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">密码需至少8位，同时包含字母和数字</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">确认新密码</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="input-field text-sm pr-10"
                  placeholder="再次输入新密码"
                />
                <button
                  onClick={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={saving}
              className="btn-primary text-sm gap-1.5"
            >
              <Save size={16} />
              {saving ? '保存中...' : '修改密码'}
            </button>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-3">
            {[
              { key: 'policyAlert', label: '政策更新提醒', desc: '当有新的匹配政策发布时通知我' },
              { key: 'deadlineReminder', label: '申报截止提醒', desc: '在申报截止日期前提醒' },
              { key: 'matchNotification', label: '智能匹配通知', desc: '当系统匹配到新的适合政策时通知' },
              { key: 'systemNotice', label: '系统公告', desc: '接收系统维护和更新公告' },
              { key: 'emailDigest', label: '邮件周报', desc: '每周发送政策汇总邮件' },
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
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative',
                    notificationSettings[item.key as keyof typeof notificationSettings]
                      ? 'bg-blue-500'
                      : 'bg-slate-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                      notificationSettings[item.key as keyof typeof notificationSettings]
                        ? 'translate-x-5.5 left-0.5'
                        : 'left-0.5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )

      case 'security':
        return (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">账号状态正常</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">您的账号目前未检测到异常登录行为</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">最近登录记录</h4>
              <div className="space-y-2">
                {[
                  { device: 'Chrome / macOS', time: '刚刚', location: '当前会话', current: true },
                  { device: 'Chrome / Windows', time: '2天前', location: '江苏省苏州市', current: false },
                  { device: 'Safari / iOS', time: '5天前', location: '江苏省苏州市', current: false },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-slate-500">{log.device[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">{log.device}</p>
                        <p className="text-xs text-slate-400">{log.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{log.time}</p>
                      {log.current && <span className="text-xs text-blue-500 font-medium">当前</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h3 className="text-base font-semibold text-slate-800">个人中心</h3>
        <p className="text-sm text-slate-400 mt-0.5">管理您的账号信息和偏好设置</p>
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
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-3">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveSection('profile')}
                className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 className="text-sm font-semibold text-slate-800">
                {menuItems.find((i) => i.key === activeSection)?.label}
              </h3>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
