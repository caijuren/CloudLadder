import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check, X, Shield } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function getPasswordStrength(pw: string): { score: number; label: string; color: string; barColor: string } {
  let score = 0
  if (pw.length >= 8) score += 25
  if (pw.length >= 12) score += 10
  if (/[a-z]/.test(pw)) score += 15
  if (/[A-Z]/.test(pw)) score += 15
  if (/[0-9]/.test(pw)) score += 15
  if (/[^A-Za-z0-9]/.test(pw)) score += 20

  if (score < 30) return { score, label: '弱', color: 'text-red-500', barColor: 'bg-red-500' }
  if (score < 60) return { score, label: '中等', color: 'text-yellow-500', barColor: 'bg-yellow-500' }
  if (score < 80) return { score, label: '强', color: 'text-accent', barColor: 'bg-accent' }
  return { score: 100, label: '非常强', color: 'text-accent', barColor: 'bg-accent' }
}

const requirements = [
  { label: '至少8位字符', test: (pw: string) => pw.length >= 8 },
  { label: '包含字母', test: (pw: string) => /[A-Za-z]/.test(pw) },
  { label: '包含数字', test: (pw: string) => /[0-9]/.test(pw) },
  { label: '包含大写字母', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: '包含特殊字符', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMatch = password === confirmPassword
  const allRequirementsMet = requirements.every((r) => r.test(password))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有必填字段')
      return
    }

    if (!agreed) {
      setError('请阅读并同意用户协议和隐私政策')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (!allRequirementsMet) {
      setError('密码强度不符合要求')
      return
    }

    try {
      await register(email, password, name)
      setStep('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注册失败'
      setError(msg)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 opacity-[0.08]">
            <div className="absolute top-20 left-20 w-72 h-72 border border-white rounded-full" />
            <div className="absolute bottom-20 right-20 w-96 h-96 border border-white rounded-full" />
          </div>
          <div className="relative text-center px-12">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <span className="text-3xl font-bold text-white">政</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">开启智能申报之旅</h2>
            <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
              完善企业档案后，系统将自动为您匹配最优政策
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full max-w-md text-center animate-scale-in">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">注册成功!</h2>
            <p className="text-gray-400 mb-8">欢迎加入项目申报平台，您的账号已创建完成</p>
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">下一步建议</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <User size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">完善企业档案</p>
                    <p className="text-xs text-gray-400">填写基本信息，提升匹配精准度</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Shield size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">查看智能匹配</p>
                    <p className="text-xs text-gray-400">系统自动推荐最适合的政策项目</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/company/profile')}
                className="flex-1 btn-primary py-3"
              >
                完善企业档案
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 btn-outline py-3"
              >
                进入首页
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white rounded-full" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 border border-white rounded-full" />
        </div>
        <div className="relative text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <span className="text-3xl font-bold text-white">政</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">开始您的科创申报之旅</h2>
          <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
            免费注册，即刻体验智能政策匹配、AI解析、全流程申报管理
          </p>
          <div className="mt-10 space-y-4 max-w-sm mx-auto">
            {['30秒快速注册', '智能匹配政策', '全流程申报管理'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white/70">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-accent-light" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                项
              </div>
              <span className="text-xl font-bold text-primary">项目申报平台</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">创建账号</h2>
              <p className="text-sm text-gray-400 mt-1">填写以下信息完成注册</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">企业名称</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="请输入企业全称"
                    required
                    className={`input-field pl-11 ${focusedField === 'name' ? 'border-primary ring-2 ring-primary/10' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="请输入企业邮箱"
                    required
                    autoComplete="email"
                    className={`input-field pl-11 ${focusedField === 'email' ? 'border-primary ring-2 ring-primary/10' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="至少8位，包含字母和数字"
                    required
                    autoComplete="new-password"
                    className={`input-field pl-11 pr-11 ${focusedField === 'password' ? 'border-primary ring-2 ring-primary/10' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password strength bar */}
                {password && (
                  <div className="mt-2 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.barColor}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {requirements.map((req) => {
                        const met = req.test(password)
                        return (
                          <div key={req.label} className="flex items-center gap-1.5 text-xs">
                            {met ? (
                              <Check size={12} className="text-accent shrink-0" />
                            ) : (
                              <X size={12} className="text-gray-300 shrink-0" />
                            )}
                            <span className={met ? 'text-gray-600' : 'text-gray-400'}>{req.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="再次输入密码"
                    required
                    autoComplete="new-password"
                    className={`input-field pl-11 ${focusedField === 'confirmPassword' ? 'border-primary ring-2 ring-primary/10' : ''} ${
                      confirmPassword && !passwordsMatch ? 'border-red-300 ring-red-100' : ''
                    }`}
                  />
                  {confirmPassword && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {passwordsMatch ? (
                        <Check size={18} className="text-accent" />
                      ) : (
                        <X size={18} className="text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 mt-1 animate-fade-in">两次输入的密码不一致</p>
                )}
              </div>

              {/* Agreement */}
              <div className="flex items-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    agreed
                      ? 'bg-accent border-accent text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                >
                  {agreed && <Check size={14} strokeWidth={3} />}
                </button>
                <p className="text-xs text-gray-400 leading-relaxed">
                  我已阅读并同意{' '}
                  <span className="text-accent cursor-pointer hover:underline">《用户服务协议》</span>
                  {' '}和{' '}
                  <span className="text-accent cursor-pointer hover:underline">《隐私政策》</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-base gap-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    注册中...
                  </div>
                ) : (
                  <>
                    创建账号
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500">
                已有账号？{' '}
                <Link to="/login" className="text-accent hover:text-accent-dark font-medium transition-colors">
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}