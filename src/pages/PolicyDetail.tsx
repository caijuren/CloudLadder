import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, Calendar, MapPin, Clock, CheckCircle2, XCircle, Award, FileText, ExternalLink } from 'lucide-react'
import { apiFetch } from '@/lib/store'

interface Policy {
  id: number
  title: string
  department: string
  deadline: string
  subsidy: string
  region: string
  tags: string[]
  description: string
  requirements: Record<string, string>
  process: string[]
  materials: string[]
  url: string
}

export default function PolicyDetail() {
  const { id } = useParams()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPolicy = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const json = await apiFetch(`/api/policies/${id}`)
      if (json.success) {
        setPolicy(json.data)
      } else {
        setError(json.message || '获取政策详情失败')
      }
    } catch {
      setError('获取政策详情失败')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchPolicy()
  }, [fetchPolicy])

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-6 w-32" />
        <div className="card p-6 space-y-4">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error || !policy) {
    return (
      <div className="card p-12 text-center">
        <XCircle size={40} className="mx-auto text-red-400 mb-3" />
        <p className="text-slate-500 mb-4">{error || '政策不存在'}</p>
        <Link to="/policies" className="btn-primary text-sm gap-1.5">
          <ArrowLeft size={16} />
          返回政策列表
        </Link>
      </div>
    )
  }

  const reqEntries = Object.entries(policy.requirements || {})

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Back button */}
      <Link
        to="/policies"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} />
        返回政策列表
      </Link>

      {/* Header Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800 mb-3">{policy.title}</h1>
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
              <div className="flex flex-wrap gap-1.5 mt-3">
                {policy.tags.map((tag) => (
                  <span key={tag} className="tag bg-slate-50 text-slate-500 text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Description */}
        <div className="lg:col-span-2 space-y-5">
          {policy.description && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                政策描述
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{policy.description}</p>
            </div>
          )}

          {/* Requirements */}
          {reqEntries.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                申报条件
              </h3>
              <div className="space-y-2">
                {reqEntries.map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-500 shrink-0 w-20">{key}</span>
                    <span className="text-sm text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process */}
          {policy.process && policy.process.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                申报流程
              </h3>
              <div className="space-y-0">
                {policy.process.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      {index < policy.process.length - 1 && (
                        <div className="w-px h-full min-h-[24px] bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm text-slate-700">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {policy.materials && policy.materials.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                所需材料
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {policy.materials.map((material, index) => (
                  <div key={index} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                    <div className="w-5 h-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm text-slate-700">{material}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">快捷操作</h3>
            <div className="space-y-2">
              <Link
                to={`/matching?policyId=${policy.id}`}
                className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Award size={16} />
                查看匹配度
              </Link>
              <Link
                to="/workbench"
                className="flex items-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                <Clock size={16} />
                加入申报工作台
              </Link>
            </div>
          </div>

          {/* Info Card */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">政策信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">归口部门</span>
                <span className="text-slate-700">{policy.department}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">适用区域</span>
                <span className="text-slate-700">{policy.region}</span>
              </div>
              {policy.deadline && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">截止时间</span>
                  <span className="text-slate-700">{policy.deadline}</span>
                </div>
              )}
              {policy.subsidy && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">补贴金额</span>
                  <span className="badge-green text-xs">{policy.subsidy}</span>
                </div>
              )}
            </div>
            {policy.url && (
              <a
                href={policy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 w-full p-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink size={14} />
                查看原文
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
