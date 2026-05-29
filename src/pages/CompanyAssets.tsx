import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Plus,
  X,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { useCompanyStore } from '@/lib/store'

const emptyAsset = {
  name: '',
  type: '',
  certNumber: '',
  grantDate: '',
}

const typeLabels: Record<string, string> = {
  SOFTWARE_COPYRIGHT: '软件著作权',
  PATENT: '专利',
  HIGH_TECH_CERT: '高企证书',
  ISO: '体系认证',
  CMMI: 'CMMI认证',
}

export default function CompanyAssets() {
  const { assets, fetchAssets, addAsset } = useCompanyStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyAsset)

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addAsset(form)
    setShowModal(false)
    setForm(emptyAsset)
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <Link to="/company/profile" className="text-primary">企业档案</Link>
        <ChevronRight size={14} />
        <span>资质资产</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-primary" />
          <h2 className="text-base font-semibold text-gray-800">资质资产 ({assets.length})</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center gap-1.5"
        >
          <Plus size={16} />
          添加证书
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <Award size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">暂无资质资产记录</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-accent text-sm hover:underline"
          >
            添加第一个证书
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award size={20} className="text-primary" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {typeLabels[asset.type] || asset.type}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{asset.name}</h3>
              {asset.certNumber && (
                <p className="text-xs text-gray-400 mb-2">编号：{asset.certNumber}</p>
              )}
              {asset.grantDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={13} />
                  颁发日期 {asset.grantDate}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">添加证书</h3>
              <button onClick={() => { setShowModal(false); setForm(emptyAsset) }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">证书名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="请输入证书名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">证书类型</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">请选择类型</option>
                  <option value="SOFTWARE_COPYRIGHT">软件著作权</option>
                  <option value="PATENT">专利</option>
                  <option value="HIGH_TECH_CERT">高企证书</option>
                  <option value="ISO">体系认证</option>
                  <option value="CMMI">CMMI认证</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">证书编号</label>
                <input
                  type="text"
                  value={form.certNumber}
                  onChange={(e) => setForm({ ...form, certNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="请输入证书编号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">颁发日期</label>
                <input
                  type="date"
                  value={form.grantDate}
                  onChange={(e) => setForm({ ...form, grantDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setForm(emptyAsset) }}
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