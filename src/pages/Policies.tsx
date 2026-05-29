import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Search, ExternalLink, Calendar, MapPin, Building2, Tag, Rss, Bell, ChevronDown } from 'lucide-react'
import { apiFetch, useSubscriptionStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface Policy {
  id: number
  title: string
  department: string
  deadline: string
  subsidy: string
  region: string
  tags: string[]
  isNew: boolean
}

const supportTypes = [
  { value: '', label: '全部类型' },
  { value: '资金补贴', label: '资金补贴' },
  { value: '税收优惠', label: '税收优惠' },
  { value: '人才政策', label: '人才政策' },
  { value: '资质认定', label: '资质认定' },
  { value: '项目扶持', label: '项目扶持' },
]

const departmentOptions = [
  { value: '', label: '全部部门' },
  { value: '科技部', label: '科技部' },
  { value: '工信部', label: '工信部' },
  { value: '发改委', label: '发改委' },
  { value: '人社局', label: '人社局' },
  { value: '知识产权局', label: '知识产权局' },
  { value: '商务局', label: '商务局' },
]

const regionOptions = [
  { value: '', label: '全部区域' },
  { value: '太仓市', label: '太仓市' },
  { value: '苏州市', label: '苏州市' },
  { value: '江苏省', label: '江苏省' },
  { value: '国家级', label: '国家级' },
]

export default function Policies() {
  const { list: subscriptions, loading: subsLoading, fetchSubscriptions, addSubscription, deleteSubscription, newPolicyCount, fetchNewPolicyCount, markPoliciesAsRead } = useSubscriptionStore()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAddSub, setShowAddSub] = useState(false)
  const [subName, setSubName] = useState('')
  const [subRegion, setSubRegion] = useState('')
  const [subDept, setSubDept] = useState('')
  const [subType, setSubType] = useState('')
  const [subKeywords, setSubKeywords] = useState('')
  const [addingSub, setAddingSub] = useState(false)
  const [showNewOnly, setShowNewOnly] = useState(false)
  const { showToast } = useToast()

  const fetchPolicies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      })
      if (regionFilter) params.set('region', regionFilter)
      if (deptFilter) params.set('department', deptFilter)
      if (typeFilter) params.set('supportType', typeFilter)

      const json = await apiFetch(`/api/policies?${params}`)
      if (json.success) {
        let list = json.data.list || []
        if (showNewOnly) list = list.filter((p: Policy) => p.isNew)
        setPolicies(list)
        setTotalPages(json.data.totalPages || 1)
      }
    } catch (e) {
      console.error('获取政策列表失败', e)
      showToast('error', '获取政策列表失败')
    }
    setLoading(false)
  }, [page, regionFilter, deptFilter, typeFilter, showNewOnly, showToast])

  useEffect(() => {
    fetchSubscriptions()
    fetchNewPolicyCount()
  }, [fetchSubscriptions, fetchNewPolicyCount])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleSearch = () => {
    if (!search.trim()) {
      fetchPolicies()
      return
    }
    setLoading(true)
    apiFetch(`/api/policies?page=1&limit=10&search=${encodeURIComponent(search)}`).then((json) => {
      if (json.success) {
        setPolicies(json.data.list || [])
        setTotalPages(json.data.totalPages || 1)
        setPage(1)
      }
      setLoading(false)
    })
  }

  const handleAddSubscription = async () => {
    if (!subName.trim()) return
    setAddingSub(true)
    try {
      await addSubscription({
        name: subName,
        region: subRegion,
        department: subDept,
        supportType: subType,
        keywords: subKeywords,
      })
      setShowAddSub(false)
      setSubName('')
      setSubRegion('')
      setSubDept('')
      setSubType('')
      setSubKeywords('')
    } catch (e) {
      console.error('创建订阅失败', e)
      showToast('error', '创建订阅失败')
    }
    setAddingSub(false)
  }

  const handleMarkRead = async () => {
    await markPoliciesAsRead()
    setPolicies((prev) => prev.map((p) => ({ ...p, isNew: false })))
  }

  const handleSubscribeFromFilter = (key: 'region' | 'department' | 'support') => {
    let name = ''
    let region = ''
    let department = ''
    let supportType = ''

    if (key === 'region' && regionFilter) { name = `${regionFilter}政策`; region = regionFilter }
    else if (key === 'department' && deptFilter) { name = `${deptFilter}政策`; department = deptFilter }
    else if (key === 'support' && typeFilter) { name = `${typeFilter}政策`; supportType = typeFilter }
    else return

    setSubName(name)
    setSubRegion(region)
    setSubDept(department)
    setSubType(supportType)
    setShowAddSub(true)
  }

  const activeSubscriptionsCount = subscriptions.length

  const isFiltered = regionFilter || deptFilter || typeFilter

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">政策雷达</h3>
          <p className="text-sm text-slate-400 mt-0.5">订阅关注区域，新政策自动推送提醒</p>
        </div>
        <div className="flex items-center gap-2">
          {newPolicyCount > 0 && (
            <button onClick={handleMarkRead} className="btn-ghost text-xs gap-1.5">
              <Bell size={15} />
              标记已读
            </button>
          )}
          <button onClick={() => setShowAddSub(true)} className="btn-primary text-sm gap-1.5">
            <Rss size={16} />
            新建订阅
          </button>
        </div>
      </div>

      {/* Subscription Dashboard */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-800">
            我的订阅
            <span className="ml-2 text-xs font-normal text-slate-400">{activeSubscriptionsCount} 个活跃</span>
          </h4>
        </div>

        {subsLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
            加载订阅中...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Rss size={24} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 mb-1">暂无订阅</p>
            <p className="text-xs text-slate-300 mb-4">订阅区域或部门，新政策自动推送</p>
            <button onClick={() => setShowAddSub(true)} className="btn-primary text-xs gap-1">
              <Plus size={14} />
              创建第一个订阅
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="relative group border border-slate-100 rounded-xl p-3.5 hover:border-slate-200 hover:shadow-sm transition-all">
                <button
                  onClick={() => deleteSubscription(sub.id)}
                  className="absolute top-2 right-2 p-1 rounded-md text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={14} />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Rss size={14} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">{sub.name}</span>
                </div>
                <div className="space-y-1">
                  {sub.region && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin size={12} />
                      <span>{sub.region}</span>
                    </div>
                  )}
                  {sub.department && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Building2 size={12} />
                      <span>{sub.department}</span>
                    </div>
                  )}
                  {sub.supportType && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Tag size={12} />
                      <span>{sub.supportType}</span>
                    </div>
                  )}
                  {sub.keywords && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Search size={12} />
                      <span className="truncate">{sub.keywords}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索政策标题..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <select value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setPage(1) }} className="input-field text-sm w-auto min-w-[120px]">
            {regionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }} className="input-field text-sm w-auto min-w-[120px]">
            {departmentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="input-field text-sm w-auto min-w-[120px]">
            {supportTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {newPolicyCount > 0 && (
            <button
              onClick={() => setShowNewOnly(!showNewOnly)}
              className={cn(
                'btn-ghost text-xs gap-1.5 shrink-0',
                showNewOnly && 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              )}
            >
              <Bell size={14} />
              仅看新政策 ({newPolicyCount})
            </button>
          )}
        </div>

        {/* Quick subscribe from filter */}
        {isFiltered && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">将当前筛选保存为订阅：</span>
            {regionFilter && (
              <button onClick={() => handleSubscribeFromFilter('region')} className="tag bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer text-xs">
                + {regionFilter}政策
              </button>
            )}
            {deptFilter && (
              <button onClick={() => handleSubscribeFromFilter('department')} className="tag bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer text-xs">
                + {deptFilter}政策
              </button>
            )}
            {typeFilter && (
              <button onClick={() => handleSubscribeFromFilter('support')} className="tag bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer text-xs">
                + {typeFilter}政策
              </button>
            )}
          </div>
        )}
      </div>

      {/* Policy List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-1">没有找到匹配的政策</p>
          <p className="text-sm text-slate-400">尝试调整筛选条件或搜索关键词</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {policies.map((policy) => (
            <Link
              key={policy.id}
              to={`/policies/${policy.id}`}
              className="block card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {policy.isNew && (
                      <span className="badge bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0.5 animate-pulse">
                        NEW
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {policy.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 size={13} />
                      {policy.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {policy.region}
                    </span>
                    {policy.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        截止 {policy.deadline}
                      </span>
                    )}
                    {policy.subsidy && (
                      <span className="badge-green text-[10px] px-1.5 py-0.5">
                        {policy.subsidy}
                      </span>
                    )}
                  </div>
                  {policy.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {policy.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="tag bg-slate-50 text-slate-500 text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ExternalLink size={16} className="text-slate-300 shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn-ghost text-sm disabled:opacity-30"
          >
            <ChevronDown size={16} className="rotate-90" />
            上一页
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (page <= 4) {
              pageNum = i + 1
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = page - 3 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                  page === pageNum
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {pageNum}
              </button>
            )
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn-ghost text-sm disabled:opacity-30"
          >
            下一页
            <ChevronDown size={16} className="-rotate-90" />
          </button>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddSub && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowAddSub(false)}>
          <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">新建订阅</h3>
              <button onClick={() => setShowAddSub(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">订阅名称 *</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="例如：太仓科技政策"
                  className="input-field text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">区域</label>
                  <select value={subRegion} onChange={(e) => setSubRegion(e.target.value)} className="input-field text-sm">
                    <option value="">不限</option>
                    {regionOptions.filter((o) => o.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">部门</label>
                  <select value={subDept} onChange={(e) => setSubDept(e.target.value)} className="input-field text-sm">
                    <option value="">不限</option>
                    {departmentOptions.filter((o) => o.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">政策类型</label>
                  <select value={subType} onChange={(e) => setSubType(e.target.value)} className="input-field text-sm">
                    <option value="">不限</option>
                    {supportTypes.filter((o) => o.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">关键词</label>
                  <input
                    type="text"
                    value={subKeywords}
                    onChange={(e) => setSubKeywords(e.target.value)}
                    placeholder="逗号分隔"
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleAddSubscription}
                disabled={!subName.trim() || addingSub}
                className="w-full btn-primary py-2.5 text-sm mt-2"
              >
                {addingSub ? '创建中...' : '创建订阅'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
