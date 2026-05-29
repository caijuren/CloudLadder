import { useState } from 'react'
import { BrainCircuit, Wand2, Save, X, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/store'
import { useToast } from '@/components/Toast'

interface ParsedPolicy {
  title: string
  department: string
  region: string
  deadline: string
  subsidy: string
  supportType: string
  description: string
  requirements: Record<string, string>
  process: string[]
  materials: string[]
  tags: string[]
}

export default function PolicyParse() {
  const { showToast } = useToast()
  const [rawText, setRawText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedPolicy | null>(null)
  const [saving, setSaving] = useState(false)

  const handleParse = async () => {
    if (!rawText.trim()) return
    setParsing(true)
    try {
      const json = await apiFetch('/api/policies/parse', {
        method: 'POST',
        body: JSON.stringify({ rawText }),
      })
      if (json.success) {
        setParsed(json.data)
        showToast('success', '解析成功')
      } else {
        showToast('error', json.message || '解析失败')
      }
    } catch {
      showToast('error', '解析请求失败')
    }
    setParsing(false)
  }

  const handleSave = async () => {
    if (!parsed) return
    setSaving(true)
    try {
      const json = await apiFetch('/api/policies', {
        method: 'POST',
        body: JSON.stringify({
          title: parsed.title,
          department: parsed.department,
          region: parsed.region,
          deadline: parsed.deadline,
          subsidy: parsed.subsidy,
          supportType: parsed.supportType,
          description: parsed.description,
          requirements: parsed.requirements,
          process: parsed.process,
          materials: parsed.materials,
          tags: parsed.tags,
        }),
      })
      if (json.success) {
        showToast('success', '保存成功')
        setParsed(null)
        setRawText('')
      } else {
        showToast('error', json.message || '保存失败')
      }
    } catch {
      showToast('error', '保存请求失败')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-slate-800">AI 政策解析</h3>
        <p className="text-sm text-slate-400 mt-0.5">粘贴政策原文，AI 自动提取结构化信息</p>
      </div>

      {/* Input Section */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText size={16} className="text-blue-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">政策原文</h4>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="请粘贴政策原文内容..."
          className="input-field text-sm min-h-[200px] resize-y"
        />
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">支持各类政策文本，AI 将自动提取关键信息</p>
          <button
            onClick={handleParse}
            disabled={!rawText.trim() || parsing}
            className="btn-primary text-sm gap-1.5"
          >
            {parsing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                开始解析
              </>
            )}
          </button>
        </div>
      </div>

      {/* Parsed Result */}
      {parsed && (
        <div className="card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BrainCircuit size={16} className="text-emerald-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">解析结果</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setParsed(null); setRawText('') }}
                className="btn-ghost text-xs gap-1"
              >
                <X size={14} />
                清除
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-xs gap-1.5"
              >
                <Save size={14} />
                {saving ? '保存中...' : '保存到政策库'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">政策标题</p>
                <p className="text-sm font-medium text-slate-800">{parsed.title || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">归口部门</p>
                <p className="text-sm font-medium text-slate-800">{parsed.department || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">适用区域</p>
                <p className="text-sm font-medium text-slate-800">{parsed.region || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">截止时间</p>
                <p className="text-sm font-medium text-slate-800">{parsed.deadline || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">补贴金额</p>
                <p className="text-sm font-medium text-emerald-600">{parsed.subsidy || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">支持方式</p>
                <p className="text-sm font-medium text-slate-800">{parsed.supportType || '-'}</p>
              </div>
            </div>

            {/* Description */}
            {parsed.description && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">政策描述</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{parsed.description}</p>
              </div>
            )}

            {/* Requirements */}
            {Object.keys(parsed.requirements || {}).length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  申报条件
                </p>
                <div className="space-y-2">
                  {Object.entries(parsed.requirements).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-xs font-medium text-slate-500 shrink-0 w-20">{key}</span>
                      <span className="text-sm text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process */}
            {parsed.process && parsed.process.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">申报流程</p>
                <div className="space-y-0">
                  {parsed.process.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        {index < parsed.process.length - 1 && (
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
            {parsed.materials && parsed.materials.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">所需材料</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {parsed.materials.map((material, index) => (
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

            {/* Tags */}
            {parsed.tags && parsed.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">标签</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.tags.map((tag) => (
                    <span key={tag} className="tag bg-blue-50 text-blue-600 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
