import { create } from 'zustand'

export interface User {
  id: number
  email: string
  companyName: string
  role: string
  companyId?: number
  avatar?: string
}

let navigateToLogin: (() => void) | null = null

export function setNavigateToLogin(fn: () => void) {
  navigateToLogin = fn
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch(url: string, options?: RequestInit): Promise<any> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }
  if (token && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    if (navigateToLogin) navigateToLogin()
    throw new Error('登录已过期，请重新登录')
  }

  return res.json()
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
  fetchUser: () => Promise<void>
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>
}

interface Policy {
  id: number
  title: string
  department: string
  region: string
  deadline: string
  subsidy: string
  tags: string[]
  description?: string
  requirements?: Record<string, string>
  process?: string[]
  materials?: string[]
  status?: string
}

interface PolicyFilters {
  department: string
  region: string
  supportType: string
  search: string
}

interface PoliciesState {
  list: Policy[]
  filters: PolicyFilters
  loading: boolean
  total: number
  page: number
  totalPages: number
  fetchPolicies: (params?: Partial<PolicyFilters & { page: number; limit: number }>) => Promise<void>
  setFilters: (filters: Partial<PolicyFilters>) => void
}

export interface Asset {
  id: number
  name: string
  type: string
  certNumber?: string
  grantDate?: string
}

interface TeamMember {
  id: number
  name: string
  education: string
  socialSecurityStatus: string
}

interface CompanyProfile {
  id?: number
  name: string
  establishedDate: string
  revenue: string
  socialInsuranceCount: number
  industry: string
  region: string
  employeeCount: number
  unifiedSocialCreditCode?: string
  companyType?: string
  registeredCapital?: string
  legalRepresentative?: string
  businessScope?: string
  description?: string
}

interface CompanyState {
  profile: CompanyProfile | null
  assets: Asset[]
  teamMembers: TeamMember[]
  loading: boolean
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<CompanyProfile>) => Promise<void>
  fetchAssets: () => Promise<void>
  addAsset: (asset: Omit<Asset, 'id'>) => Promise<void>
  fetchTeamMembers: () => Promise<void>
  addTeamMember: (member: Omit<TeamMember, 'id'>) => Promise<void>
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: getStoredUser(),
  loading: false,
  login: async (email, password) => {
    set({ loading: true })
    try {
      const json = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!json.success) throw new Error(json.message || '登录失败')
      localStorage.setItem('token', json.data.token)
      localStorage.setItem('user', JSON.stringify(json.data.user))
      set({ token: json.data.token, user: json.data.user, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },
  register: async (email, password, companyName) => {
    set({ loading: true })
    try {
      const json = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, companyName }),
      })
      if (!json.success) throw new Error(json.message || '注册失败')
      localStorage.setItem('token', json.data.token)
      localStorage.setItem('user', JSON.stringify(json.data.user))
      set({ token: json.data.token, user: json.data.user, loading: false })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },
  checkAuth: () => {
    const token = localStorage.getItem('token')
    if (token) {
      set({ token, user: getStoredUser() })
    }
  },
  fetchUser: async () => {
    try {
      const json = await apiFetch('/api/auth/me')
      if (json.success) {
        localStorage.setItem('user', JSON.stringify(json.data))
        set({ user: json.data })
      }
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
  },
  updatePassword: async (oldPassword, newPassword) => {
    const json = await apiFetch('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    if (!json.success) {
      throw new Error(json.message || '修改密码失败')
    }
  },
}))

export const usePoliciesStore = create<PoliciesState>((set, get) => ({
  list: [],
  filters: {
    department: '',
    region: '',
    supportType: '',
    search: '',
  },
  loading: false,
  total: 0,
  page: 1,
  totalPages: 1,
  fetchPolicies: async (params) => {
    set({ loading: true })
    const currentFilters = get().filters
    const merged = { ...currentFilters, ...params }
    try {
      const query = new URLSearchParams()
      if (merged.department) query.set('department', merged.department)
      if (merged.region) query.set('region', merged.region)
      if (merged.supportType) query.set('supportType', merged.supportType)
      if (merged.search) query.set('search', merged.search)
      if (merged.page) query.set('page', String(merged.page))
      if (merged.limit) query.set('limit', String(merged.limit))
      const json = await apiFetch(`/api/policies?${query.toString()}`)
      if (json.success) {
        set({
          list: json.data.list || [],
          total: json.data.total || 0,
          page: json.data.page || 1,
          totalPages: json.data.totalPages || 1,
          loading: false,
          filters: merged as PolicyFilters,
        })
      } else {
        set({ loading: false })
      }
    } catch (e) {
      console.error('获取政策列表失败', e)
      set({ loading: false })
    }
  },
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }))
  },
}))

export const useCompanyStore = create<CompanyState>((set) => ({
  profile: null,
  assets: [],
  teamMembers: [],
  loading: false,
  fetchProfile: async () => {
    set({ loading: true })
    try {
      const json = await apiFetch('/api/company/profile')
      if (json.success) set({ profile: json.data, loading: false })
      else set({ loading: false })
    } catch (e) {
      console.error('获取企业信息失败', e)
      set({ loading: false })
    }
  },
  updateProfile: async (data) => {
    const json = await apiFetch('/api/company/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (json.success) {
      set({ profile: json.data })
    }
  },
  fetchAssets: async () => {
    try {
      const json = await apiFetch('/api/company/assets')
      if (json.success) set({ assets: json.data.list || json.data || [] })
    } catch (e) {
      console.error('获取企业资产失败', e)
    }
  },
  addAsset: async (asset) => {
    const json = await apiFetch('/api/company/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    })
    if (json.success) {
      set((state) => ({ assets: [...state.assets, json.data] }))
    }
  },
  fetchTeamMembers: async () => {
    try {
      const json = await apiFetch('/api/company/team')
      if (json.success) set({ teamMembers: json.data.list || json.data || [] })
    } catch (e) {
      console.error('获取团队成员失败', e)
    }
  },
  addTeamMember: async (member) => {
    const json = await apiFetch('/api/company/team', {
      method: 'POST',
      body: JSON.stringify(member),
    })
    if (json.success) {
      set((state) => ({ teamMembers: [...state.teamMembers, json.data] }))
    }
  },
}))

export interface Subscription {
  id: number
  name: string
  region: string
  department: string
  supportType: string
  keywords: string
  createdAt: string
}

interface SubscriptionState {
  list: Subscription[]
  loading: boolean
  newPolicyCount: number
  fetchSubscriptions: () => Promise<void>
  addSubscription: (data: { name: string; region?: string; department?: string; supportType?: string; keywords?: string }) => Promise<void>
  deleteSubscription: (id: number) => Promise<void>
  fetchNewPolicyCount: () => Promise<void>
  markPoliciesAsRead: () => Promise<void>
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  list: [],
  loading: false,
  newPolicyCount: 0,
  fetchSubscriptions: async () => {
    set({ loading: true })
    try {
      const json = await apiFetch('/api/subscriptions')
      if (json.success) set({ list: json.data || [], loading: false })
      else set({ loading: false })
    } catch (e) {
      console.error('获取订阅列表失败', e)
      set({ loading: false })
    }
  },
  addSubscription: async (data) => {
    const json = await apiFetch('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (json.success) {
      set((state) => ({ list: [...state.list, json.data] }))
    }
  },
  deleteSubscription: async (id) => {
    const json = await apiFetch(`/api/subscriptions/${id}`, {
      method: 'DELETE',
    })
    if (json.success) {
      set((state) => ({ list: state.list.filter((s) => s.id !== id) }))
    }
  },
  fetchNewPolicyCount: async () => {
    try {
      const json = await apiFetch('/api/subscriptions/new-count')
      if (json.success) set({ newPolicyCount: json.data.count || 0 })
    } catch (e) {
      console.error('获取新政策数量失败', e)
    }
  },
  markPoliciesAsRead: async () => {
    try {
      await apiFetch('/api/subscriptions/mark-read', { method: 'POST' })
      set({ newPolicyCount: 0 })
    } catch (e) {
      console.error('标记已读失败', e)
    }
  },
}))

export interface CompanyDocument {
  id: number
  category: string
  name: string
  docType: string
  docNumber: string
  issuingAuthority: string
  grantDate: string
  expiryDate: string
  amount: string
  counterparty: string
  status: string
  notes: string
  createdAt: string
  fileUrl?: string
  fileOriginalName?: string
  fileSize?: number
}

interface DocumentState {
  list: CompanyDocument[]
  loading: boolean
  fetchDocuments: (category?: string) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addDocument: (data: any) => Promise<void>
  deleteDocument: (id: number) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateDocument: (id: number, data: any) => Promise<void>
}

export const useDocumentStore = create<DocumentState>((set) => ({
  list: [],
  loading: false,
  fetchDocuments: async (category?: string) => {
    set({ loading: true })
    try {
      const url = category ? `/api/company/documents?category=${category}` : '/api/company/documents'
      const json = await apiFetch(url)
      if (json.success) set({ list: json.data || [], loading: false })
      else set({ loading: false })
    } catch (e) { console.error('获取文档列表失败', e); set({ loading: false }) }
  },
  addDocument: async (data) => {
    const json = await apiFetch('/api/company/documents', { method: 'POST', body: JSON.stringify(data) })
    if (json.success) {
      set((state) => ({ list: [{ ...data, id: json.data.id, createdAt: new Date().toISOString() }, ...state.list] }))
    }
  },
  deleteDocument: async (id) => {
    const json = await apiFetch(`/api/company/documents/${id}`, { method: 'DELETE' })
    if (json.success) set((state) => ({ list: state.list.filter((d) => d.id !== id) }))
  },
  updateDocument: async (id, data) => {
    const json = await apiFetch(`/api/company/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    if (json.success) {
      set((state) => ({ list: state.list.map((d) => d.id === id ? { ...d, ...data } : d) }))
    }
  },
}))

export interface ResourceLink {
  id: number
  title: string
  url: string
  department: string
  region: string
  category: string
  description: string
  createdAt: string
}

interface LinksState {
  list: ResourceLink[]
  loading: boolean
  fetchLinks: (params?: { search?: string; department?: string; region?: string; category?: string }) => Promise<void>
  addLink: (data: { title: string; url: string; department?: string; region?: string; category?: string; description?: string }) => Promise<void>
  updateLink: (id: number, data: Partial<ResourceLink>) => Promise<void>
  deleteLink: (id: number) => Promise<void>
}

export const useLinksStore = create<LinksState>((set) => ({
  list: [],
  loading: false,
  fetchLinks: async (params?) => {
    set({ loading: true })
    try {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.department) query.set('department', params.department)
      if (params?.region) query.set('region', params.region)
      if (params?.category) query.set('category', params.category)
      const qs = query.toString()
      const json = await apiFetch(`/api/links${qs ? `?${qs}` : ''}`)
      if (json.success) set({ list: json.data || [], loading: false })
      else set({ loading: false })
    } catch (e) { console.error('获取资源链接失败', e); set({ loading: false }) }
  },
  addLink: async (data) => {
    const json = await apiFetch('/api/links', { method: 'POST', body: JSON.stringify(data) })
    if (json.success) {
      set((state) => ({ list: [json.data, ...state.list] }))
    }
  },
  updateLink: async (id, data) => {
    const json = await apiFetch(`/api/links/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    if (json.success) {
      set((state) => ({ list: state.list.map((l) => l.id === id ? { ...l, ...json.data } : l) }))
    }
  },
  deleteLink: async (id) => {
    const json = await apiFetch(`/api/links/${id}`, { method: 'DELETE' })
    if (json.success) {
      set((state) => ({ list: state.list.filter((l) => l.id !== id) }))
    }
  },
}))