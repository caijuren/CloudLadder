import { useEffect, useState, useMemo } from 'react'
import {
  Building2,
  FileCheck,
  FileText,
  FileSignature,
  Users,
  Plus,
  X,
  Save,
  Paperclip,
  Upload,
  Download,
  Search,
  Loader2,
} from 'lucide-react'
import { useCompanyStore, useDocumentStore } from '@/lib/store'
import { apiFetch } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

const tabs = [
  { key: 'basic', label: '基本信息', icon: Building2 },
  { key: 'certificates', label: '资质证照', icon: FileCheck },
  { key: 'financial', label: '财务资料', icon: FileText },
  { key: 'contracts', label: '合同协议', icon: FileSignature },
  { key: 'team', label: '团队成员', icon: Users },
]

function getDocCategory(key: string): string {
  const map: Record<string, string> = {
    certificates: 'certificate',
    financial: 'financial',
    contracts: 'contract',
  }
  return map[key] || 'other'
}

const regionOptions = [
  { value: '太仓市', label: '太仓市' },
  { value: '苏州市', label: '苏州市' },
  { value: '江苏省', label: '江苏省' },
  { value: '', label: '其他' },
]

const industryOptions = [
  { value: '软件/信息技术', label: '软件/信息技术' },
  { value: '人工智能', label: '人工智能' },
  { value: '生物医药', label: '生物医药' },
  { value: '新能源/环保', label: '新能源/环保' },
  { value: '先进制造', label: '先进制造' },
  { value: '新材料', label: '新材料' },
  { value: '集成电路', label: '集成电路' },
  { value: '文化创意', label: '文化创意' },
  { value: '农业科技', label: '农业科技' },
  { value: '', label: '其他' },
]

const companyTypeOptions = [
  { value: '有限责任公司', label: '有限责任公司' },
  { value: '股份有限公司', label: '股份有限公司' },
  { value: '个人独资企业', label: '个人独资企业' },
  { value: '合伙企业', label: '合伙企业' },
  { value: '', label: '其他' },
]

const educationOptions = [
  { value: '博士', label: '博士' },
  { value: '硕士', label: '硕士' },
  { value: '本科', label: '本科' },
  { value: '大专', label: '大专' },
  { value: '', label: '其他' },
]

export default function CompanyProfile() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('basic')
  const { profile, fetchProfile, updateProfile } = useCompanyStore()
  const { list: documents, loading: docLoading, fetchDocuments, addDocument, deleteDocument } = useDocumentStore()
  const [teamMembers, setTeamMembers] = useState<Array<{ id: number; name?: string; position?: string; education?: string; title?: string; major?: string; socialSecurityStatus?: string; joinDate?: string; phone?: string; email?: string }>>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [showDocModal, setShowDocModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [docForm, setDocForm] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: number } | null>(null)
  const [teamForm, setTeamForm] = useState<Record<string, string>>({})
  const [searchKeyword, setSearchKeyword] = useState('')
  const [fetching, setFetching] = useState(false)
  const [showAutoFill, setShowAutoFill] = useState(false)

  const isDocTab = activeTab === 'certificates' || activeTab === 'financial' || activeTab === 'contracts'

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        unifiedSocialCreditCode: profile.unifiedSocialCreditCode || '',
        legalRepresentative: profile.legalRepresentative || '',
        companyType: profile.companyType || '',
        registeredCapital: profile.registeredCapital || '',
        establishedDate: profile.establishedDate || '',
        revenue: profile.revenue || '',
        employeeCount: profile.employeeCount?.toString() || '',
        socialInsuranceCount: profile.socialInsuranceCount?.toString() || '',
        industry: profile.industry || '',
        region: profile.region || '',
        businessScope: profile.businessScope || '',
        description: profile.description || '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (isDocTab) {
      const category = getDocCategory(activeTab)
      fetchDocuments(category)
    }
  }, [activeTab, isDocTab, fetchDocuments])

  useEffect(() => {
    if (activeTab === 'team') fetchTeamMembers()
  }, [activeTab])

  const fetchTeamMembers = async () => {
    setTeamLoading(true)
    try {
      const json = await apiFetch('/api/company/team')
      if (json.success) setTeamMembers(json.data || [])
    } catch {
      // ignore fetch error
    }
    setTeamLoading(false)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({
        name: editForm.name,
        unifiedSocialCreditCode: editForm.unifiedSocialCreditCode,
        legalRepresentative: editForm.legalRepresentative,
        companyType: editForm.companyType,
        registeredCapital: editForm.registeredCapital,
        establishedDate: editForm.establishedDate,
        revenue: editForm.revenue,
        employeeCount: parseInt(editForm.employeeCount) || 0,
        socialInsuranceCount: parseInt(editForm.socialInsuranceCount) || 0,
        industry: editForm.industry,
        region: editForm.region,
        businessScope: editForm.businessScope,
        description: editForm.description,
      })
      showToast('success', '企业信息已保存')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败'
      showToast('error', msg)
    }
    setSaving(false)
  }

  const handleAddDoc = async () => {
    if (!docForm.name?.trim()) return
    try {
      await addDocument({
        category: getDocCategory(activeTab),
        name: docForm.name,
        docType: docForm.docType || '',
        docNumber: docForm.docNumber || '',
        issuingAuthority: docForm.issuingAuthority || '',
        grantDate: docForm.grantDate || '',
        expiryDate: docForm.expiryDate || '',
        amount: docForm.amount || '',
        counterparty: docForm.counterparty || '',
        status: docForm.status || 'active',
        notes: docForm.notes || '',
        fileUrl: uploadedFile?.url || '',
        fileOriginalName: uploadedFile?.name || '',
        fileSize: uploadedFile?.size || 0,
      })
      setShowDocModal(false)
      setDocForm({})
      setUploadedFile(null)
      showToast('success', '添加成功')
    } catch {
      showToast('error', '添加失败')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      showToast('error', '文件大小不能超过 20MB')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const json = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {},
      })
      if (json.success) {
        setUploadedFile({ url: json.data.url, name: json.data.originalName, size: json.data.size })
        showToast('success', '文件上传成功')
      } else {
        showToast('error', json.message || '上传失败')
      }
    } catch {
      showToast('error', '文件上传失败')
    }
    setUploading(false)
  }

  const handleAddTeam = async () => {
    if (!teamForm.name?.trim()) return
    try {
      await apiFetch('/api/company/team', {
        method: 'POST',
        body: JSON.stringify({
          name: teamForm.name,
          education: teamForm.education || '',
          position: teamForm.position || '',
          title: teamForm.title || '',
          phone: teamForm.phone || '',
          email: teamForm.email || '',
          joinDate: teamForm.joinDate || '',
          major: teamForm.major || '',
          socialSecurityStatus: teamForm.socialSecurityStatus || 'active',
        }),
      })
      setShowTeamModal(false)
      setTeamForm({})
      fetchTeamMembers()
      showToast('success', '添加成功')
    } catch {
      showToast('error', '添加失败')
    }
  }

  const handleDeleteDoc = async (id: number) => {
    try {
      await deleteDocument(id)
      showToast('success', '已删除')
    } catch {
      showToast('error', '删除失败')
    }
  }

  const handleDeleteTeam = async (id: number) => {
    try {
      await apiFetch(`/api/company/team/${id}`, { method: 'DELETE' })
      setTeamMembers((prev) => prev.filter((m) => m.id !== id))
      showToast('success', '已删除')
    } catch {
      showToast('error', '删除失败')
    }
  }

  const handleAutoFill = async () => {
    if (!searchKeyword.trim()) {
      showToast('error', '请输入企业名称或统一社会信用代码')
      return
    }
    setFetching(true)
    try {
      const json = await apiFetch('/api/company/fetch-info', {
        method: 'POST',
        body: JSON.stringify({ keyword: searchKeyword.trim() }),
      })
      if (json.success && json.data) {
        const d = json.data
        setEditForm((prev) => ({
          ...prev,
          name: d.name || prev.name,
          unifiedSocialCreditCode: d.unifiedSocialCreditCode || prev.unifiedSocialCreditCode,
          legalRepresentative: d.legalRepresentative || prev.legalRepresentative,
          companyType: d.companyType || prev.companyType,
          registeredCapital: d.registeredCapital || prev.registeredCapital,
          establishedDate: d.establishedDate || prev.establishedDate,
          industry: d.industry || prev.industry,
          region: d.region || prev.region,
          employeeCount: d.employeeCount ? String(d.employeeCount) : prev.employeeCount,
          businessScope: d.businessScope || prev.businessScope,
        }))
        showToast('success', `已获取「${d.name}」的企业信息`)
        if (json.demo) {
          showToast('info', '当前为演示数据，配置 API Key 后获取真实数据')
        }
        setShowAutoFill(false)
        setSearchKeyword('')
      } else {
        showToast('error', json.message || '未查询到企业信息')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '查询失败'
      showToast('error', msg)
    }
    setFetching(false)
  }

  const filteredDocs = useMemo(() => {
    const category = getDocCategory(activeTab)
    return documents.filter((d) => d.category === category)
  }, [documents, activeTab])

  const setFormField = (setter: React.Dispatch<React.SetStateAction<Record<string, string>>>, field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setter((prev) => ({ ...prev, [field]: e.target.value }))

  const getTabCount = (tabKey: string) => {
    if (tabKey === 'basic') return 1
    if (tabKey === 'team') return teamMembers.length
    return filteredDocs.length
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-slate-800">企业档案</h3>
        <p className="text-sm text-slate-400 mt-0.5">完善企业信息，提升政策匹配精准度</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const count = getTabCount(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'card p-3.5 text-center transition-all cursor-pointer',
                activeTab === tab.key
                  ? 'border-blue-200 bg-blue-50/50 shadow-sm'
                  : 'hover:shadow-md'
              )}
            >
              <Icon size={18} className={cn(
                'mx-auto mb-1.5',
                activeTab === tab.key ? 'text-blue-600' : 'text-slate-400'
              )} />
              <p className={cn(
                'text-lg font-bold',
                activeTab === tab.key ? 'text-blue-700' : 'text-slate-800'
              )}>{count}</p>
              <p className="text-[10px] text-slate-400">{tab.label}</p>
            </button>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-800">基本信息</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAutoFill(!showAutoFill)}
                className="btn-ghost text-sm gap-1.5"
              >
                <Search size={16} />
                一键回填
              </button>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary text-sm gap-1.5">
                <Save size={16} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          {showAutoFill && (
            <div className="mb-6 p-4 bg-blue-50/70 rounded-xl border border-blue-200">
              <p className="text-xs font-medium text-blue-700 mb-2">
                输入企业名称或统一社会信用代码，一键获取工商信息并自动填写
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAutoFill()}
                  className="input-field text-sm flex-1"
                  placeholder="输入企业全称或统一社会信用代码..."
                  disabled={fetching}
                />
                <button
                  onClick={handleAutoFill}
                  disabled={fetching || !searchKeyword.trim()}
                  className="btn-primary text-sm gap-1.5 whitespace-nowrap"
                >
                  {fetching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  {fetching ? '查询中...' : '查询填写'}
                </button>
                <button
                  onClick={() => { setShowAutoFill(false); setSearchKeyword('') }}
                  className="p-2 rounded-lg hover:bg-blue-100 text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">企业全称</label>
              <input type="text" value={editForm.name || ''} onChange={setFormField(setEditForm, 'name')} className="input-field text-sm" placeholder="请输入企业全称" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">统一社会信用代码</label>
              <input type="text" value={editForm.unifiedSocialCreditCode || ''} onChange={setFormField(setEditForm, 'unifiedSocialCreditCode')} className="input-field text-sm" placeholder="18位统一信用代码" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">法人代表</label>
              <input type="text" value={editForm.legalRepresentative || ''} onChange={setFormField(setEditForm, 'legalRepresentative')} className="input-field text-sm" placeholder="法定代表人姓名" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">企业类型</label>
              <select value={editForm.companyType || ''} onChange={setFormField(setEditForm, 'companyType')} className="input-field text-sm">
                {companyTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">注册资本</label>
              <input type="text" value={editForm.registeredCapital || ''} onChange={setFormField(setEditForm, 'registeredCapital')} className="input-field text-sm" placeholder="如：500万元" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">成立日期</label>
              <input type="date" value={editForm.establishedDate || ''} onChange={setFormField(setEditForm, 'establishedDate')} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">所属行业</label>
              <select value={editForm.industry || ''} onChange={setFormField(setEditForm, 'industry')} className="input-field text-sm">
                {industryOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">所属区域</label>
              <select value={editForm.region || ''} onChange={setFormField(setEditForm, 'region')} className="input-field text-sm">
                {regionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">员工总数</label>
              <input type="number" value={editForm.employeeCount || ''} onChange={setFormField(setEditForm, 'employeeCount')} className="input-field text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">社保缴纳人数</label>
              <input type="number" value={editForm.socialInsuranceCount || ''} onChange={setFormField(setEditForm, 'socialInsuranceCount')} className="input-field text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">营业收入（万元/年）</label>
              <input type="text" value={editForm.revenue || ''} onChange={setFormField(setEditForm, 'revenue')} className="input-field text-sm" placeholder="如：500" />
            </div>
          </div>
          <div className="mt-5">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">经营范围</label>
            <textarea value={editForm.businessScope || ''} onChange={setFormField(setEditForm, 'businessScope')} className="input-field text-sm min-h-[60px]" placeholder="企业经营范围" />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">企业简介</label>
            <textarea value={editForm.description || ''} onChange={setFormField(setEditForm, 'description')} className="input-field text-sm min-h-[80px]" placeholder="简要描述企业主营业务、核心优势等" />
          </div>
        </div>
      )}

      {/* Certificates / Financial / Contracts Tab */}
      {isDocTab && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-800">
              {activeTab === 'certificates' && '资质证照'}
              {activeTab === 'financial' && '财务资料'}
              {activeTab === 'contracts' && '合同协议'}
            </h3>
            <button onClick={() => { setDocForm({}); setShowDocModal(true) }} className="btn-primary text-sm gap-1.5">
              <Plus size={16} />
              添加
            </button>
          </div>

          {docLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                {activeTab === 'certificates' ? <FileCheck size={28} className="text-slate-300" /> :
                 activeTab === 'financial' ? <FileText size={28} className="text-slate-300" /> :
                 <FileSignature size={28} className="text-slate-300" />}
              </div>
              <p className="text-sm text-slate-400">暂无记录</p>
              <p className="text-xs text-slate-300 mt-1 mb-4">
                {activeTab === 'certificates' && '添加营业执照、知识产权证书、资质认证等'}
                {activeTab === 'financial' && '添加审计报告、纳税证明、财务报表等'}
                {activeTab === 'contracts' && '添加销售合同、产学研协议等'}
              </p>
              <button onClick={() => { setDocForm({}); setShowDocModal(true) }} className="btn-ghost text-xs gap-1">
                <Plus size={14} />
                立即添加
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
                return (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-800">{doc.name}</span>
                        {isExpired && <span className="badge-red text-[10px]">已过期</span>}
                        {doc.grantDate && !isExpired && <span className="badge-green text-[10px]">有效</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        {doc.docNumber && <span>编号：{doc.docNumber}</span>}
                        {doc.issuingAuthority && <span>发证机关：{doc.issuingAuthority}</span>}
                        {doc.grantDate && <span>颁发日期：{doc.grantDate}</span>}
                        {doc.expiryDate && <span>有效期至：{doc.expiryDate}</span>}
                        {doc.amount && <span>金额：{doc.amount}</span>}
                        {doc.counterparty && <span>对方：{doc.counterparty}</span>}
                      </div>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <Paperclip size={13} />
                          <span className="truncate max-w-[200px]">{doc.fileOriginalName || '附件'}</span>
                          <Download size={12} />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-3"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-800">团队成员</h3>
            <button onClick={() => { setTeamForm({}); setShowTeamModal(true) }} className="btn-primary text-sm gap-1.5">
              <Plus size={16} />
              添加成员
            </button>
          </div>

          {teamLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <Users size={28} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 mb-4">暂无团队成员</p>
              <button onClick={() => { setTeamForm({}); setShowTeamModal(true) }} className="btn-ghost text-xs gap-1">
                <Plus size={14} />
                添加核心成员
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-600">{member.name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">{member.name}</span>
                      {member.position && <span className="text-xs text-slate-400">| {member.position}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                      {member.education && <span>学历：{member.education}</span>}
                      {member.title && <span>职称：{member.title}</span>}
                      {member.major && <span>专业：{member.major}</span>}
                      {member.socialSecurityStatus === 'active' && <span className="badge-green text-[10px]">社保在缴</span>}
                      {member.joinDate && <span>入职：{member.joinDate}</span>}
                    </div>
                    {(member.phone || member.email) && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-300">
                        {member.phone && <span>{member.phone}</span>}
                        {member.email && <span>{member.email}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(member.id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Document Modal */}
      {showDocModal && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowDocModal(false)}>
          <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">
                添加{activeTab === 'certificates' ? '资质证照' : activeTab === 'financial' ? '财务资料' : '合同'}
              </h3>
              <button onClick={() => setShowDocModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="关闭"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">名称 *</label>
                <input type="text" value={docForm.name || ''} onChange={setFormField(setDocForm, 'name')} placeholder={
                  activeTab === 'certificates' ? '如：营业执照、发明专利证书' :
                  activeTab === 'financial' ? '如：2025年度审计报告' :
                  '如：XX项目技术开发合同'
                } className="input-field text-sm" />
              </div>
              {activeTab === 'certificates' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">证书/编号</label>
                    <input type="text" value={docForm.docNumber || ''} onChange={setFormField(setDocForm, 'docNumber')} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">发证机关</label>
                    <input type="text" value={docForm.issuingAuthority || ''} onChange={setFormField(setDocForm, 'issuingAuthority')} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">颁发日期</label>
                    <input type="date" value={docForm.grantDate || ''} onChange={setFormField(setDocForm, 'grantDate')} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">有效期至</label>
                    <input type="date" value={docForm.expiryDate || ''} onChange={setFormField(setDocForm, 'expiryDate')} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">类型</label>
                    <input type="text" value={docForm.docType || ''} onChange={setFormField(setDocForm, 'docType')} placeholder="如：发明专利/实用新型" className="input-field text-sm" />
                  </div>
                </div>
              )}
              {activeTab === 'financial' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">年份/期间</label>
                    <input type="text" value={docForm.docType || ''} onChange={setFormField(setDocForm, 'docType')} placeholder="如：2025年度" className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">出具单位</label>
                    <input type="text" value={docForm.issuingAuthority || ''} onChange={setFormField(setDocForm, 'issuingAuthority')} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">出具日期</label>
                    <input type="date" value={docForm.grantDate || ''} onChange={setFormField(setDocForm, 'grantDate')} className="input-field text-sm" />
                  </div>
                </div>
              )}
              {activeTab === 'contracts' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">合同金额</label>
                    <input type="text" value={docForm.amount || ''} onChange={setFormField(setDocForm, 'amount')} placeholder="如：50万元" className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">合作方</label>
                    <input type="text" value={docForm.counterparty || ''} onChange={setFormField(setDocForm, 'counterparty')} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">签订日期</label>
                    <input type="date" value={docForm.grantDate || ''} onChange={setFormField(setDocForm, 'grantDate')} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">合同类型</label>
                    <input type="text" value={docForm.docType || ''} onChange={setFormField(setDocForm, 'docType')} placeholder="如：销售/技术开发/产学研" className="input-field text-sm" />
                  </div>
                </div>
              )}

              {/* File upload */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">附件（PDF/Word/Excel/图片，最多20MB）</label>
                {uploadedFile ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Paperclip size={14} className="text-emerald-500" />
                      <span className="truncate max-w-[250px]">{uploadedFile.name}</span>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-xs text-red-400 hover:text-red-500 transition-colors"
                    >
                      移除
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar" onChange={handleFileUpload} disabled={uploading} />
                    {uploading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                        上传中...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Upload size={18} className="text-slate-300" />
                        <span>点击上传附件</span>
                      </div>
                    )}
                  </label>
                )}
              </div>

              <button onClick={handleAddDoc} disabled={!docForm.name?.trim()} className="w-full btn-primary py-2.5 text-sm mt-2">
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showTeamModal && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setShowTeamModal(false)}>
          <div className="modal-content bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800">添加团队成员</h3>
              <button onClick={() => setShowTeamModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="关闭"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">姓名 *</label>
                  <input type="text" value={teamForm.name || ''} onChange={setFormField(setTeamForm, 'name')} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">职位</label>
                  <input type="text" value={teamForm.position || ''} onChange={setFormField(setTeamForm, 'position')} placeholder="如：技术总监" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">学历</label>
                  <select value={teamForm.education || ''} onChange={setFormField(setTeamForm, 'education')} className="input-field text-sm">
                    {educationOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">职称</label>
                  <input type="text" value={teamForm.title || ''} onChange={setFormField(setTeamForm, 'title')} placeholder="如：高级工程师" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">专业背景</label>
                  <input type="text" value={teamForm.major || ''} onChange={setFormField(setTeamForm, 'major')} placeholder="如：计算机科学" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">入职日期</label>
                  <input type="date" value={teamForm.joinDate || ''} onChange={setFormField(setTeamForm, 'joinDate')} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">手机号</label>
                  <input type="text" value={teamForm.phone || ''} onChange={setFormField(setTeamForm, 'phone')} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">邮箱</label>
                  <input type="email" value={teamForm.email || ''} onChange={setFormField(setTeamForm, 'email')} className="input-field text-sm" />
                </div>
              </div>
              <button onClick={handleAddTeam} disabled={!teamForm.name?.trim()} className="w-full btn-primary py-2.5 text-sm mt-2">
                添加成员
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
