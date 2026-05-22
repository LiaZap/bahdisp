import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import toast from 'react-hot-toast'
import { disparosApi } from '../../services/api'
import {
  FiSend, FiCheckCircle, FiAlertCircle, FiClock,
  FiTrendingUp, FiCalendar, FiDownload
} from 'react-icons/fi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'

const defaultWeekData = [
  { dia: 'Seg', enviados: 120, entregues: 112, lidos: 89, respondidos: 34 },
  { dia: 'Ter', enviados: 145, entregues: 138, lidos: 102, respondidos: 41 },
  { dia: 'Qua', enviados: 98, entregues: 92, lidos: 76, respondidos: 28 },
  { dia: 'Qui', enviados: 167, entregues: 159, lidos: 118, respondidos: 52 },
  { dia: 'Sex', enviados: 134, entregues: 128, lidos: 95, respondidos: 38 },
  { dia: 'Sab', enviados: 56, entregues: 52, lidos: 41, respondidos: 15 },
  { dia: 'Dom', enviados: 23, entregues: 21, lidos: 17, respondidos: 6 },
]

const defaultStatusData = [
  { name: 'Entregues', value: 702, color: '#22c55e' },
  { name: 'Lidos', value: 538, color: '#3b82f6' },
  { name: 'Respondidos', value: 214, color: '#8b5cf6' },
  { name: 'Falhas', value: 41, color: '#ef4444' },
]

const defaultVagasRanking = [
  { vaga: 'Plantao UTI - Hospital Sao Lucas', disparos: 89, respostas: 23, taxa: 25.8 },
  { vaga: 'Clinico Geral - UBS Centro', disparos: 67, respostas: 18, taxa: 26.9 },
  { vaga: 'Ortopedista - Clinica Vida', disparos: 54, respostas: 12, taxa: 22.2 },
  { vaga: 'Plantao PS - Santa Casa', disparos: 45, respostas: 15, taxa: 33.3 },
  { vaga: 'Anestesista - Hospital Central', disparos: 38, respostas: 8, taxa: 21.1 },
]

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('semana')
  const [loading, setLoading] = useState(true)
  const [weekData, setWeekData] = useState(defaultWeekData)
  const [statusData, setStatusData] = useState(defaultStatusData)
  const [vagasRanking, setVagasRanking] = useState(defaultVagasRanking)

  useEffect(() => {
    disparosApi.stats()
      .then(({ data }) => {
        if (data.weekData) setWeekData(data.weekData)
        if (data.statusData) setStatusData(data.statusData)
        if (data.vagasRanking) setVagasRanking(data.vagasRanking)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalEnviados = weekData.reduce((a, b) => a + b.enviados, 0)
  const totalEntregues = weekData.reduce((a, b) => a + b.entregues, 0)
  const totalLidos = weekData.reduce((a, b) => a + b.lidos, 0)
  const totalRespondidos = weekData.reduce((a, b) => a + b.respondidos, 0)

  function diasDoPeriodo() {
    if (periodo === 'hoje') return 1
    if (periodo === 'mes') return 30
    return 7
  }

  async function handleExportCsv() {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(disparosApi.exportCsvUrl(diasDoPeriodo()), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('fail')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `disparos-${periodo}-${Date.now()}.csv`
      a.click()
      toast.success('CSV baixado!')
    } catch {
      toast.error('Erro ao exportar (backend offline?)')
    }
  }

  return (
    <div>
      <Header title="Relatorios" />
      <div className="p-6 space-y-6">
        {/* Period Filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {['hoje', 'semana', 'mes'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  periodo === p ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={handleExportCsv} className="btn-secondary flex items-center gap-2 text-sm">
            <FiDownload className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={FiSend} label="Enviados" value={totalEnviados} color="blue" />
          <SummaryCard icon={FiCheckCircle} label="Entregues" value={totalEntregues} color="green" percent={totalEnviados > 0 ? ((totalEntregues / totalEnviados) * 100).toFixed(1) : '0'} />
          <SummaryCard icon={FiClock} label="Lidos" value={totalLidos} color="purple" percent={totalEnviados > 0 ? ((totalLidos / totalEnviados) * 100).toFixed(1) : '0'} />
          <SummaryCard icon={FiTrendingUp} label="Respondidos" value={totalRespondidos} color="orange" percent={totalEnviados > 0 ? ((totalRespondidos / totalEnviados) * 100).toFixed(1) : '0'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Desempenho por Dia</h3>
            <p className="text-sm text-gray-500 mb-4">Comparativo de envios e interacoes</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weekData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="enviados" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Enviados" />
                <Bar dataKey="entregues" fill="#22c55e" radius={[4, 4, 0, 0]} name="Entregues" />
                <Bar dataKey="respondidos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Respondidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Status dos Disparos</h3>
            <p className="text-sm text-gray-500 mb-4">Distribuicao geral</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-semibold text-gray-700">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vagas Ranking */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Ranking de Vagas</h3>
          <p className="text-sm text-gray-500 mb-4">Vagas com melhor taxa de resposta</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3 pr-4">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Vaga</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase pb-3">Disparos</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase pb-3">Respostas</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase pb-3">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vagasRanking.map((v, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 text-sm font-medium text-gray-900">{v.vaga}</td>
                    <td className="py-3 text-sm text-center text-gray-600">{v.disparos}</td>
                    <td className="py-3 text-sm text-center text-gray-600">{v.respostas}</td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        v.taxa >= 30 ? 'bg-green-50 text-green-700' :
                        v.taxa >= 25 ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {v.taxa}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color, percent }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  }

  return (
    <div className={`rounded-xl border px-4 py-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-70" />
        {percent && <span className="text-xs font-semibold">{percent}%</span>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  )
}
