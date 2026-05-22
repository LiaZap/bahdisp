import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiAlertTriangle, FiCalendar, FiXCircle, FiCheckCircle, FiX } from 'react-icons/fi'
import { vagasApi, agendamentosApi, disparosApi } from '../../services/api'

const READ_KEY = 'bah_notif_read'
function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'))
  } catch {
    return new Set()
  }
}
function markRead(ids) {
  const set = getReadIds()
  ids.forEach(id => set.add(id))
  localStorage.setItem(READ_KEY, JSON.stringify([...set]))
}

function formatHora(d) {
  const data = new Date(d)
  const diff = Date.now() - data.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return data.toLocaleDateString('pt-BR')
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  async function loadNotifications() {
    setLoading(true)
    try {
      const [vagasRes, agRes, dispRes] = await Promise.all([
        vagasApi.list().catch(() => ({ data: [] })),
        agendamentosApi.list().catch(() => ({ data: [] })),
        disparosApi.list({ status: 'erro', limit: 5 }).catch(() => ({ data: [] })),
      ])
      const list = []
      const agora = Date.now()
      const em24h = agora + 24 * 60 * 60000

      // Vagas urgentes ainda abertas
      const vagas = Array.isArray(vagasRes.data) ? vagasRes.data : []
      vagas
        .filter(v => v.urgente && v.status === 'aberta')
        .slice(0, 3)
        .forEach(v => {
          list.push({
            id: `vaga-${v._id}`,
            type: 'urgent',
            icon: FiAlertTriangle,
            title: 'Vaga urgente em aberto',
            message: v.titulo,
            time: v.createdAt || v.data,
            link: '/vagas',
          })
        })

      // Agendamentos nas próximas 24h
      const ags = Array.isArray(agRes.data) ? agRes.data : []
      ags
        .filter(a => a.status === 'pendente' && new Date(a.agendadoPara).getTime() <= em24h)
        .slice(0, 3)
        .forEach(a => {
          list.push({
            id: `ag-${a._id}`,
            type: 'schedule',
            icon: FiCalendar,
            title: 'Disparo agendado',
            message: `${a.vaga?.titulo || 'Vaga'} - ${new Date(a.agendadoPara).toLocaleString('pt-BR')}`,
            time: a.agendadoPara,
            link: '/disparos',
          })
        })

      // Disparos com erro
      const disps = Array.isArray(dispRes.data) ? dispRes.data : []
      disps.slice(0, 3).forEach(d => {
        list.push({
          id: `disp-${d._id}`,
          type: 'error',
          icon: FiXCircle,
          title: 'Falha no disparo',
          message: `${d.medico?.nome || 'Médico'} - ${d.erro || 'erro desconhecido'}`,
          time: d.createdAt,
          link: '/historico',
        })
      })

      list.sort((a, b) => new Date(b.time) - new Date(a.time))
      setNotifications(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const readIds = getReadIds()
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  function handleOpen() {
    if (!open) loadNotifications()
    setOpen(!open)
  }

  function handleClick(notif) {
    markRead([notif.id])
    setOpen(false)
    navigate(notif.link)
  }

  function handleMarkAllRead() {
    markRead(notifications.map(n => n.id))
    setNotifications([...notifications])
  }

  const colors = {
    urgent: 'text-red-600 bg-red-50',
    schedule: 'text-blue-600 bg-blue-50',
    error: 'text-orange-600 bg-orange-50',
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Notificações</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">
                  Marcar todas como lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="py-12 text-center">
                <FiCheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma notificação no momento</p>
                <p className="text-xs text-gray-400 mt-1">Tudo certo por aqui!</p>
              </div>
            )}

            {!loading && notifications.map(notif => {
              const Icon = notif.icon
              const isRead = readIds.has(notif.id)
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                    !isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${colors[notif.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notif.title}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatHora(notif.time)}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                  </div>
                  {!isRead && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </button>
              )
            })}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Atualiza automaticamente a cada minuto</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
