import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Plus,
  X,
  GraduationCap,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { useCompanyStore } from '@/lib/store'

export default function CompanyTeam() {
  const { teamMembers, fetchTeamMembers, addTeamMember } = useCompanyStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    education: '',
    socialSecurityStatus: 'active',
  })

  useEffect(() => {
    fetchTeamMembers()
  }, [fetchTeamMembers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addTeamMember(form)
    setShowModal(false)
    setForm({ name: '', education: '', socialSecurityStatus: 'active' })
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <Link to="/company/profile" className="text-primary">企业档案</Link>
        <ChevronRight size={14} />
        <span>团队管理</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h2 className="text-base font-semibold text-gray-800">团队成员 ({teamMembers.length})</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center gap-1.5"
        >
          <Plus size={16} />
          添加成员
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Users size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">暂无团队成员记录</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-accent text-sm hover:underline"
          >
            添加第一个成员
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">姓名</th>
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">学历</th>
                  <th className="text-left px-5 py-3.5 text-gray-500 font-medium">社保状态</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-800">{member.name}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-gray-400" />
                        {member.education || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5">
                        <Shield size={14} className="text-gray-400" />
                        <span className={member.socialSecurityStatus === 'active' ? 'text-green-600' : 'text-gray-400'}>
                          {member.socialSecurityStatus === 'active' ? '正常' : '其他'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">添加团队成员</h3>
              <button onClick={() => { setShowModal(false); setForm({ name: '', education: '', socialSecurityStatus: 'active' }) }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">学历</label>
                <select
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">请选择</option>
                  <option value="博士">博士</option>
                  <option value="硕士">硕士</option>
                  <option value="本科">本科</option>
                  <option value="大专">大专</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">社保状态</label>
                <select
                  value={form.socialSecurityStatus}
                  onChange={(e) => setForm({ ...form, socialSecurityStatus: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="active">正常缴纳</option>
                  <option value="inactive">未缴纳</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm({ name: '', education: '', socialSecurityStatus: 'active' }) }}
                  className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}