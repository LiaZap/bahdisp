import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import { disparosApi } from '../../services/api'
import {
  FiSend, FiCheckCircle, FiUsers, FiBriefcase,
  FiTrendingUp, FiClock, FiAlertCircle
} from 'react-icons/fi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const mockStats = [
  { label: 'Disparos Hoje', value: '127', icon: FiSend, color: 'bg-blue-500', change: '+12%' },
  { label: 'Entregues', value: '119', icon: FiCheckCircle, color: 'bg-green-500', change: '+8%' },
  { label: 'Médicos Ativos', value: '342', icon: FiUsers, color: 'bg-purple-500', change: '+5%' },
  { label: 'Vagas Abertas', value: '18', icon: FiBriefcase, color: 'bg-orange-500', change: '+2' },
]

const mockChart = [
  { dia: 'Seg', disparos: 85, entregues: 80 },
  { dia: 'Ter', disparos: 120, entregues: 112 },
  { dia: 'Qua', disparos: 95, entregues: 90 },
  { dia: 'Qui', disparos: 140, entregues: 132 },
  { dia: 'Sex', disparos: 110, entregues: 105 },
  { dia: 'Sab', disparos: 45, entregues: 43 },
  { dia: 'Dom', disparos: 30, entregues: 28 },
]

const mockRecent = [
  { medico: 'Dr. Carlos Mendes', vaga: 'Plantao UTI - Hospital Sao Lucas', status: 'entregue', hora: '14:32' },
  { medico: 'Dra. Ana Ribeiro', vaga: 'Clinico Geral - UBS Centro', status: 'entregue', hora: '14:30' },
  { medico: 'Dr. Pedro Lima', vaga: 'Ortopedista - Clinica Vida', status: 'pendente', hora: '14:28' },
  { medico: 'Dra. Maria Santos', vaga: 'Cardiologista - Hospital Central', status: 'entregue', hora: '14:25' },
  { medico: 'Dr. Joao Ferreira', vaga: 'Plantao PS - Santa Casa', status: 'erro', hora: '14:20' },
]

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(mockStats)
  const [chartData, setChartData] = useState(mockChart)
  const [recent, setRecent] = useState(mockRecent)

  useEffect(() => {
    disparosApi.stats()
      .then(({ data }) => {
        if (data.stats) {
          setStats([
            { label: 'Disparos Hoje', value: String(data.stats.disparosHoje ?? 0), icon: FiSend, color: 'bg-blue-500', change: data.stats.disparosChange ?? '+0%' },
            { label: 'Entregues', value: String(data.stats.entregues ?? 0), icon: FiCheckCircle, color: 'bg-green-500', change: data.stats.entreguesChange ?? '+0%' },
            { label: 'Medicos Ativos', value: String(data.stats.medicosAtivos ?? 0), icon: FiUsers, color: 'bg-purple-500', change: data.stats.medicosChange ?? '+0%' },
            { label: 'Vagas Abertas', value: String(data.stats.vagasAbertas ?? 0), icon: FiBriefcase, color: 'bg-orange-500', change: data.stats.vagasChange ?? '+0' },
          ])
        }
        if (data.chart) setChartData(data.chart)
        if (data.recent) setRecent(data.recent)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`card flex items-center gap-4 ${loading ? 'animate-pulse' : ''}`}>
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Disparos da Semana</h3>
                <p className="text-sm text-gray-500">Enviados vs Entregues</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-primary-500 rounded-full" /> Disparos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-green-500 rounded-full" /> Entregues
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDisparos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEntregues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area type="monotone" dataKey="disparos" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorDisparos)" />
                <Area type="monotone" dataKey="entregues" stroke="#22c55e" strokeWidth={2.5} fill="url(#colorEntregues)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h3>
            <div className="space-y-3">
              {recent.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`mt-0.5 ${
                    item.status === 'entregue' ? 'text-green-500' :
                    item.status === 'pendente' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {item.status === 'entregue' ? <FiCheckCircle className="w-4 h-4" /> :
                     item.status === 'pendente' ? <FiClock className="w-4 h-4" /> :
                     <FiAlertCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.medico}</p>
                    <p className="text-xs text-gray-500 truncate">{item.vaga}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{item.hora}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
