import { useEffect, useState } from 'react'
import {
  Building2,
  TrendingUp,
  FileText,
  DollarSign,
  Award,
  Zap,
  Activity,
  Users,
  BarChart3,
} from 'lucide-react'
import { apiFetch } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface CompanyHealth {
  id: number
  name: string
  industry: string
  healthScore: number
  matchCount: number
  lastActive: string
}

interface DashboardStats {
  totalCompanies: number
  avgHealthScore: number
  totalApplications: number
  totalSubsidy: number
}

export default function AdminDashboard() {
  const { showToast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [companies, setCompanies] = useState<CompanyHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [showAutoGrant, setShowAutoGrant] = useState(false)
  const [autoGrantForm, setAutoGrantForm] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsJson, companiesJson] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/companies'),
      ])
      if (statsJson.success) setStats(statsJson.data)
      if (companiesJson.success) setCompanies(companiesJson.data || [])
    } catch {
      // ignore fetch error
    }
    setLoading(false)
  }

  const handleAutoGrant = async () => {
    try {
      await apiFetch('/api/admin/auto-grant', {
        method: 'POST',
        body: JSON.stringify(autoGrantForm),
      })
      setShowAutoGrant(false)
      setAutoGrantForm({})
      showToast('success', '免申即享政策已配置')
    } catch {
      showToast('error', '配置失败')
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-blue-500'
    return 'text-amber-500'
  }

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50'
    if (score >= 60) return 'bg-blue-50'
    return 'bg-amber-50'
  }

  const healthDistribution = {
    healthy: companies.filter((c) => c.healthScore >= 80).length,
    normal: companies.filter((c) => c.healthScore >= 60 && c.healthScore < 80).length,
    warning: companies.filter((c) => c.healthScore < 60).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-slate-800">园区驾驶舱</h3>
        <p className="text-sm text-slate-400 mt-0.5">园区企业科创申报数据总览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-slate-400">入驻企业</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.totalCompanies || 0}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-400">平均健康度</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.avgHealthScore || 0}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <FileText size={16} className="text-purple-600" />
            </div>
            <span className="text-xs text-slate-400">累计申报</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.totalApplications || 0}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <DollarSign size={16} className="text-amber-600" />
            </div>
            <span className="text-xs text-slate-400">获得补贴</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats?.totalSubsidy || 0}万</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Health Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" />
            健康度分布
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">健康（≥80分）</span>
                <span className="font-medium text-emerald-600">{healthDistribution.healthy}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${companies.length ? (healthDistribution.healthy / companies.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">正常（60-79分）</span>
                <span className="font-medium text-blue-600">{healthDistribution.normal}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${companies.length ? (healthDistribution.normal / companies.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">预警（&lt;60分）</span>
                <span className="font-medium text-amber-600">{healthDistribution.warning}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${companies.length ? (healthDistribution.warning / companies.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            快捷操作
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setShowAutoGrant(true)}
              className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors w-full text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Award size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">配置免申即享</p>
                <p className="text-xs text-slate-400">设置自动享受政策条件</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            申报动态
          </h3>
          <div className="space-y-3">
            {companies.slice(0, 5).map((company) => (
              <div key={company.id} className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', getHealthBg(company.healthScore))}>
                  <span className={cn('text-xs font-bold', getHealthColor(company.healthScore))}>
                    {company.name?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{company.name}</p>
                  <p className="text-xs text-slate-400">匹配 {company.matchCount} 项政策</p>
                </div>
                <span className={cn('text-xs font-medium', getHealthColor(company.healthScore))}>
                  {company.healthScore}分
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company List */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Users size={16} className="text-blue-500" />
          企业健康度排名
        </h3>
        <div className="space-y-2">
          {companies
            .sort((a, b) => b.healthScore - a.healthScore)
            .map((company, index) => (
              <div
                key={company.id}
                className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  index < 3 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                )}>
                  {index + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-slate-500">{company.name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{company.name}</p>
                  <p className="text-xs text-slate-400">{company.industry || '未设置行业'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400">匹配 {company.matchCount} 项</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          company.healthScore >= 80 ? 'bg-emerald-500' :
                          company.healthScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                        )}
                        style={{ width: `${company.healthScore}%` }}
                      />
                    </div>
                    <span className={cn('text-sm font-bold w-10 text-right', getHealthColor(company.healthScore))}>
                      {company.healthScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Auto Grant Modal */}
      {showAutoGrant && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowAutoGrant(false)}>
          <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">配置免申即享</h3>
              <button onClick={() => setShowAutoGrant(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">关闭</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">政策名称</label>
                <input
                  type="text"
                  value={autoGrantForm.policyName || ''}
                  onChange={(e) => setAutoGrantForm((p) => ({ ...p, policyName: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="如：高新技术企业认定奖励"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">适用条件</label>
                <textarea
                  value={autoGrantForm.conditions || ''}
                  onChange={(e) => setAutoGrantForm((p) => ({ ...p, conditions: e.target.value }))}
                  className="input-field text-sm min-h-[80px]"
                  placeholder="描述适用该免申即享政策的企业条件"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">补贴金额</label>
                <input
                  type="text"
                  value={autoGrantForm.amount || ''}
                  onChange={(e) => setAutoGrantForm((p) => ({ ...p, amount: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="如：10万元"
                />
              </div>
              <button onClick={handleAutoGrant} className="w-full btn-primary py-2.5 text-sm mt-2">
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
