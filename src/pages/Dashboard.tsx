import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  FileText,
  Calendar,
  ArrowRight,
  Award,
  Radar,
  GitCompareArrows,
  Briefcase,
  Building2,
  AlertTriangle,
  Bell,
  Sparkles,
  Target,
  Database,
  Zap,
  ChevronRight,
  Lightbulb,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react'
import { apiFetch, useSubscriptionStore, useCompanyStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import CalendarComponent from '@/components/Calendar'

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

interface TaskItem {
  id: number
  title: string
  category: string
  deadline: string
  status: string
}

interface PolicyNews {
  id: number
  title: string
  date: string
  department: string
}

const quickActions = [
  { label: '政策雷达', path: '/policies', icon: Radar, color: 'text-blue-600' },
  { label: '智能匹配', path: '/matching', icon: GitCompareArrows, color: 'text-blue-600' },
  { label: '申报工作台', path: '/workbench', icon: Briefcase, color: 'text-blue-600' },
  { label: '企业档案', path: '/company/profile', icon: Building2, color: 'text-blue-600' },
]

const shortcutEntries = [
  { label: '资源库', path: '/links', icon: Target, color: 'bg-indigo-50 text-indigo-600' },
  { label: '政策雷达', path: '/policies', icon: Radar, color: 'bg-blue-50 text-blue-600' },
  { label: 'AI政策解析', path: '/policy-parse', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
  { label: '智能匹配', path: '/matching', icon: GitCompareArrows, color: 'bg-emerald-50 text-emerald-600' },
  { label: '企业档案', path: '/company/profile', icon: Building2, color: 'bg-orange-50 text-orange-600' },
  { label: '申报工作台', path: '/workbench', icon: Briefcase, color: 'bg-cyan-50 text-cyan-600' },
  { label: '爬虫管理', path: '/crawler', icon: Database, color: 'bg-rose-50 text-rose-600' },
]

const mockWeaknesses = [
  { name: '知识产权数量不足', status: '待提升', suggestion: '建议尽快申请软著或专利', level: 'high' },
  { name: '研发投入占比偏低', status: '待提升', suggestion: '建议加大研发投入，建立研发费用专账', level: 'medium' },
  { name: '高新技术企业认证', status: '待完善', suggestion: '建议尽快完成高企认定', level: 'high' },
  { name: '专利质量提升空间', status: '待提升', suggestion: '建议提高专利申请质量', level: 'low' },
]

const mockPolicyNews: PolicyNews[] = [
  { id: 1, title: '苏州市科技局发布《2026年科技创新补贴申报指南》', date: '05-20', department: '科技部' },
  { id: 2, title: '江苏省工信厅发布《专精特新中小企业申报通知》', date: '05-19', department: '工信部' },
  { id: 3, title: '太仓市人才办发布《领军人才计划申报通知》', date: '05-18', department: '人才办' },
  { id: 4, title: '科技部发布《国家重点研发计划申报指南》', date: '05-17', department: '科技部' },
]

const mockChartData = [
  { month: '2026-01', value: 45 },
  { month: '2026-02', value: 52 },
  { month: '2026-03', value: 48 },
  { month: '2026-04', value: 61 },
  { month: '2026-05', value: 55 },
  { month: '2026-06', value: 68 },
]

const mockStats = [
  { label: '政策总数', value: '1,234', change: '+12%', sub: '本月新增 45', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', path: '/policies' },
  { label: '可申报项目', value: '56', change: '+8%', sub: '匹配度>60%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/matching' },
  { label: '累计申报数', value: '128', change: '+15%', sub: '本年度', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', path: '/workbench' },
  { label: '获得补贴', value: '356.8万', change: '+10%', sub: '本年度金额', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50', path: '/workbench' },
]

function getHealthLabel(score: number) {
  if (score >= 80) return { label: '优秀', color: 'text-emerald-500', bg: 'bg-emerald-50' }
  if (score >= 60) return { label: '良好', color: 'text-blue-500', bg: 'bg-blue-50' }
  return { label: '待提升', color: 'text-amber-500', bg: 'bg-amber-50' }
}

function HealthGauge({ score, onDetail }: { score: number; onDetail: () => void }) {
  const radius = 80
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const healthLabel = getHealthLabel(score)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 176 176">
          <circle
            cx="88"
            cy="88"
            r={normalizedRadius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="88"
            cy="88"
            r={normalizedRadius}
            fill="none"
            stroke="#10b981"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-slate-800">{score}</span>
          <span className="text-sm text-slate-400">分</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={cn('text-sm font-medium px-3 py-1 rounded-full', healthLabel.bg, healthLabel.color)}>
          {healthLabel.label}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">
        <TrendingUp size={14} />
        较上周 +5
      </div>
      <button onClick={onDetail} className="mt-3 text-xs text-blue-600 hover:underline">查看详情</button>
    </div>
  )
}

function LineChart() {
  const width = 400
  const height = 160
  const padding = { top: 10, right: 10, bottom: 30, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...mockChartData.map(d => d.value))
  const minValue = Math.min(...mockChartData.map(d => d.value))
  const range = maxValue - minValue || 1

  const points = mockChartData.map((d, i) => ({
    x: padding.left + (i / (mockChartData.length - 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {[0, 1, 2, 3].map(i => (
        <line
          key={i}
          x1={padding.left}
          y1={padding.top + (i / 3) * chartHeight}
          x2={width - padding.right}
          y2={padding.top + (i / 3) * chartHeight}
          stroke="#f1f5f9"
          strokeWidth="1"
        />
      ))}
      <path
        d={pathD}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`}
        fill="url(#gradient)"
        opacity="0.1"
      />
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563eb" />
      ))}
      {mockChartData.map((d, i) => (
        <text
          key={i}
          x={padding.left + (i / (mockChartData.length - 1)) * chartWidth}
          y={height - 8}
          textAnchor="middle"
          className="text-xs fill-slate-400"
          style={{ fontSize: '10px' }}
        >
          {d.month}
        </text>
      ))}
    </svg>
  )
}

// Modal Component
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-auto animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { newPolicyCount, fetchSubscriptions, fetchNewPolicyCount, markPoliciesAsRead } = useSubscriptionStore()
  const { profile: companyProfile } = useCompanyStore()
  const companyName = companyProfile?.name || '企业名称'
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [showWeaknessModal, setShowWeaknessModal] = useState(false)

  useEffect(() => {
    fetchData()
    fetchSubscriptions()
    fetchNewPolicyCount()
  }, [fetchSubscriptions, fetchNewPolicyCount])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [matchJson, tasksJson] = await Promise.all([
        apiFetch('/api/matching'),
        apiFetch('/api/workbench/tasks'),
      ])
      if (matchJson.success) setMatchResults(matchJson.data || [])
      if (tasksJson.success) setTasks(tasksJson.data || [])
    } catch {
      setError('数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  const avgMatchRate = matchResults.length > 0
    ? Math.round(matchResults.reduce((sum, r) => sum + r.matchRate, 0) / matchResults.length)
    : 85

  const healthScore = avgMatchRate

  const topRecommendations = useMemo(() => {
    if (matchResults.length > 0) {
      return [...matchResults].sort((a, b) => b.matchRate - a.matchRate).slice(0, 3)
    }
    return [
      {
        id: 1,
        policyId: 1,
        policyTitle: '高新技术企业认定',
        matchRate: 92,
        matchedItems: [],
        unmatchedItems: [],
        subsidy: '最高 100 万元',
        deadline: '2024-06-30',
        department: '科技部',
        region: '全国',
        tags: ['高企认定'],
      },
      {
        id: 2,
        policyId: 2,
        policyTitle: '科技型中小企业入库',
        matchRate: 88,
        matchedItems: [],
        unmatchedItems: [],
        subsidy: '最高 30 万元',
        deadline: '2024-05-15',
        department: '工信部',
        region: '全国',
        tags: ['科技型中小企业'],
      },
      {
        id: 3,
        policyId: 3,
        policyTitle: '专精特新中小企业认定',
        matchRate: 85,
        matchedItems: [],
        unmatchedItems: [],
        subsidy: '最高 50 万元',
        deadline: '2024-07-20',
        department: '科技厅',
        region: '省级',
        tags: ['专精特新'],
      },
    ]
  }, [matchResults])

  const pendingTasks = useMemo(() => {
    const filtered = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').slice(0, 4)
    if (filtered.length > 0) return filtered
    return [
      { id: 1, title: '高企认定申报材料准备', category: '高企认定', deadline: '2024-06-30', status: 'in_progress' },
      { id: 2, title: '研发费用专项审计报告', category: '专精特新', deadline: '2024-05-15', status: 'pending' },
      { id: 3, title: '知识产权证明材料', category: '知识产权', deadline: '2024-04-20', status: 'pending' },
      { id: 4, title: '企业所得税纳税证明', category: '税收优惠', deadline: '2024-05-31', status: 'in_progress' },
    ]
  }, [tasks])

  const getDaysUntil = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days}天后截止` : '已截止'
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
      {/* Health Detail Modal */}
      {showHealthModal && (
        <Modal title="科创健康度详情" onClose={() => setShowHealthModal(false)}>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="text-center">
                <span className="text-6xl font-bold text-slate-800">{healthScore}</span>
                <span className="text-lg text-slate-400 ml-1">分</span>
                <p className="text-sm text-slate-500 mt-2">综合评分基于企业资质、知识产权、研发投入等多维度评估</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">企业资质</span>
                <span className="text-sm font-medium text-emerald-600">85分</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">知识产权</span>
                <span className="text-sm font-medium text-amber-600">72分</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">研发投入</span>
                <span className="text-sm font-medium text-emerald-600">90分</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">营收规模</span>
                <span className="text-sm font-medium text-blue-600">78分</span>
              </div>
            </div>
            <button
              onClick={() => { setShowHealthModal(false); navigate('/company/profile') }}
              className="w-full btn-primary mt-2"
            >
              完善企业信息
            </button>
          </div>
        </Modal>
      )}

      {/* Weakness Detail Modal */}
      {showWeaknessModal && (
        <Modal title="短板诊断与建议" onClose={() => setShowWeaknessModal(false)}>
          <div className="space-y-4">
            {mockWeaknesses.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-700">{item.name}</h4>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    item.level === 'high' ? 'bg-red-50 text-red-500' :
                    item.level === 'medium' ? 'bg-amber-50 text-amber-500' :
                    'bg-blue-50 text-blue-500'
                  )}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{item.suggestion}</p>
              </div>
            ))}
            <button
              onClick={() => { setShowWeaknessModal(false); navigate('/matching') }}
              className="w-full btn-primary mt-2"
            >
              查看匹配项目
            </button>
          </div>
        </Modal>
      )}

      {/* Header: Greeting + Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">上午好，{companyName}</h1>
          <p className="text-sm text-slate-400 mt-1">欢迎使用项目申报平台智能助手</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all text-sm font-medium text-slate-700 whitespace-nowrap"
              >
                <Icon size={16} className={action.color} />
                {action.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* New policy notification */}
      {newPolicyCount > 0 && (
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Bell size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">新增 {newPolicyCount} 条政策</p>
                <p className="text-xs text-slate-400">上次访问后有新政策发布，点击查看</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={markPoliciesAsRead} className="btn-ghost text-xs whitespace-nowrap">
                标记已读
              </button>
              <Link to="/policies" className="btn-primary text-xs gap-1 whitespace-nowrap">
                <Bell size={14} />
                查看新政策
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Section: Health Score + Weakness + Recommendations + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Health Score */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">科创健康度</h3>
            <Award className="text-blue-500" size={20} />
          </div>
          <HealthGauge score={healthScore} onDetail={() => setShowHealthModal(true)} />
        </div>

        {/* Weakness Diagnosis */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">短板诊断</h3>
            <Lightbulb className="text-amber-500" size={20} />
          </div>
          <div className="space-y-3">
            {mockWeaknesses.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.suggestion}</p>
                </div>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded shrink-0',
                  item.level === 'high' ? 'bg-red-50 text-red-500' :
                  item.level === 'medium' ? 'bg-amber-50 text-amber-500' :
                  'bg-blue-50 text-blue-500'
                )}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowWeaknessModal(true)} className="mt-4 text-xs text-blue-600 hover:underline">查看建议</button>
        </div>

        {/* Recommended Projects */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500">推荐项目</h3>
            <Link to="/matching" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {topRecommendations.map((item) => (
              <Link
                key={item.id}
                to={`/policies/${item.policyId}`}
                className="block p-3 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-slate-800 line-clamp-1">{item.policyTitle}</h4>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2',
                    item.matchRate >= 80 ? 'badge-green' :
                    item.matchRate >= 60 ? 'badge-yellow' :
                    'badge-gray'
                  )}>
                    匹配度 {item.matchRate}%
                  </span>
                </div>
                <p className="text-xs text-blue-600 font-medium">{item.subsidy}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              <h3 className="text-sm font-medium text-slate-500">待办事项</h3>
            </div>
            <Link to="/workbench" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              进入工作台 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingTasks.map((item, idx) => (
              <Link
                key={item.id}
                to="/workbench"
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  idx % 3 === 0 ? 'bg-red-400' : idx % 3 === 1 ? 'bg-amber-400' : 'bg-blue-400'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{item.title}</p>
                </div>
                <span className="text-xs text-red-500 shrink-0 font-medium">
                  {getDaysUntil(item.deadline)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Middle section: Calendar + Policy News + Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-4 card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-blue-600" />
            <h3 className="text-sm font-medium text-slate-500">申报日历</h3>
          </div>
          <CalendarComponent />
        </div>

        {/* Policy News */}
        <div className="lg:col-span-4 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              <h3 className="text-sm font-medium text-slate-500">新政策通知</h3>
            </div>
            <Link to="/policies" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              查看更多 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {mockPolicyNews.map((news) => (
              <Link
                key={news.id}
                to={`/policies/${news.id}`}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {news.title}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{news.date}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-4 card p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-4">快捷入口</h3>
          <div className="grid grid-cols-3 gap-3">
            {shortcutEntries.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors hover:bg-slate-50"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', link.color)}>
                    <Icon size={20} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom section: Application Trends + Data Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Application Trends */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h3 className="text-sm font-medium text-slate-500">申报动态</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2 size={12} className="text-emerald-500" /> 全部
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} className="text-blue-500" /> 申报中
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2 size={12} className="text-slate-400" /> 已完成
              </span>
              <span className="text-xs text-slate-400 ml-2">近6个月</span>
            </div>
          </div>
          <LineChart />
        </div>

        {/* Data Overview Stats */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-4">数据概览</h3>
          <div className="grid grid-cols-2 gap-4">
            {mockStats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  onClick={() => stat.path && navigate(stat.path)}
                  className={cn(
                    'p-4 bg-slate-50 rounded-xl cursor-pointer transition-all',
                    stat.path && 'hover:shadow-md hover:bg-white'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className={stat.color} />
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                    <span className="text-xs text-emerald-500 font-medium">{stat.change}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
