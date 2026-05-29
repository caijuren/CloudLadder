import { Link, useNavigate } from 'react-router-dom'
import {
  Radar,
  BrainCircuit,
  GitCompareArrows,
  Briefcase,
  Building2,
  Shield,
  TrendingUp,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useEffect, useState } from 'react'

const features = [
  {
    icon: Radar,
    title: '政策雷达',
    desc: '覆盖国家级、省市级全量科创政策，智能分类聚合，重要政策不错过',
    color: 'from-blue-500 to-blue-600',
    gradient: 'from-blue-50 to-blue-100',
  },
  {
    icon: BrainCircuit,
    title: 'AI 政策解析',
    desc: 'NLP 智能解析政策文本，自动提取申报条件、补贴金额、材料清单',
    color: 'from-purple-500 to-purple-600',
    gradient: 'from-purple-50 to-purple-100',
  },
  {
    icon: GitCompareArrows,
    title: '智能匹配',
    desc: '基于企业档案的自动化对，精准推荐匹配度最高的扶持项目',
    color: 'from-emerald-500 to-emerald-600',
    gradient: 'from-emerald-50 to-emerald-100',
  },
  {
    icon: Briefcase,
    title: '申报工作台',
    desc: '任务管理+进度追踪+材料清单，一条龙管理申报全流程',
    color: 'from-orange-500 to-orange-600',
    gradient: 'from-orange-50 to-orange-100',
  },
  {
    icon: Building2,
    title: '企业档案',
    desc: '结构化存储企业资质、知识产权、团队信息，一次录入永久复用',
    color: 'from-cyan-500 to-cyan-600',
    gradient: 'from-cyan-50 to-cyan-100',
  },
  {
    icon: Shield,
    title: '数据安全',
    desc: '企业数据加密存储，完善的权限管理体系，信息安全有保障',
    color: 'from-rose-500 to-rose-600',
    gradient: 'from-rose-50 to-rose-100',
  },
]

const stats = [
  { value: '10000+', label: '汇聚政策' },
  { value: '95%', label: '匹配准确率' },
  { value: '3min', label: '智能解析速度' },
  { value: '100%', label: '数据安全保障' },
]

const steps = [
  {
    step: '01',
    title: '注册账号',
    desc: '30秒完成注册，立即开启智能申报之旅',
  },
  {
    step: '02',
    title: '完善档案',
    desc: '录入企业基本信息、资质、团队等核心数据',
  },
  {
    step: '03',
    title: '智能匹配',
    desc: '系统自动匹配推荐最适合的扶持政策',
  },
  {
    step: '04',
    title: '申报管理',
    desc: '工作台跟进申报进度，材料清单一目了然',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold">
              项
            </div>
            <span className="text-lg font-bold text-primary">项目申报平台</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 hover:text-primary transition-colors">产品功能</a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-primary transition-colors">使用流程</a>
            <a href="#about" className="text-sm text-gray-600 hover:text-primary transition-colors">关于我们</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">
              登录
            </Link>
            <Link to="/register" className="btn-primary text-sm">
              免费注册
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-accent/5" />
        <div className="absolute top-40 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6 animate-fade-in">
              <TrendingUp size={16} />
              科创项目申报智能助手
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6 animate-fade-in-up">
              让政策匹配
              <br />
              <span className="gradient-text">变得简单高效</span>
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-2xl animate-fade-in-up">
              项目申报平台是一个专为中小科技企业打造的科创项目申报服务平台。
              <br className="hidden sm:block" />
              智能聚合政策、精准匹配推荐、全流程申报管理，帮助企业不错过每一个扶持机会。
            </p>
            <div className="flex items-center gap-4 animate-fade-in-up">
              <Link
                to="/register"
                className="btn-primary text-base px-8 py-3 gap-2"
              >
                免费开始使用
                <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="btn-outline text-base px-8 py-3"
              >
                了解更多
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in-up">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">核心功能</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              六大核心模块，覆盖科创项目申报全流程
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <Icon size={24} className={`text-${feature.color.split(' ')[0].replace('from-', '')}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">四步上手</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              简单四步，开始您的智能申报之旅
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 stagger-children">
            {steps.map((item, idx) => (
              <div key={item.step} className="text-center relative">
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px border-t-2 border-dashed border-gray-200" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold gradient-text">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            准备好提升您的申报效率了吗？
          </h2>
          <p className="text-primary/70 text-lg mb-8 max-w-2xl mx-auto">
            免费注册，即刻体验智能政策匹配服务
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-base"
          >
            立即免费注册
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-sm font-bold">
                  项
                </div>
                <span className="text-lg font-bold text-white">项目申报平台</span>
              </div>
              <p className="text-sm leading-relaxed">
                科创项目申报智能助手，助力中小科技企业高效申报、快速发展。
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">产品功能</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-pointer">政策雷达</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">AI政策解析</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">智能匹配</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">申报工作台</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">法律声明</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-pointer">用户服务协议</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">隐私政策</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">数据安全承诺</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 政企通. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}