import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Policies from '@/pages/Policies'
import PolicyDetail from '@/pages/PolicyDetail'
import PolicyParse from '@/pages/PolicyParse'
import CrawlerManager from '@/pages/CrawlerManager'
import CompanyProfile from '@/pages/CompanyProfile'
import Matching from '@/pages/Matching'
import Workbench from '@/pages/Workbench'
import AdminDashboard from '@/pages/AdminDashboard'
import ResourceLinks from '@/pages/ResourceLinks'
import UserSettings from '@/pages/UserSettings'
import SystemSettings from '@/pages/SystemSettings'
import CompanyMembers from '@/pages/CompanyMembers'
import { useAuthStore, setNavigateToLogin } from '@/lib/store'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  const navigate = useNavigate()
  useEffect(() => {
    setNavigateToLogin(() => navigate('/login'))
  }, [navigate])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/policies/:id" element={<PolicyDetail />} />
        <Route path="/links" element={<ResourceLinks />} />
        <Route path="/policy-parse" element={<PolicyParse />} />
        <Route path="/crawler" element={<CrawlerManager />} />
        <Route path="/company/profile" element={<CompanyProfile />} />
        <Route path="/company/team" element={<CompanyMembers />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/workbench" element={<Workbench />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user/settings" element={<UserSettings />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}