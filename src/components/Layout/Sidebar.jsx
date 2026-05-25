import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FiHome, FiSend, FiBriefcase, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiChevronLeft, FiMenu, FiClock, FiFileText,
  FiSmartphone, FiLock
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
  const { user, logout } = useAuth()

  const isAdmin = user?.role === 'admin'

  function handleClick(e, item) {
    if (item.premium && !isAdmin) {
      e.preventDefault()
    }
  }

  return (
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
                    ? 'text-gray-500 cursor-not-allowed hover:bg-white/5'
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
                    <FiLock className="ml-auto w-3.5 h-3.5 text-amber-400" />
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
  )
}
