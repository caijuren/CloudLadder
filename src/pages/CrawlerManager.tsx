import { useEffect, useState } from 'react'
import {
  Plus,
  X,
  Globe,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Building2,
  MapPin,
} from 'lucide-react'
import { apiFetch } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface CrawlerSource {
  id: number
  name: string
  url: string
  department: string
  region: string
  enabled: boolean
  lastCrawlAt: string
}

interface CrawlLog {
  id: number
  sourceName: string
  policyTitle: string
  status: string
  error: string
  createdAt: string
}

export default function CrawlerManager() {
  const { showToast } = useToast()
  const [sources, setSources] = useState<CrawlerSource[]>([])
  const [logs, setLogs] = useState<CrawlLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [crawling, setCrawling] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'sources' | 'logs'>('sources')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sourcesJson, logsJson] = await Promise.all([
        apiFetch('/api/crawler/sources'),
        apiFetch('/api/crawler/logs'),
      ])
      if (sourcesJson.success) setSources(sourcesJson.data || [])
      if (logsJson.success) setLogs(logsJson.data || [])
    } catch {
      // ignore fetch error
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.name?.trim() || !form.url?.trim()) return
    setAdding(true)
    try {
      const json = await apiFetch('/api/crawler/sources', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          department: form.department || '',
          region: form.region || '',
        }),
      })
      if (json.success) {
        setShowAdd(false)
        setForm({})
        fetchData()
        showToast('success', '添加成功')
      }
    } catch {
      showToast('error', '添加失败')
    }
    setAdding(false)
  }

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/crawler/sources/${id}`, { method: 'DELETE' })
      setSources((prev) => prev.filter((s) => s.id !== id))
      showToast('success', '已删除')
    } catch {
      showToast('error', '删除失败')
    }
  }

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await apiFetch(`/api/crawler/sources/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !enabled }),
      })
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !enabled } : s))
    } catch {
      showToast('error', '更新失败')
    }
  }

  const handleCrawl = async (id?: number) => {
    setCrawling(id || 0)
    try {
      const url = id ? `/api/crawler/run/${id}` : '/api/crawler/run'
      const json = await apiFetch(url, { method: 'POST' })
      if (json.success) {
        showToast('success', `爬取完成，新增 ${json.data?.added || 0} 条政策`)
        fetchData()
      } else {
        showToast('error', json.message || '爬取失败')
      }
    } catch {
      showToast('error', '爬取请求失败')
    }
    setCrawling(null)
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">爬虫管理</h3>
          <p className="text-sm text-slate-400 mt-0.5">管理政策来源，自动抓取最新政策</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCrawl()}
            disabled={crawling !== null}
            className="btn-accent text-sm gap-1.5"
          >
            {crawling === 0 ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            全量爬取
          </button>
          <button onClick={() => { setForm({}); setShowAdd(true) }} className="btn-primary text-sm gap-1.5">
            <Plus size={16} />
            添加来源
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('sources')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'sources'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Globe size={16} />
          政策来源
          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{sources.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'logs'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Clock size={16} />
          爬取日志
          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{logs.length}</span>
        </button>
      </div>

      {/* Sources Tab */}
      {activeTab === 'sources' && (
        <>
          {sources.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Globe size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-1">暂无政策来源</p>
              <p className="text-sm text-slate-400 mb-4">添加政府部门网站，自动抓取政策</p>
              <button onClick={() => { setForm({}); setShowAdd(true) }} className="btn-primary text-sm gap-1.5">
                <Plus size={16} />
                添加来源
              </button>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="card p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-slate-800">{source.name}</h4>
                        <button
                          onClick={() => handleToggle(source.id, source.enabled)}
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-medium transition-all',
                            source.enabled
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          {source.enabled ? '已启用' : '已禁用'}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe size={12} />
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors truncate max-w-[200px]">
                            {source.url}
                          </a>
                        </span>
                        {source.department && (
                          <span className="flex items-center gap-1">
                            <Building2 size={12} />
                            {source.department}
                          </span>
                        )}
                        {source.region && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {source.region}
                          </span>
                        )}
                        {source.lastCrawlAt && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            上次爬取：{source.lastCrawlAt}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCrawl(source.id)}
                        disabled={crawling === source.id || !source.enabled}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="单源爬取"
                      >
                        {crawling === source.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <>
          {logs.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium mb-1">暂无爬取日志</p>
              <p className="text-sm text-slate-400">执行爬取后将显示日志记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'card p-4',
                    log.status === 'success' ? 'border-l-4 border-l-emerald-400' :
                    log.status === 'error' ? 'border-l-4 border-l-red-400' :
                    'border-l-4 border-l-amber-400'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {log.status === 'success' ? (
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        ) : log.status === 'error' ? (
                          <AlertTriangle size={14} className="text-red-500 shrink-0" />
                        ) : (
                          <Loader2 size={14} className="text-amber-500 shrink-0 animate-spin" />
                        )}
                        <span className="text-sm font-medium text-slate-800">{log.policyTitle || '未知政策'}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>来源：{log.sourceName}</span>
                        <span>{log.createdAt}</span>
                        {log.error && <span className="text-red-400">错误：{log.error}</span>}
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                      log.status === 'success' ? 'badge-green' :
                      log.status === 'error' ? 'badge-red' :
                      'badge-yellow'
                    )}>
                      {log.status === 'success' ? '成功' : log.status === 'error' ? '失败' : '进行中'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">添加政策来源</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="关闭"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">名称 *</label>
                <input
                  type="text"
                  value={form.name || ''}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="如：太仓市人民政府"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">网址 *</label>
                <input
                  type="url"
                  value={form.url || ''}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://..."
                  className="input-field text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">归口部门</label>
                  <input
                    type="text"
                    value={form.department || ''}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                    placeholder="如：科技局"
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">区域</label>
                  <input
                    type="text"
                    value={form.region || ''}
                    onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                    placeholder="如：太仓市"
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={!form.name?.trim() || !form.url?.trim() || adding}
                className="w-full btn-primary py-2.5 text-sm mt-2"
              >
                {adding ? '添加中...' : '添加来源'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
