import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Bell, Search, ChevronDown, LogOut, User, Settings, KeyRound } from 'lucide-react'
import { useAuthStore, useSubscriptionStore, useCompanyStore } from '@/lib/store'
import { useEffect, useState, useRef } from 'react'

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/links': '资源库',
  '/policies': '政策雷达',
  '/policy-parse': 'AI政策解析',
  '/crawler': '爬虫管理',
  '/company/profile': '企业档案',
  '/company/team': '团队管理',
  '/matching': '智能匹配',
  '/workbench': '申报工作台',
  '/settings': '系统管理',
  '/user/settings': '个人中心',
}

function getPageTitle(pathname: string): string {
  const match = Object.entries(pageTitles).find(([key]) =>
    pathname.startsWith(key)
  )
  return match?.[1] || localStorage.getItem('platformName') || '项目申报平台'
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const title = getPageTitle(location.pathname)
  const { user, logout } = useAuthStore()
  const { newPolicyCount, fetchNewPolicyCount } = useSubscriptionStore()
  const { profile: companyProfile, fetchProfile } = useCompanyStore()
  const companyName = companyProfile?.name || user?.companyName || '企业名称'
  const companyInitial = companyName.charAt(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNewPolicyCount()
  }, [location.pathname, fetchNewPolicyCount])

  useEffect(() => {
    if (!companyProfile) fetchProfile()
  }, [companyProfile, fetchProfile])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/policies?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const mockNotifications = [
    { id: 1, title: '新增 18 条政策', desc: '上次访问后有新政策发布', time: '10分钟前', read: false },
    { id: 2, title: '高企认定申报即将截止', desc: '您的项目"高企认定申报"将在3天后截止', time: '2小时前', read: false },
    { id: 3, title: '匹配到新政策', desc: '为您匹配到5条适合的政策', time: '1天前', read: true },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索政策..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-600 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-56"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <Bell size={18} />
                {newPolicyCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>
              {showNotifPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">通知</span>
                    <button
                      onClick={() => setShowNotifPanel(false)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      全部标记已读
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />}
                          <div className="flex-1">
                            <p className="text-sm text-slate-700">{notif.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{notif.desc}</p>
                            <p className="text-xs text-slate-300 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <button
                      onClick={() => { setShowNotifPanel(false); navigate('/policies') }}
                      className="text-xs text-blue-600 hover:underline w-full text-center"
                    >
                      查看全部通知
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-4 border-l border-slate-100 hover:bg-slate-50 rounded-lg py-1 pr-1 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">{companyInitial}</span>
                </div>
                <span className="text-sm text-slate-600 hidden md:block">{companyName}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">{companyInitial}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{companyName}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/user/settings') }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <User size={16} />
                    个人中心
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/company/profile') }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={16} />
                    企业档案
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/user/settings?tab=password') }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound size={16} />
                    修改密码
                  </button>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => { setShowUserMenu(false); logout() }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-5">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
