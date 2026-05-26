import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import { disparosApi } from '../../services/api'
import toast from 'react-hot-toast'
import {
  FiClock, FiCheckCircle, FiMail, FiEye, FiMessageSquare,
  FiAlertTriangle, FiDownload, FiRefreshCw, FiInbox, FiPhone,
  FiSmartphone, FiX, FiSend, FiXCircle, FiBriefcase
} from 'react-icons/fi'

const statusBadge = {
  pendente: { label: 'Pendente', cls: 'bg-gray-100 text-gray-600' },
  enviando: { label: 'Enviando', cls: 'bg-blue-100 text-blue-700' },
  enviado: { label: 'Enviado', cls: 'bg-green-100 text-green-700' },
  entregue: { label: 'Entregue', cls: 'bg-green-100 text-green-700' },
  lido: { label: 'Lido', cls: 'bg-violet-100 text-violet-700' },
  respondido: { label: 'Respondido', cls: 'bg-orange-100 text-orange-700' },
  erro: { label: 'Erro', cls: 'bg-red-100 text-red-700' },
}

export default function HistoricoPanel() {
  const [protocolos, setProtocolos] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalhe, setDetalhe] = useState(null) // protocolo selecionado
  const [disparosDetalhe, setDisparosDetalhe] = useState([])
  const [loadingDetalhe, setLoadingDetalhe] = useState(false)

  async function fetchHistorico() {
    setLoading(true)
    try {
      const { data } = await disparosApi.historico()
      setProtocolos(Array.isArray(data) ? data : [])
    } catch {
      setProtocolos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistorico() }, [])

  async function abrirDetalhe(protocolo) {
    setDetalhe(protocolo)
    setLoadingDetalhe(true)
    try {
      const { data } = await disparosApi.detalhesProtocolo(protocolo._id)
      setDisparosDetalhe(Array.isArray(data) ? data : [])
    } catch {
      setDisparosDetalhe([])
    } finally {
      setLoadingDetalhe(false)
    }
  }

  function handleExportCsv() {
    const token = localStorage.getItem('token')
    fetch(disparosApi.exportCsvUrl(30), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
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

  function formatPhone(p) {
    if (!p) return ''
    const m = p.match(/^55(\d{2})(\d{4,5})(\d{4})$/)
    return m ? `+55 (${m[1]}) ${m[2]}-${m[3]}` : p
  }

  return (
    <div>
      <Header title="Histórico de Disparos" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Todos os disparos enviados</h3>
            <p className="text-sm text-gray-500">Acompanhe o status de cada protocolo e veja os números individuais</p>
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
            <p className="text-sm text-gray-400">Os protocolos aparecerão aqui após o primeiro envio.</p>
          </div>
        )}

        {!loading && protocolos.length > 0 && (
          <div className="space-y-3">
            {protocolos.map(p => {
              const emAndamento = (p.enviando + p.pendentes) > 0
              return (
                <button
                  key={p._id}
                  onClick={() => abrirDetalhe(p)}
                  className="w-full text-left card hover:shadow-md hover:border-primary-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold bg-gray-900 text-white px-2 py-0.5 rounded">
                          {p._id}
                        </span>
                        {emAndamento && (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Em andamento
                          </span>
                        )}
                        {p.tipo === 'simples' && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FiPhone className="w-3 h-3" /> Disparo simples
                          </span>
                        )}
                        {p.tipo === 'vaga' && (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FiBriefcase className="w-3 h-3" /> Vaga médica
                          </span>
                        )}
                        {p.erros > 0 && (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FiAlertTriangle className="w-3 h-3" /> {p.erros} erro{p.erros !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {p.tipo === 'vaga' && p.vaga && (
                        <h4 className="text-sm font-bold text-gray-900 truncate">{p.vaga.titulo}</h4>
                      )}
                      {p.tipo === 'simples' && p.primeiraMensagem && (
                        <p className="text-sm text-gray-700 line-clamp-1 italic">
                          "{p.primeiraMensagem.replace(/[​*_]/g, '').slice(0, 80)}..."
                        </p>
                      )}
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {new Date(p.ultimoEnvio).toLocaleString('pt-BR')}
                        </span>
                        {p.instance && (
                          <span className="flex items-center gap-1">
                            <FiSmartphone className="w-3 h-3" />
                            {p.instance.nome}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-3">
                    <div className="text-center bg-gray-50 border border-gray-200 rounded-lg py-1.5">
                      <div className="text-base font-bold text-gray-700">{p.total}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-medium">Total</div>
                    </div>
                    <div className="text-center bg-green-50 border border-green-200 rounded-lg py-1.5">
                      <div className="text-base font-bold text-green-700">{p.enviados}</div>
                      <div className="text-[10px] text-green-600 uppercase font-medium">Enviadas</div>
                    </div>
                    {(p.enviando > 0 || p.pendentes > 0) && (
                      <div className="text-center bg-blue-50 border border-blue-200 rounded-lg py-1.5">
                        <div className="text-base font-bold text-blue-700">{p.enviando + p.pendentes}</div>
                        <div className="text-[10px] text-blue-600 uppercase font-medium">Pendentes</div>
                      </div>
                    )}
                    {p.entregues > 0 && (
                      <div className="text-center bg-emerald-50 border border-emerald-200 rounded-lg py-1.5">
                        <div className="text-base font-bold text-emerald-700">{p.entregues}</div>
                        <div className="text-[10px] text-emerald-600 uppercase font-medium">Entregues</div>
                      </div>
                    )}
                    {p.lidos > 0 && (
                      <div className="text-center bg-violet-50 border border-violet-200 rounded-lg py-1.5">
                        <div className="text-base font-bold text-violet-700">{p.lidos}</div>
                        <div className="text-[10px] text-violet-600 uppercase font-medium">Lidos</div>
                      </div>
                    )}
                    {p.respondidos > 0 && (
                      <div className="text-center bg-orange-50 border border-orange-200 rounded-lg py-1.5">
                        <div className="text-base font-bold text-orange-700">{p.respondidos}</div>
                        <div className="text-[10px] text-orange-600 uppercase font-medium">Resposta</div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Modal de detalhes */}
        {detalhe && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiSend className="text-primary-600" />
                    Detalhes do protocolo
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{detalhe._id}</p>
                </div>
                <button onClick={() => setDetalhe(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {loadingDetalhe && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                )}

                {!loadingDetalhe && disparosDetalhe.length > 0 && (
                  <div className="space-y-2">
                    {disparosDetalhe.map(d => {
                      const badge = statusBadge[d.status] || statusBadge.pendente
                      const numero = d.numero || d.medico?.whatsapp
                      const nome = d.medico?.nome
                      return (
                        <div key={d._id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              {nome && (
                                <p className="text-sm font-semibold text-gray-900 truncate">{nome}</p>
                              )}
                              <p className="text-xs text-gray-600 font-mono flex items-center gap-1">
                                <FiPhone className="w-3 h-3" /> {formatPhone(numero)}
                              </p>
                              {d.medico?.especialidade && (
                                <p className="text-xs text-gray-500">{d.medico.especialidade}</p>
                              )}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          {d.erro && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1 mb-2">
                              ⚠ {d.erro}
                            </p>
                          )}
                          <details className="text-xs">
                            <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                              Ver mensagem enviada
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap bg-white border border-gray-200 rounded p-2 font-sans text-gray-700">
                              {d.mensagem}
                            </pre>
                          </details>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                            <span>Criado: {new Date(d.createdAt).toLocaleString('pt-BR')}</span>
                            {d.enviadoEm && (
                              <span>· Enviado: {new Date(d.enviadoEm).toLocaleTimeString('pt-BR')}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!loadingDetalhe && disparosDetalhe.length === 0 && (
                  <p className="text-center py-8 text-sm text-gray-400">Nenhum disparo encontrado.</p>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={() => setDetalhe(null)} className="btn-secondary">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
