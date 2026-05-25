import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FiHome, FiSend, FiBriefcase, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiChevronLeft, FiMenu, FiClock, FiFileText,
  FiSmartphone, FiLock, FiZap, FiX
} from 'react-icons/fi'
import { useState } from 'react'
import BahLogo from '../BahLogo'

const menuItems = [
  { to: '/disparos', icon: FiSend, label: 'Disparos' },
  { to: '/instancias', icon: FiSmartphone, label: 'Instâncias' },
  { to: '/dashboard', icon: FiHome, label: 'Dashboard', premium: true },
  { to: '/historico', icon: FiClock, label: 'Histórico', premium: true },
  { to: '/vagas', icon: FiBriefcase, label: 'Vagas', premium: true },
  { to: '/medicos', icon: FiUsers, label: 'Médicos', premium: true },
  { to: '/templates', icon: FiFileText, label: 'Templates', premium: true },
  { to: '/relatorios', icon: FiBarChart2, label: 'Relatórios', premium: true },
  { to: '/configuracoes', icon: FiSettings, label: 'Configurações' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [premiumModal, setPremiumModal] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Admin destrava tudo
  const isAdmin = user?.role === 'admin'

  function handleClick(e, item) {
    if (item.premium && !isAdmin) {
      e.preventDefault()
      setPremiumModal(item)
    }
  }

  return (
    <>
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-sidebar min-h-screen flex flex-col transition-all duration-300 sticky top-0`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <BahLogo size="sm" variant="white" />
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <BahLogo size="xs" variant="white" className="opacity-60" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          >
            {collapsed ? <FiMenu className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && user && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-white text-sm font-medium truncate">{user.nome}</p>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
              {isAdmin && (
                <span className="text-[9px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded">
                  ADMIN
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isLocked = item.premium && !isAdmin
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleClick(e, item)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive && !isLocked
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : isLocked
                      ? 'text-gray-500 cursor-pointer hover:bg-white/5'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isLocked ? 'opacity-50' : ''}`} />
                {!collapsed && (
                  <>
                    <span className={isLocked ? 'blur-[3px] select-none' : ''}>
                      {item.label}
                    </span>
                    {isLocked && (
                      <span className="ml-auto flex items-center gap-1">
                        <FiLock className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                  </>
                )}
                {collapsed && isLocked && (
                  <FiLock className="absolute -top-0.5 -right-0.5 w-3 h-3 text-amber-400 bg-sidebar rounded-full p-0.5" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Upgrade card (so para nao-admins) */}
        {!collapsed && !isAdmin && (
          <div className="mx-3 mb-3 p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <FiZap className="w-4 h-4 text-amber-400" />
              <p className="text-amber-300 text-xs font-semibold">Plano Premium</p>
            </div>
            <p className="text-gray-400 text-[11px] mb-2 leading-relaxed">
              Desbloqueie todas as funcionalidades
            </p>
            <button
              onClick={() => setPremiumModal({ label: 'todas as funcionalidades' })}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
            >
              Saber mais
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <FiLogOut className="w-5 h-5" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Premium Modal */}
      {premiumModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white text-center relative">
              <button
                onClick={() => setPremiumModal(null)}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <FiX className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FiZap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-1">Funcionalidade Premium</h3>
              <p className="text-amber-50 text-sm">
                {premiumModal.label === 'todas as funcionalidades'
                  ? 'Desbloqueie o sistema completo'
                  : `"${premiumModal.label}" está bloqueado`}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Faça upgrade para o <strong>Plano Premium</strong> e desbloqueie:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700"><strong>Dashboard completo</strong> — métricas em tempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700"><strong>Histórico de disparos</strong> — protocolos, status, exportação CSV</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700"><strong>Gestão de Vagas e Médicos</strong> — cadastro, CSV import, tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700"><strong>Templates personalizados</strong> — modelos reutilizáveis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700"><strong>Relatórios avançados</strong> — gráficos, ranking, exportação</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-700"><strong>Agendamento</strong> — disparos automáticos</span>
                </li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-800 font-medium">
                  Entre em contato para liberar
                </p>
                <a
                  href="https://wa.me/5511999999999?text=Quero%20conhecer%20o%20Plano%20Premium%20do%20bah!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 bg-whatsapp hover:bg-green-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  <FiSmartphone className="w-4 h-4" /> Falar no WhatsApp
                </a>
              </div>
              <button
                onClick={() => setPremiumModal(null)}
                className="w-full btn-secondary"
              >
                Continuar com o plano gratuito
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
