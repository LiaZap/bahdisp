import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FiHome, FiSend, FiBriefcase, FiUsers, FiBarChart2,
  FiSettings, FiLogOut, FiChevronLeft, FiMenu, FiClock, FiFileText, FiSmartphone
} from 'react-icons/fi'
import { useState } from 'react'
import BahLogo from '../BahLogo'

const menuItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/disparos', icon: FiSend, label: 'Disparos' },
  { to: '/historico', icon: FiClock, label: 'Histórico' },
  { to: '/vagas', icon: FiBriefcase, label: 'Vagas' },
  { to: '/medicos', icon: FiUsers, label: 'Médicos' },
  { to: '/templates', icon: FiFileText, label: 'Templates' },
  { to: '/instancias', icon: FiSmartphone, label: 'Instâncias' },
  { to: '/relatorios', icon: FiBarChart2, label: 'Relatórios' },
  { to: '/configuracoes', icon: FiSettings, label: 'Configurações' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()

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
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user.nome}</p>
              <p className="text-gray-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
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
