import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Login from './components/Auth/Login'
import Layout from './components/Layout/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import DisparoPanel from './components/Disparos/DisparoPanel'
import VagaList from './components/Vagas/VagaList'
import MedicoList from './components/Medicos/MedicoList'
import Relatorios from './components/Relatorios/Relatorios'
import Configuracoes from './components/Configuracoes/Configuracoes'
import HistoricoPanel from './components/Historico/HistoricoPanel'
import TemplatesPanel from './components/Templates/TemplatesPanel'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/disparos" element={<DisparoPanel />} />
            <Route path="/vagas" element={<VagaList />} />
            <Route path="/medicos" element={<MedicoList />} />
            <Route path="/historico" element={<HistoricoPanel />} />
            <Route path="/templates" element={<TemplatesPanel />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  )
}
