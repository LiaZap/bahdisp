import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import WhatsAppPreview from './WhatsAppPreview'
import toast from 'react-hot-toast'
import { disparosApi, instancesApi } from '../../services/api'
import {
  FiSend, FiPhone, FiMessageSquare, FiShield, FiSmartphone,
  FiAlertCircle, FiCheckCircle, FiXCircle, FiClock
} from 'react-icons/fi'

const statusIcons = {
  conectado: { icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  aguardando: { icon: FiClock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  desconectado: { icon: FiXCircle, color: 'text-red-600', bg: 'bg-red-100' },
  pendente: { icon: FiAlertCircle, color: 'text-gray-500', bg: 'bg-gray-100' },
}

export default function DisparoPanel() {
  const [numeros, setNumeros] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [antiBlock, setAntiBlock] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [instances, setInstances] = useState([])
  const [instanciaSelecionada, setInstanciaSelecionada] = useState('')
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    instancesApi.list()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : []
        setInstances(list)
        const padrao = list.find(i => i.padrao && i.status === 'conectado')
          || list.find(i => i.padrao)
          || list.find(i => i.status === 'conectado')
          || list[0]
        if (padrao) setInstanciaSelecionada(padrao._id)
      })
      .catch(() => { /* sem instâncias é ok */ })
  }, [])

  // Parse números: aceita vírgula, espaço, ponto-e-vírgula ou quebra de linha
  const numerosArray = numeros
    .split(/[\n,;]+/)
    .map(n => n.trim())
    .filter(Boolean)

  const numerosValidos = numerosArray.filter(n => n.replace(/\D/g, '').length >= 10)
  const instanciaAtual = instances.find(i => i._id === instanciaSelecionada)

  async function handleDisparar() {
    if (numerosValidos.length === 0) {
      return toast.error('Adicione ao menos um número válido')
    }
    if (!mensagem.trim()) {
      return toast.error('Escreva uma mensagem')
    }
    if (instanciaAtual && instanciaAtual.status !== 'conectado') {
      const ok = window.confirm(`A instância "${instanciaAtual.nome}" não está conectada. Disparar mesmo assim?`)
      if (!ok) return
    }

    setEnviando(true)
    setResultado(null)
    try {
      const { data } = await disparosApi.enviarSimples({
        phones: numerosValidos,
        mensagem,
        antiBlock,
        instanceId: instanciaSelecionada || undefined,
      })
      setResultado(data)
      toast.success(`${data.enviados} de ${data.total} enviado(s)!`)
      if (data.enviados === data.total) {
        setNumeros('')
        setMensagem('')
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'QUIET_HOURS') {
        const q = err.response.data.quietHours
        toast.error(`Horário de silêncio ativo (${q.inicio}h–${q.fim}h)`, { duration: 5000 })
      } else {
        toast.error(err.response?.data?.message || 'Erro ao disparar')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <Header title="Disparos" />
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* Form */}
          <div className="card space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Enviar mensagem</h3>
              <p className="text-sm text-gray-500">Cole os números, escreva a mensagem e dispare</p>
            </div>

            {/* Seletor de Instância */}
            {instances.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiSmartphone className="w-4 h-4 text-gray-400" />
                  Enviar a partir de
                  {instanciaAtual?.status === 'conectado' && (
                    <span className="text-xs font-normal text-green-600 ml-auto flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Conectado
                    </span>
                  )}
                </label>
                {instances.length <= 3 ? (
                  // Visual de cards quando há poucas instâncias
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {instances.map(i => {
                      const cfg = statusIcons[i.status] || statusIcons.pendente
                      const Icon = cfg.icon
                      const selecionada = instanciaSelecionada === i._id
                      return (
                        <button
                          key={i._id}
                          type="button"
                          onClick={() => setInstanciaSelecionada(i._id)}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${
                            selecionada
                              ? 'border-primary-500 bg-primary-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            {i.padrao && (
                              <span className="text-[9px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded">
                                PADRÃO
                              </span>
                            )}
                          </div>
                          <p className={`text-sm font-semibold truncate ${selecionada ? 'text-primary-700' : 'text-gray-900'}`}>
                            {i.nome}
                          </p>
                          <p className="text-xs text-gray-500 truncate font-mono">
                            {i.phone || 'sem número'}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  // Dropdown quando há muitas instâncias
                  <select
                    value={instanciaSelecionada}
                    onChange={e => setInstanciaSelecionada(e.target.value)}
                    className="input-field"
                  >
                    {instances.map(i => (
                      <option key={i._id} value={i._id}>
                        {i.nome} {i.phone ? `· ${i.phone}` : ''} {i.status === 'conectado' ? '✓' : '⚠'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Nenhuma instância configurada. Vá em <strong>Instâncias</strong> para conectar um número antes de disparar.
                </p>
              </div>
            )}

            {/* Números */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                Número(s) de WhatsApp
                {numerosValidos.length > 0 && (
                  <span className="text-xs font-normal text-green-600 ml-auto">
                    {numerosValidos.length} válido{numerosValidos.length !== 1 ? 's' : ''}
                  </span>
                )}
              </label>
              <textarea
                value={numeros}
                onChange={e => setNumeros(e.target.value)}
                className="input-field min-h-[80px] font-mono text-sm resize-y"
                placeholder={'5511999999999\n5511988888888\n5511977777777'}
              />
              <p className="text-xs text-gray-400 mt-1">
                Um por linha, ou separados por vírgula. Formato: 55 + DDD + número (ex: 5511999999999)
              </p>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-gray-400" />
                Mensagem
                <span className="text-xs font-normal text-gray-400 ml-auto">
                  {mensagem.length} caracteres
                </span>
              </label>
              <textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                className="input-field min-h-[160px] resize-y"
                placeholder="Escreva sua mensagem aqui..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Use *negrito*, _itálico_ e emojis para formatar
              </p>
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
                      Proteção Anti-Bloqueio
                    </p>
                    <p className={`text-xs ${antiBlock ? 'text-green-600' : 'text-gray-500'}`}>
                      Cada número recebe uma variação + delay aleatório entre envios
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAntiBlock(!antiBlock)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${
                    antiBlock ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                    antiBlock ? 'left-[26px]' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Resultado do último disparo */}
            {resultado && (
              <div className={`border rounded-xl p-4 ${
                resultado.erros > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <FiAlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    resultado.erros > 0 ? 'text-amber-600' : 'text-green-600'
                  }`} />
                  <div className="flex-1 text-sm">
                    <p className={`font-semibold ${resultado.erros > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                      Protocolo: <span className="font-mono">{resultado.protocolo}</span>
                    </p>
                    <p className={`text-xs mt-1 ${resultado.erros > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                      {resultado.enviados} enviado{resultado.enviados !== 1 ? 's' : ''} •
                      {' '}{resultado.erros} erro{resultado.erros !== 1 ? 's' : ''} •
                      {' '}Instância: {resultado.instancia}
                    </p>
                  </div>
                  <button
                    onClick={() => setResultado(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    fechar
                  </button>
                </div>
              </div>
            )}

            {/* Botão */}
            <button
              onClick={handleDisparar}
              disabled={enviando || numerosValidos.length === 0 || !mensagem.trim()}
              className="w-full btn-whatsapp flex items-center justify-center gap-3 py-4 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Disparando para {numerosValidos.length} número{numerosValidos.length !== 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  Disparar para {numerosValidos.length} número{numerosValidos.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          {/* Preview WhatsApp */}
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <WhatsAppPreview
                mensagem={mensagem || 'Sua mensagem aparecerá aqui...'}
                nomeRemetente="bah!"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
