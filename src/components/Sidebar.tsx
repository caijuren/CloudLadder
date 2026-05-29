import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  Globe,
  Building2,
  GitCompareArrows,
  Briefcase,
  Link2,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, useSubscriptionStore } from '@/lib/store'
import { useState, useEffect } from 'react'

function getPlatformLogo(): string | null {
  return localStorage.getItem('platformLogo')
}

function getPlatformName(): string {
  return localStorage.getItem('platformName') || '项目申报平台'
}

const navGroups = [
  {
    label: '',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
    ],
  },
  {
    label: '政策发现',
    items: [
      { to: '/links', icon: Link2, label: '资源库' },
      { to: '/policies', icon: Radar, label: '政策雷达' },
      { to: '/policy-parse', icon: Sparkles, label: 'AI政策解析' },
      { to: '/matching', icon: GitCompareArrows, label: '智能匹配' },
    ],
  },
  {
    label: '企业中心',
    items: [
      { to: '/company/profile', icon: Building2, label: '企业档案' },
      { to: '/company/team', icon: Users, label: '团队管理' },
      { to: '/workbench', icon: Briefcase, label: '申报工作台' },
    ],
  },
  {
    label: '管理',
    items: [
      { to: '/crawler', icon: Globe, label: '爬虫管理' },
      { to: '/settings', icon: Settings, label: '系统管理' },
    ],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { user } = useAuthStore()
  const { newPolicyCount, fetchNewPolicyCount } = useSubscriptionStore()

  useEffect(() => {
    if (user) fetchNewPolicyCount()
  }, [user, fetchNewPolicyCount])

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-slate-100 transition-all duration-300 h-screen shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo section */}
      <div className="flex items-center h-14 px-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
          {getPlatformLogo() ? (
            <img src={getPlatformLogo()!} alt={getPlatformName()} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xs font-bold">项</span>
          )}
        </div>
        {!collapsed && (
          <h1 className="text-base font-bold text-slate-800 ml-2.5">{getPlatformName()}</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'ml-auto p-1 rounded-md hover:bg-slate-100 transition-colors text-slate-400',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <div key={group.label || 'dashboard'}>
            {!collapsed && group.label && (
              <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                const isPolicyRadar = item.to === '/policies'

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 relative',
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                    {isPolicyRadar && newPolicyCount > 0 && (
                      <span className={cn(
                        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                        collapsed ? 'absolute -top-1 -right-1 bg-red-500 text-white' : 'ml-auto bg-red-500 text-white'
                      )}>
                        {newPolicyCount > 9 ? '9+' : newPolicyCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
