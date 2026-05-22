import { useState, useEffect, useMemo } from 'react'
import Header from '../Layout/Header'
import WhatsAppPreview from './WhatsAppPreview'
import toast from 'react-hot-toast'
import { vagasApi, medicosApi, disparosApi, agendamentosApi, instancesApi } from '../../services/api'
import { gerarMensagem as gerarMensagemVariada, gerarAmostras, variarCustom } from '../../utils/messageVariation'
import {
  FiSend, FiUsers, FiFilter, FiRefreshCw, FiAlertTriangle,
  FiCheckCircle, FiClock, FiShield, FiBriefcase, FiHash, FiEye, FiX,
  FiZap, FiCalendar
} from 'react-icons/fi'

const mockVagas = [
  { _id: '1', titulo: 'Plantao UTI - Hospital Sao Lucas', local: 'Hospital Sao Lucas', data: '2026-05-25', valor: 1800 },
  { _id: '2', titulo: 'Clinico Geral - UBS Centro', local: 'UBS Centro', data: '2026-05-26', valor: 800 },
  { _id: '3', titulo: 'Ortopedista - Clinica Vida', local: 'Clinica Vida', data: '2026-05-27', valor: 1200 },
]

const mockMedicos = [
  { _id: '1', nome: 'Dr. Carlos Mendes', whatsapp: '5511999990001', especialidade: 'Intensivista', selecionado: false },
  { _id: '2', nome: 'Dra. Ana Ribeiro', whatsapp: '5511999990002', especialidade: 'Clinico Geral', selecionado: false },
  { _id: '3', nome: 'Dr. Pedro Lima', whatsapp: '5511999990003', especialidade: 'Ortopedista', selecionado: false },
  { _id: '4', nome: 'Dra. Maria Santos', whatsapp: '5511999990004', especialidade: 'Cardiologista', selecionado: false },
  { _id: '5', nome: 'Dr. Joao Ferreira', whatsapp: '5511999990005', especialidade: 'Intensivista', selecionado: false },
]

const templates = [
  { id: 1, nome: 'Modelo 1 - Padrao', descricao: 'Mensagem completa com todos os detalhes' },
  { id: 2, nome: 'Modelo 2 - Resumido', descricao: 'Mensagem curta e direta' },
  { id: 3, nome: 'Modelo 3 - Urgente', descricao: 'Mensagem com destaque de urgencia' },
]

export default function DisparoPanel() {
  const [vagas, setVagas] = useState(mockVagas)
  const [vagaSelecionada, setVagaSelecionada] = useState('')
  const [templateSelecionado, setTemplateSelecionado] = useState(1)
  const [medicos, setMedicos] = useState(mockMedicos)
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('')
  const [antiBlock, setAntiBlock] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [protocolo, setProtocolo] = useState('LMD-' + Math.floor(Math.random() * 9000 + 1000))
  const [mensagemCustom, setMensagemCustom] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('vaga')
  const [loadingData, setLoadingData] = useState(true)
  const [previewSeed, setPreviewSeed] = useState(0)
  const [showAmostras, setShowAmostras] = useState(false)
  const [showAgendar, setShowAgendar] = useState(false)
  const [agendamentoData, setAgendamentoData] = useState('')
  const [instances, setInstances] = useState([])
  const [instanciaSelecionada, setInstanciaSelecionada] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [vagasRes, medicosRes, instRes] = await Promise.all([
          vagasApi.list().catch(() => null),
          medicosApi.list({ ativo: true }).catch(() => null),
          instancesApi.list().catch(() => null),
        ])
        if (Array.isArray(vagasRes?.data)) setVagas(vagasRes.data)
        if (Array.isArray(medicosRes?.data)) {
          setMedicos(medicosRes.data.map(m => ({ ...m, selecionado: false })))
        }
        if (Array.isArray(instRes?.data)) {
          setInstances(instRes.data)
          const padrao = instRes.data.find(i => i.padrao && i.status === 'conectado')
            || instRes.data.find(i => i.padrao)
            || instRes.data.find(i => i.status === 'conectado')
          if (padrao) setInstanciaSelecionada(padrao._id)
        }
      } catch {
        /* keep mock data as fallback */
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

  const vaga = vagas.find(v => v._id === vagaSelecionada)
  const selecionados = medicos.filter(m => m.selecionado)
  const especialidades = [...new Set(medicos.map(m => m.especialidade))]

  function toggleMedico(id) {
    setMedicos(prev => prev.map(m => m._id === id ? { ...m, selecionado: !m.selecionado } : m))
  }

  function toggleTodos() {
    const todosSelecionados = medicosFiltrados.every(m => m.selecionado)
    const ids = new Set(medicosFiltrados.map(m => m._id))
    setMedicos(prev => prev.map(m => ids.has(m._id) ? { ...m, selecionado: !todosSelecionados } : m))
  }

  const medicosFiltrados = filtroEspecialidade
    ? medicos.filter(m => m.especialidade === filtroEspecialidade)
    : medicos

  // Auto-seleciona medicos compativeis com a especialidade da vaga
  function matchPorEspecialidade() {
    if (!vaga) return toast.error('Selecione uma vaga')
    const alvo = (vaga.especialidade || vaga.titulo || '').toLowerCase()
    if (!alvo) return toast.error('Vaga sem especialidade definida')

    const compativeis = medicos.filter(m =>
      m.especialidade && alvo.includes(m.especialidade.toLowerCase())
    )
    if (compativeis.length === 0) {
      return toast.error('Nenhum medico compativel encontrado')
    }
    const ids = new Set(compativeis.map(m => m._id))
    setMedicos(prev => prev.map(m => ({ ...m, selecionado: ids.has(m._id) })))
    setAbaAtiva('medicos')
    toast.success(`${compativeis.length} medico${compativeis.length !== 1 ? 's' : ''} compativel${compativeis.length !== 1 ? 'is' : ''} selecionado${compativeis.length !== 1 ? 's' : ''}!`)
  }

  async function handleAgendar() {
    if (!vagaSelecionada) return toast.error('Selecione uma vaga')
    if (selecionados.length === 0) return toast.error('Selecione pelo menos um medico')
    if (!agendamentoData) return toast.error('Selecione data e hora')
    const quando = new Date(agendamentoData)
    if (quando <= new Date()) return toast.error('Data deve ser futura')
    try {
      await agendamentosApi.create({
        vagaId: vagaSelecionada,
        medicoIds: selecionados.map(m => m._id),
        templateId: templateSelecionado,
        mensagemCustom: mensagemCustom || undefined,
        antiBlock,
        instanceId: instanciaSelecionada || undefined,
        agendadoPara: quando,
      })
      toast.success(`Disparo agendado para ${quando.toLocaleString('pt-BR')}!`)
      setShowAgendar(false)
      setAgendamentoData('')
      setMedicos(prev => prev.map(m => ({ ...m, selecionado: false })))
    } catch {
      toast.error('Erro ao agendar (verifique se o backend esta ativo)')
    }
  }

  function gerarMensagem() {
    if (!vaga) return ''
    // Seed estático quando antiBlock está OFF (todos recebem igual)
    // Seed por previewSeed quando ON (preview rotaciona as variações)
    const seed = antiBlock ? `preview-${previewSeed}` : 'static-base'
    if (mensagemCustom) {
      return antiBlock ? variarCustom(mensagemCustom, seed) : mensagemCustom
    }
    return gerarMensagemVariada(vaga, templateSelecionado, seed)
  }

  // Amostras de variações para o usuário visualizar
  const amostras = useMemo(() => {
    if (!vaga) return []
    if (mensagemCustom) {
      return Array.from({ length: 4 }, (_, i) =>
        variarCustom(mensagemCustom, `sample-${i}-${Math.random()}`)
      )
    }
    return gerarAmostras(vaga, templateSelecionado, 4)
  }, [vaga, templateSelecionado, mensagemCustom, showAmostras])

  async function handleDisparar() {
    if (!vagaSelecionada) return toast.error('Selecione uma vaga')
    if (selecionados.length === 0) return toast.error('Selecione pelo menos um medico')

    setEnviando(true)
    try {
      const { data } = await disparosApi.enviar({
        vagaId: vagaSelecionada,
        medicoIds: selecionados.map(m => m._id),
        mensagem: gerarMensagem(),
        mensagemCustom: mensagemCustom || undefined,
        templateId: templateSelecionado,
        antiBlock,
        protocolo,
        instanceId: instanciaSelecionada || undefined,
        intervaloMin: 3,
        intervaloMax: 12,
      })
      toast.success(`${data.enviados} disparos enviados! Protocolo: ${data.protocolo}`)
      setProtocolo('LMD-' + Math.floor(Math.random() * 9000 + 1000))
      setMedicos(prev => prev.map(m => ({ ...m, selecionado: false })))
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'QUIET_HOURS') {
        const q = err.response.data.quietHours
        toast.error(`Horario de silencio ativo (${q.inicio}h-${q.fim}h)`, { duration: 5000 })
      } else {
        toast.error('Erro ao enviar disparos')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <Header title="Disparos de Vagas" />
      <div className="p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Panel - Configuration */}
          <div className="flex-1 space-y-5">
            {/* Protocol Header */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiSend className="text-primary-600" />
                    Configuracao do Disparo
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Configure e envie vagas para os medicos cadastrados</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg">
                  <span className="text-xs text-gray-400">PROTOCOLO:</span>
                  <span className="font-mono font-bold text-sm">{protocolo}</span>
                  <button onClick={() => setProtocolo('LMD-' + Math.floor(Math.random() * 9000 + 1000))} className="text-gray-400 hover:text-white">
                    <FiRefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="card">
              <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAbaAtiva('vaga')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    abaAtiva === 'vaga' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiBriefcase className="w-4 h-4" /> Selecionar Vaga
                </button>
                <button
                  onClick={() => setAbaAtiva('medicos')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    abaAtiva === 'medicos' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiUsers className="w-4 h-4" /> Medicos
                  {selecionados.length > 0 && (
                    <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {selecionados.length}
                    </span>
                  )}
                </button>
              </div>

              {abaAtiva === 'vaga' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vaga para disparar</label>
                    <select
                      value={vagaSelecionada}
                      onChange={(e) => setVagaSelecionada(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Selecione uma vaga...</option>
                      {vagas.map(v => (
                        <option key={v._id} value={v._id}>{v.titulo}</option>
                      ))}
                    </select>
                  </div>

                  {instances.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Instancia WhatsApp</span>
                        {instanciaSelecionada && instances.find(i => i._id === instanciaSelecionada)?.status !== 'conectado' && (
                          <span className="text-xs font-normal text-amber-600">⚠ nao conectada</span>
                        )}
                      </label>
                      <select
                        value={instanciaSelecionada}
                        onChange={e => setInstanciaSelecionada(e.target.value)}
                        className="input-field"
                      >
                        <option value="">Padrao (env)</option>
                        {instances.map(i => (
                          <option key={i._id} value={i._id}>
                            {i.nome} {i.phone ? `(${i.phone})` : ''} {i.padrao ? '★' : ''} {i.status === 'conectado' ? '✓' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Modelo da Mensagem</label>
                    <select
                      value={templateSelecionado}
                      onChange={(e) => setTemplateSelecionado(Number(e.target.value))}
                      className="input-field"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      {templates.find(t => t.id === templateSelecionado)?.descricao}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mensagem personalizada <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={mensagemCustom}
                      onChange={(e) => setMensagemCustom(e.target.value)}
                      className="input-field min-h-[100px] resize-y"
                      placeholder="Deixe em branco para usar o modelo selecionado..."
                    />
                  </div>

                  {/* Anti-block */}
                  <div className={`border rounded-xl px-4 py-3 transition-colors ${
                    antiBlock ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FiShield className={`w-5 h-5 ${antiBlock ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${antiBlock ? 'text-green-800' : 'text-gray-700'}`}>
                            Protecao Anti-Bloqueio
                          </p>
                          <p className={`text-xs ${antiBlock ? 'text-green-600' : 'text-gray-500'}`}>
                            Cada medico recebe uma versao diferente (mesmo contexto)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAntiBlock(!antiBlock)}
                        className={`w-12 h-6 rounded-full transition-all duration-300 ${
                          antiBlock ? 'bg-green-500' : 'bg-gray-300'
                        } relative flex-shrink-0`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                          antiBlock ? 'left-[26px]' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                    {antiBlock && vaga && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200">
                        <button
                          onClick={() => setPreviewSeed(s => s + 1)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 bg-white border border-green-300 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FiRefreshCw className="w-3.5 h-3.5" /> Girar preview
                        </button>
                        <button
                          onClick={() => setShowAmostras(true)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-green-700 bg-white border border-green-300 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <FiEye className="w-3.5 h-3.5" /> Ver variacoes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {abaAtiva === 'medicos' && (
                <div className="space-y-3">
                  <button
                    onClick={matchPorEspecialidade}
                    disabled={!vagaSelecionada}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-all shadow-sm"
                  >
                    <FiZap className="w-4 h-4" />
                    Selecionar medicos compativeis com a vaga
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={filtroEspecialidade}
                        onChange={(e) => setFiltroEspecialidade(e.target.value)}
                        className="input-field pl-9 text-sm"
                      >
                        <option value="">Todas especialidades</option>
                        {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={toggleTodos}
                      className="btn-secondary text-xs py-2 px-3"
                    >
                      {medicosFiltrados.every(m => m.selecionado) ? 'Desmarcar' : 'Selecionar'} todos
                    </button>
                  </div>

                  {loadingData && (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  )}

                  {!loadingData && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {medicosFiltrados.map((m) => (
                        <label
                          key={m._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            m.selecionado
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={m.selecionado}
                            onChange={() => toggleMedico(m._id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{m.nome}</p>
                            <p className="text-xs text-gray-500">{m.especialidade} - {m.whatsapp}</p>
                          </div>
                          {m.selecionado && <FiCheckCircle className="w-4 h-4 text-primary-600" />}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Send Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDisparar}
                disabled={enviando || !vagaSelecionada || selecionados.length === 0}
                className="flex-1 btn-whatsapp flex items-center justify-center gap-3 py-4 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando {selecionados.length} disparos...
                  </>
                ) : (
                  <>
                    <FiSend className="w-5 h-5" />
                    Disparar para {selecionados.length} medico{selecionados.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAgendar(true)}
                disabled={enviando || !vagaSelecionada || selecionados.length === 0}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-5 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiCalendar className="w-5 h-5" />
                Agendar
              </button>
            </div>
          </div>

          {/* Right Panel - WhatsApp Preview */}
          <div className="xl:w-[360px] flex-shrink-0">
            <div className="sticky top-24">
              <WhatsAppPreview
                mensagem={gerarMensagem()}
                nomeRemetente="LIAMED"
              />
            </div>
          </div>
        </div>

        {/* Modal de variacoes */}
        {showAmostras && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiShield className="text-green-600" />
                    Variacoes da Mensagem
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Cada medico recebera uma versao parecida com estas — mesmo significado, palavras diferentes
                  </p>
                </div>
                <button onClick={() => setShowAmostras(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amostras.map((msg, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
                      <div className="absolute top-3 right-3 text-xs font-mono text-gray-400">
                        #{i + 1}
                      </div>
                      <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed pr-8">
                        {msg}
                      </pre>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <FiShield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    A variacao usa sinonimos, emojis e ordem alternativa para que o WhatsApp nao identifique o conteudo como spam em massa, mantendo o mesmo contexto e informacao da vaga.
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button onClick={() => setShowAmostras(false)} className="btn-secondary">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Agendamento */}
        {showAgendar && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiCalendar className="text-primary-600" /> Agendar Disparo
                </h3>
                <button onClick={() => setShowAgendar(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  O disparo sera executado automaticamente no horario escolhido para os <strong>{selecionados.length}</strong> medico{selecionados.length !== 1 ? 's' : ''} selecionado{selecionados.length !== 1 ? 's' : ''}.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data e hora</label>
                  <input
                    type="datetime-local"
                    value={agendamentoData}
                    onChange={e => setAgendamentoData(e.target.value)}
                    className="input-field"
                    min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  Horarios em silencio (definidos em Configuracoes) sao respeitados — o sistema espera o periodo permitido.
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setShowAgendar(false)} className="btn-secondary">Cancelar</button>
                <button onClick={handleAgendar} className="btn-primary flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" /> Confirmar agendamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
