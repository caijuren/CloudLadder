import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpDown,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Calendar,
  Building2,
} from 'lucide-react'
import { apiFetch } from '@/lib/store'
import { cn } from '@/lib/utils'

interface MatchResult {
  id: number
  policyId: number
  policyTitle: string
  matchRate: number
  matchedItems: string[]
  unmatchedItems: string[]
  subsidy: string
  deadline: string
  department: string
  region: string
  tags: string[]
}

export default function Matching() {
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const json = await apiFetch('/api/matching')
      if (json.success) {
        setResults(json.data || [])
      } else {
        setError(json.message || '获取匹配结果失败')
      }
    } catch {
      setError('获取匹配结果失败')
    }
    setLoading(false)
  }

  const filtered = results.filter((r) =>
    r.policyTitle.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) =>
    sortAsc ? a.matchRate - b.matchRate : b.matchRate - a.matchRate
  )

  const avgMatchRate = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.matchRate, 0) / results.length)
    : 0

  const highMatches = results.filter((r) => r.matchRate >= 80).length
  const mediumMatches = results.filter((r) => r.matchRate >= 60 && r.matchRate < 80).length
  const lowMatches = results.filter((r) => r.matchRate < 60).length

  const allUnmatched = results.flatMap((r) =>
    r.unmatchedItems.map((item) => ({ policyTitle: r.policyTitle, item }))
  )

  const weaknessSuggestions: Record<string, string> = {
    '知识产权': '建议尽快申请软著或专利',
    '营收规模': '建议扩大营收规模，关注小微企业认定',
    '研发投入': '建议加大研发投入，建立研发费用专账',
    '人才团队': '建议引进高端人才，完善社保缴纳',
    '研发人员': '建议增加研发人员比例',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-400 text-sm">{error}</p>
        <button onClick={fetchData} className="mt-3 text-blue-600 text-sm hover:underline">重试</button>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">智能匹配</h3>
          <p className="text-sm text-slate-400 mt-0.5">基于企业档案，自动计算政策匹配度</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-ghost text-sm gap-1.5"
        >
          <RefreshCw size={15} />
          重新匹配
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-400">平均匹配度</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{avgMatchRate}%</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-blue-600" />
            </div>
            <span className="text-xs text-slate-400">高匹配项目</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{highMatches}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Award size={16} className="text-amber-600" />
            </div>
            <span className="text-xs text-slate-400">中等匹配</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{mediumMatches}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-slate-500" />
            </div>
            <span className="text-xs text-slate-400">待提升项目</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{lowMatches}</p>
        </div>
      </div>

      {/* Weakness Analysis */}
      {allUnmatched.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            短板分析
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(new Set(allUnmatched.map((u) => u.item))).slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-red-600">{item}</span>
                  {weaknessSuggestions[item] && (
                    <p className="text-xs text-red-400 mt-0.5">{weaknessSuggestions[item]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索政策..."
            className="input-field pl-9 text-sm"
          />
        </div>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="btn-ghost text-sm gap-1.5"
        >
          <ArrowUpDown size={15} />
          {sortAsc ? '升序' : '降序'}
        </button>
      </div>

      {/* Match Results */}
      {sorted.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-1">暂无匹配数据</p>
          <p className="text-sm text-slate-400">请先完善企业档案信息</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      item.matchRate >= 80 ? 'badge-green' :
                      item.matchRate >= 60 ? 'badge-yellow' :
                      'badge-gray'
                    )}>
                      {item.matchRate}% 匹配
                    </span>
                    <Link
                      to={`/policies/${item.policyId}`}
                      className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate"
                    >
                      {item.policyTitle}
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Building2 size={13} />
                      {item.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      截止 {item.deadline?.slice(0, 10)}
                    </span>
                    {item.subsidy && (
                      <span className="badge-green text-[10px] px-1.5 py-0.5">{item.subsidy}</span>
                    )}
                  </div>

                  {/* Matched Items */}
                  {item.matchedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.matchedItems.map((m) => (
                        <span key={m} className="tag bg-emerald-50 text-emerald-600 text-[10px]">
                          <CheckCircle2 size={10} className="inline mr-0.5" />
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Unmatched Items */}
                  {item.unmatchedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.unmatchedItems.map((u) => (
                        <span key={u} className="tag bg-red-50 text-red-500 text-[10px]">
                          <XCircle size={10} className="inline mr-0.5" />
                          {u}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Link
                  to={`/policies/${item.policyId}`}
                  className="shrink-0 p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
