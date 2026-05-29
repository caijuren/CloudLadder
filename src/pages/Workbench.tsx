import { useEffect, useState } from 'react'
import {
  Plus,
  X,
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Search,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { apiFetch } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface Task {
  id: number
  title: string
  category: string
  deadline: string
  status: string
  progress: number
  notes: string
}

const categories = [
  { value: '', label: '全部分类' },
  { value: '材料', label: '材料' },
  { value: '资质', label: '资质' },
  { value: '财务', label: '财务' },
  { value: '合同', label: '合同' },
  { value: '其他', label: '其他' },
]

const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待办' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
]

export default function Workbench() {
  const { showToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const json = await apiFetch('/api/workbench/tasks')
      if (json.success) setTasks(json.data || [])
    } catch {
      // ignore fetch error
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.title?.trim()) return
    setAdding(true)
    try {
      const json = await apiFetch('/api/workbench/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          category: form.category || '其他',
          deadline: form.deadline || '',
          notes: form.notes || '',
        }),
      })
      if (json.success) {
        setShowAdd(false)
        setForm({})
        fetchTasks()
        showToast('success', '添加成功')
      }
    } catch {
      showToast('error', '添加失败')
    }
    setAdding(false)
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/workbench/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      fetchTasks()
    } catch {
      showToast('error', '更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/workbench/tasks/${id}`, { method: 'DELETE' })
      setTasks((prev) => prev.filter((t) => t.id !== id))
      showToast('success', '已删除')
    } catch {
      showToast('error', '删除失败')
    }
  }

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (categoryFilter && t.category !== categoryFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  const getDeadlineColor = (deadline: string) => {
    if (!deadline) return ''
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return 'text-red-500'
    if (days <= 7) return 'text-amber-500'
    return 'text-slate-400'
  }

  const getDeadlineText = (deadline: string) => {
    if (!deadline) return ''
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return `逾期 ${Math.abs(days)} 天`
    if (days === 0) return '今天截止'
    if (days <= 7) return `${days} 天后截止`
    return deadline.slice(0, 10)
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
          <h3 className="text-base font-semibold text-slate-800">申报工作台</h3>
          <p className="text-sm text-slate-400 mt-0.5">管理申报任务，跟踪项目进度</p>
        </div>
        <button onClick={() => { setForm({}); setShowAdd(true) }} className="btn-primary text-sm gap-1.5">
          <Plus size={16} />
          添加任务
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statusFilters.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={cn(
              'card p-4 text-left transition-all cursor-pointer',
              statusFilter === s.value
                ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                : 'hover:shadow-md'
            )}
          >
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={cn(
              'text-2xl font-bold',
              statusFilter === s.value ? 'text-blue-700' : 'text-slate-800'
            )}>
              {counts[s.value as keyof typeof counts]}
            </p>
          </button>
        ))}
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
              placeholder="搜索任务..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field text-sm w-auto min-w-[120px]">
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium mb-1">
            {tasks.length === 0 ? '暂无任务' : '没有匹配的任务'}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {tasks.length === 0 ? '开始添加您的第一个申报任务吧' : '尝试调整筛选条件'}
          </p>
          {tasks.length === 0 && (
            <button onClick={() => { setForm({}); setShowAdd(true) }} className="btn-primary text-sm gap-1.5">
              <Plus size={16} />
              添加任务
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={cn(
                'card p-4 hover:shadow-md transition-all duration-200',
                task.status === 'completed' && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <button
                  onClick={() => {
                    const next =
                      task.status === 'pending' ? 'in_progress' :
                      task.status === 'in_progress' ? 'completed' : 'pending'
                    handleUpdateStatus(task.id, next)
                  }}
                  className="shrink-0 mt-0.5"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : task.status === 'in_progress' ? (
                    <Circle size={20} className="text-blue-400" />
                  ) : (
                    <Circle size={20} className="text-slate-300" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-sm font-medium',
                      task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'
                    )}>
                      {task.title}
                    </span>
                    <span className="tag bg-slate-50 text-slate-500 text-[10px]">{task.category}</span>
                  </div>

                  {task.notes && (
                    <p className="text-xs text-slate-400 mb-2">{task.notes}</p>
                  )}

                  <div className="flex items-center gap-3">
                    {task.deadline && (
                      <span className={cn('flex items-center gap-1 text-xs', getDeadlineColor(task.deadline))}>
                        <Clock size={12} />
                        {getDeadlineText(task.deadline)}
                      </span>
                    )}
                    {task.status === 'in_progress' && (
                      <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{task.progress || 0}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {task.status === 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'pending')}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-all"
                      title="重置"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
              <h3 className="text-base font-semibold text-slate-800">添加任务</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="关闭"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">任务名称 *</label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="如：准备高企认定申报材料"
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
                    {categories.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">截止日期</label>
                  <input
                    type="date"
                    value={form.deadline || ''}
                    onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                    className="input-field text-sm"
                  />
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
                disabled={!form.title?.trim() || adding}
                className="w-full btn-primary py-2.5 text-sm mt-2"
              >
                {adding ? '添加中...' : '添加任务'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
