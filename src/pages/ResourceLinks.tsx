import { useEffect, useState } from 'react'
import { Plus, X, ExternalLink, Search, FolderOpen, Link2, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface ResourceLink {
  id: number
  name: string
  url: string
  category: string
  notes: string
}

const defaultCategories = ['政府门户', '申报平台', '通知公告', '其他']

export default function ResourceLinks() {
  const { showToast } = useToast()
  const [links, setLinks] = useState<ResourceLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const json = await apiFetch('/api/links')
      if (json.success) setLinks(json.data || [])
    } catch {
      // ignore fetch error
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.name?.trim() || !form.url?.trim()) return
    setAdding(true)
    try {
      const json = await apiFetch('/api/links', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          category: form.category || '其他',
          notes: form.notes || '',
        }),
      })
      if (json.success) {
        setShowAdd(false)
        setForm({})
        fetchLinks()
        showToast('success', '添加成功')
      }
    } catch {
      showToast('error', '添加失败')
    }
    setAdding(false)
  }

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/links/${id}`, { method: 'DELETE' })
      setLinks((prev) => prev.filter((l) => l.id !== id))
      showToast('success', '已删除')
    } catch {
      showToast('error', '删除失败')
    }
  }

  const categories = Array.from(new Set([...defaultCategories, ...links.map((l) => l.category)]))

  const filtered = links.filter((l) => {
    if (categoryFilter && l.category !== categoryFilter) return false
    if (search && !l.name.toLowerCase().includes(search.toLowerCase()) && !l.url.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = filtered.reduce((acc, link) => {
    const cat = link.category || '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(link)
    return acc
  }, {} as Record<string, ResourceLink[]>)

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
          <h3 className="text-base font-semibold text-slate-800">资源库</h3>
          <p className="text-sm text-slate-400 mt-0.5">管理政府网站和申报平台链接</p>
        </div>
        <button onClick={() => { setForm({}); setShowAdd(true) }} className="btn-primary text-sm gap-1.5">
          <Plus size={16} />
          添加链接
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索链接..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter('')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                !categoryFilter ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  categoryFilter === cat ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Link2 size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-1">暂无链接</p>
          <p className="text-sm text-slate-400 mb-4">添加常用的政府网站和申报平台</p>
          <button onClick={() => { setForm({}); setShowAdd(true) }} className="btn-primary text-sm gap-1.5">
            <Plus size={16} />
            添加链接
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, categoryLinks]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FolderOpen size={14} />
                {category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryLinks.map((link) => (
                  <div
                    key={link.id}
                    className="card p-4 group hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-1.5"
                        >
                          {link.name}
                          <ExternalLink size={12} className="text-slate-300 shrink-0" />
                        </a>
                        <p className="text-xs text-slate-400 mt-1 truncate">{link.url}</p>
                        {link.notes && (
                          <p className="text-xs text-slate-400 mt-1">{link.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">添加链接</h3>
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">分类</label>
                  <select
                    value={form.category || ''}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="input-field text-sm"
                  >
                    {defaultCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">备注</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="补充说明..."
                  className="input-field text-sm min-h-[60px]"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!form.name?.trim() || !form.url?.trim() || adding}
                className="w-full btn-primary py-2.5 text-sm mt-2"
              >
                {adding ? '添加中...' : '添加链接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
