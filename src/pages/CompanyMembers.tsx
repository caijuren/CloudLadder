import { useEffect, useState } from 'react'
import {
  Users,
  UserPlus,
  Mail,
  X,
  Check,
  Clock,
  Shield,
  UserCog,
  Trash2,
  Copy,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStore, apiFetch } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/Toast'

interface Member {
  id: number
  userId: number
  email: string
  name: string
  role: string
  joinedAt: string
}

interface Invitation {
  id: number
  email: string
  inviteCode: string
  status: string
  invitedBy: string
  createdAt: string
}

export default function CompanyMembers() {
  const { user, fetchUser } = useAuthStore()
  const { showToast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'members' | 'invitations'>('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [lastInviteResult, setLastInviteResult] = useState<{ inviteCode: string; email: string; companyName: string } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [acceptCode, setAcceptCode] = useState('')
  const [accepting, setAccepting] = useState(false)

  const isAdmin = user?.role === 'admin'

  const fetchMembers = async () => {
    try {
      const json = await apiFetch('/api/company/members')
      if (json.success) setMembers(json.data || [])
    } catch { /* ignore */ }
  }

  const fetchInvitations = async () => {
    try {
      const json = await apiFetch('/api/company/invitations')
      if (json.success) setInvitations(json.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchMembers(), fetchInvitations()])
      setLoading(false)
    }
    load()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    try {
      const json = await apiFetch('/api/company/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (json.success) {
        setLastInviteResult(json.data)
        setInviteEmail('')
        fetchInvitations()
        showToast('success', '邀请已发送')
      } else {
        showToast('error', json.message || '邀请失败')
      }
    } catch {
      showToast('error', '邀请失败，请重试')
    }
    setInviting(false)
  }

  const handleCancelInvite = async (id: number) => {
    try {
      const json = await apiFetch(`/api/company/invitations/${id}`, { method: 'DELETE' })
      if (json.success) {
        setInvitations((prev) => prev.filter((i) => i.id !== id))
        showToast('success', '邀请已取消')
      }
    } catch { /* ignore */ }
  }

  const handleRemoveMember = async (id: number) => {
    try {
      const json = await apiFetch(`/api/company/members/${id}`, { method: 'DELETE' })
      if (json.success) {
        setMembers((prev) => prev.filter((m) => m.id !== id))
        setConfirmRemove(null)
        showToast('success', '成员已移除')
      } else {
        showToast('error', json.message || '移除失败')
      }
    } catch { /* ignore */ }
  }

  const handleChangeRole = async (id: number, role: string) => {
    try {
      const json = await apiFetch(`/api/company/members/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      })
      if (json.success) {
        setMembers((prev) => prev.map((m) => m.id === id ? { ...m, role } : m))
        showToast('success', role === 'admin' ? '已设为管理员' : '已设为成员')
      } else {
        showToast('error', json.message || '操作失败')
      }
    } catch { /* ignore */ }
  }

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptCode) return
    setAccepting(true)
    try {
      const json = await apiFetch('/api/company/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: acceptCode }),
      })
      if (json.success) {
        showToast('success', `已成功加入企业 ${json.data.companyName}`)
        setShowAcceptModal(false)
        setAcceptCode('')
        await fetchUser()
        await fetchMembers()
      } else {
        showToast('error', json.message || '接受邀请失败')
      }
    } catch {
      showToast('error', '接受邀请失败，请重试')
    }
    setAccepting(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('success', '邀请码已复制')
    })
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return { label: '管理员', color: 'bg-blue-50 text-blue-600' }
    }
    return { label: '成员', color: 'bg-slate-50 text-slate-500' }
  }

  const renderMembers = () => (
    <div className="space-y-3">
      {members.length === 0 ? (
        <div className="text-center py-12">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">暂无团队成员</p>
        </div>
      ) : (
        members.map((member) => {
          const badge = getRoleBadge(member.role)
          const isSelf = member.userId === user?.id
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-blue-600">
                    {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700">{member.name || member.email}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', badge.color)}>
                      {badge.label}
                    </span>
                    {isSelf && <span className="text-xs text-slate-400">（我）</span>}
                  </div>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
              </div>
              {isAdmin && !isSelf && (
                <div className="flex items-center gap-2">
                  {member.role === 'member' ? (
                    <button
                      onClick={() => handleChangeRole(member.id, 'admin')}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="设为管理员"
                    >
                      <UserCog size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChangeRole(member.id, 'member')}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="设为成员"
                    >
                      <Shield size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmRemove(member.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="移除成员"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              {confirmRemove === member.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmRemove(null)} />
                  <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">确认移除</h3>
                        <p className="text-xs text-slate-400">移除后该成员将无法访问企业数据</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="flex-1 btn-ghost text-sm"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        确认移除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )

  const renderInvitations = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-400">
          共 {invitations.length} 条邀请记录
        </p>
      </div>
      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <Mail size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">暂无邀请记录</p>
        </div>
      ) : (
        invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-purple-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-700">{inv.email}</p>
                  {inv.status === 'pending' && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Clock size={12} />
                      等待中
                    </span>
                  )}
                  {inv.status === 'accepted' && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Check size={12} />
                      已接受
                    </span>
                  )}
                  {inv.status === 'expired' && (
                    <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                      已过期
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  邀请码: {inv.inviteCode}
                  <button
                    onClick={() => copyToClipboard(inv.inviteCode)}
                    className="ml-1.5 text-blue-500 hover:text-blue-600 inline-flex items-center"
                  >
                    <Copy size={12} />
                  </button>
                </p>
              </div>
            </div>
            {inv.status === 'pending' && (
              <button
                onClick={() => handleCancelInvite(inv.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="取消邀请"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-5 animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
        <span>企业中心</span>
        <ChevronRight size={14} />
        <span className="text-slate-600">团队管理</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">团队管理</h2>
            <p className="text-sm text-slate-400">管理企业成员和邀请</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && !user.companyId && (
            <button
              onClick={() => setShowAcceptModal(true)}
              className="btn-secondary text-sm gap-1.5"
            >
              <Check size={15} />
              加入企业
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { setShowInviteModal(true); setLastInviteResult(null) }}
              className="btn-primary text-sm gap-1.5"
            >
              <UserPlus size={15} />
              邀请成员
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100">
        <button
          onClick={() => setTab('members')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            tab === 'members'
              ? 'text-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          成员列表 ({members.length})
          {tab === 'members' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab('invitations')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              tab === 'invitations'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            邀请记录
            {tab === 'invitations' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="card p-5">
        {tab === 'members' ? renderMembers() : renderInvitations()}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">邀请成员</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              {lastInviteResult ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                    <Check size={28} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">邀请已创建</p>
                    <p className="text-xs text-slate-400 mt-1">
                      已向 {lastInviteResult.email} 发送邀请
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">邀请码（分享给成员）</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-lg font-mono font-bold text-blue-600 tracking-widest">
                        {lastInviteResult.inviteCode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(lastInviteResult.inviteCode)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      成员登录后，在"团队管理"中输入此邀请码即可加入企业
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowInviteModal(false); setLastInviteResult(null) }}
                    className="btn-primary text-sm"
                  >
                    完成
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">成员邮箱</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="input-field text-sm"
                      placeholder="请输入对方邮箱地址"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                      邀请后系统将生成邀请码，您可分享给成员让其自行加入
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 btn-ghost text-sm"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail}
                      className="flex-1 btn-primary text-sm"
                    >
                      {inviting ? '邀请中...' : '创建邀请'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accept Invite Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAcceptModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">加入企业</h3>
              <button onClick={() => setShowAcceptModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAcceptInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">邀请码</label>
                <input
                  type="text"
                  value={acceptCode}
                  onChange={(e) => setAcceptCode(e.target.value.toUpperCase())}
                  className="input-field text-sm text-center tracking-widest font-mono"
                  placeholder="输入管理员分享的邀请码"
                  required
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  请输入企业管理员分享给您的邀请码加入企业
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 btn-ghost text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={accepting || !acceptCode}
                  className="flex-1 btn-primary text-sm"
                >
                  {accepting ? '加入中...' : '加入企业'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}