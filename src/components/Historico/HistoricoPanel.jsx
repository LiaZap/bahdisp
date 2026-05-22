import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import { disparosApi } from '../../services/api'
import toast from 'react-hot-toast'
import {
  FiClock, FiCheckCircle, FiMail, FiEye, FiMessageSquare,
  FiAlertTriangle, FiDownload, FiRefreshCw, FiInbox
} from 'react-icons/fi'

const mockHistorico = [
  {
    _id: 'LMD-3245',
    total: 12, enviados: 12, entregues: 11, lidos: 9, respondidos: 4, erros: 0,
    ultimoEnvio: '2026-05-21T14:32:00',
    vaga: { titulo: 'Plantao UTI - Hospital Sao Lucas', local: 'Hospital Sao Lucas' },
  },
  {
    _id: 'LMD-7188',
    total: 8, enviados: 7, entregues: 6, lidos: 4, respondidos: 2, erros: 1,
    ultimoEnvio: '2026-05-20T09:15:00',
    vaga: { titulo: 'Clinico Geral - UBS Centro', local: 'UBS Centro' },
  },
  {
    _id: 'LMD-9921',
    total: 15, enviados: 14, entregues: 13, lidos: 11, respondidos: 6, erros: 1,
    ultimoEnvio: '2026-05-19T18:00:00',
    vaga: { titulo: 'Ortopedista - Clinica Vida', local: 'Clinica Vida' },
  },
]

export default function HistoricoPanel() {
  const [protocolos, setProtocolos] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchHistorico() {
    try {
      const { data } = await disparosApi.historico()
      setProtocolos(Array.isArray(data) && data.length > 0 ? data : mockHistorico)
    } catch {
      setProtocolos(mockHistorico)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistorico() }, [])

  function handleExportCsv() {
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Sessao expirada')
      return
    }
    const url = disparosApi.exportCsvUrl(30)
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `disparos-${Date.now()}.csv`
        a.click()
        toast.success('CSV baixado!')
      })
      .catch(() => toast.error('Erro ao exportar'))
  }

  function taxa(num, total) {
    if (!total) return '0%'
    return Math.round((num / total) * 100) + '%'
  }

  return (
    <div>
      <Header title="Historico de Disparos" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Protocolos enviados</h3>
            <p className="text-sm text-gray-500">Acompanhe o status de cada disparo realizado</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchHistorico} className="btn-secondary flex items-center gap-2">
              <FiRefreshCw className="w-4 h-4" /> Atualizar
            </button>
            <button onClick={handleExportCsv} className="btn-primary flex items-center gap-2">
              <FiDownload className="w-4 h-4" /> Exportar CSV
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && protocolos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiInbox className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Nenhum disparo realizado</h3>
            <p className="text-sm text-gray-400">Os disparos aparecerao aqui apos o primeiro envio.</p>
          </div>
        )}

        {!loading && protocolos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {protocolos.map(p => (
              <div key={p._id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold bg-gray-900 text-white px-2 py-0.5 rounded">
                        {p._id}
                      </span>
                      {p.erros > 0 && (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FiAlertTriangle className="w-3 h-3" /> {p.erros} erros
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{p.vaga?.titulo || 'Vaga removida'}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <FiClock className="w-3 h-3" />
                      {new Date(p.ultimoEnvio).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mt-4">
                  <div className="text-center bg-blue-50 border border-blue-200 rounded-lg py-2">
                    <div className="text-lg font-bold text-blue-700">{p.total}</div>
                    <div className="text-[10px] text-blue-600 font-medium uppercase">Total</div>
                  </div>
                  <div className="text-center bg-cyan-50 border border-cyan-200 rounded-lg py-2">
                    <div className="text-lg font-bold text-cyan-700">{p.enviados}</div>
                    <div className="text-[10px] text-cyan-600 font-medium uppercase">Enviados</div>
                  </div>
                  <div className="text-center bg-green-50 border border-green-200 rounded-lg py-2">
                    <div className="text-lg font-bold text-green-700">{p.entregues}</div>
                    <div className="text-[10px] text-green-600 font-medium uppercase">Entregues</div>
                  </div>
                  <div className="text-center bg-violet-50 border border-violet-200 rounded-lg py-2">
                    <div className="text-lg font-bold text-violet-700">{p.lidos}</div>
                    <div className="text-[10px] text-violet-600 font-medium uppercase">Lidos</div>
                  </div>
                  <div className="text-center bg-orange-50 border border-orange-200 rounded-lg py-2">
                    <div className="text-lg font-bold text-orange-700">{p.respondidos}</div>
                    <div className="text-[10px] text-orange-600 font-medium uppercase">Resp.</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-3 mt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiMail className="w-3 h-3 text-green-500" /> {taxa(p.entregues, p.total)} entrega
                  </span>
                  <span className="flex items-center gap-1">
                    <FiEye className="w-3 h-3 text-violet-500" /> {taxa(p.lidos, p.total)} leitura
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMessageSquare className="w-3 h-3 text-orange-500" /> {taxa(p.respondidos, p.total)} resposta
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
