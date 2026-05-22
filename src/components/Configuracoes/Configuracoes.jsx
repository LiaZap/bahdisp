import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import toast from 'react-hot-toast'
import api, { settingsApi } from '../../services/api'
import { FiSave, FiRefreshCw, FiLink, FiKey, FiServer, FiMessageSquare, FiSmartphone, FiCheckCircle, FiXCircle, FiMoon } from 'react-icons/fi'

export default function Configuracoes() {
  const [config, setConfig] = useState({
    uazapiUrl: 'https://liaautomacoes.uazapi.com',
    uazapiToken: '',
    nomeRemetente: 'bah!',
    intervaloMin: 3,
    intervaloMax: 12,
    maxDisparosDia: 500,
  })
  const [testando, setTestando] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState(null)
  const [quietHours, setQuietHours] = useState({ enabled: true, inicio: 22, fim: 7 })
  const [savingQuiet, setSavingQuiet] = useState(false)

  useEffect(() => {
    settingsApi.quietHours()
      .then(({ data }) => setQuietHours(data))
      .catch(() => { /* keep default */ })
  }, [])

  async function handleSaveQuietHours() {
    setSavingQuiet(true)
    try {
      await settingsApi.saveQuietHours(quietHours)
      toast.success('Horario de silencio salvo!')
    } catch {
      toast.error('Erro ao salvar (backend offline?)')
    } finally {
      setSavingQuiet(false)
    }
  }

  function handleChange(e) {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  async function handleSave(e) {
    e.preventDefault()
    toast.success('Configurações salvas!')
  }

  async function testarConexao() {
    setTestando(true)
    try {
      const { data } = await api.post('/uazapi/test')
      if (data.connected) {
        toast.success('Conexão com a Uazapi estabelecida!')
        setWhatsappStatus('connected')
      }
    } catch {
      toast.error('Falha na conexão com a Uazapi')
      setWhatsappStatus('disconnected')
    } finally {
      setTestando(false)
    }
  }

  async function gerarQrCode() {
    setQrLoading(true)
    setQrCode(null)
    try {
      const { data } = await api.post('/uazapi/qrcode')
      if (data.qrcode) {
        setQrCode(data.qrcode)
        toast.success('QR Code gerado! Escaneie com o WhatsApp.')
      } else if (data.connected || data.status === 'CONNECTED') {
        setWhatsappStatus('connected')
        toast.success('WhatsApp já está conectado!')
      } else {
        setQrCode(data.qrcode || data.base64 || data.image || null)
        if (!data.qrcode && !data.base64 && !data.image) {
          toast('Resposta recebida. Verifique o painel da Uazapi.', { icon: 'ℹ️' })
        }
      }
    } catch {
      toast.error('Erro ao gerar QR Code')
    } finally {
      setQrLoading(false)
    }
  }

  return (
    <div>
      <Header title="Configurações" />
      <div className="p-6 max-w-3xl space-y-6">
        {/* WhatsApp Connection */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FiSmartphone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Conexão WhatsApp</h3>
              <p className="text-sm text-gray-500">Conecte sua instância escaneando o QR Code</p>
            </div>
            {whatsappStatus && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                whatsappStatus === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {whatsappStatus === 'connected'
                  ? <><FiCheckCircle className="w-3.5 h-3.5" /> Conectado</>
                  : <><FiXCircle className="w-3.5 h-3.5" /> Desconectado</>
                }
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            {qrCode ? (
              <div className="bg-white p-4 rounded-xl border-2 border-green-200 shadow-sm">
                <img
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3">
                <FiSmartphone className="w-10 h-10 text-gray-300" />
                <p className="text-sm text-gray-400 text-center px-4">
                  Clique para gerar o QR Code e conectar o WhatsApp
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={gerarQrCode}
                disabled={qrLoading}
                className="btn-whatsapp flex items-center gap-2 px-6"
              >
                {qrLoading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <FiRefreshCw className="w-4 h-4" />
                }
                {qrCode ? 'Atualizar QR Code' : 'Gerar QR Code'}
              </button>
              <button
                type="button"
                onClick={testarConexao}
                disabled={testando}
                className="btn-secondary flex items-center gap-2"
              >
                {testando
                  ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                  : <FiCheckCircle className="w-4 h-4" />
                }
                Verificar Status
              </button>
            </div>

            {qrCode && (
              <p className="text-xs text-gray-500 text-center">
                Abra o WhatsApp no celular &gt; Menu &gt; Dispositivos conectados &gt; Conectar dispositivo
              </p>
            )}
          </div>
        </div>

        {/* API Settings */}
        <form onSubmit={handleSave} className="card space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <FiServer className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Configuração da API Uazapi</h3>
              <p className="text-sm text-gray-500">Configure a conexão com o WhatsApp</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da API</label>
            <div className="relative">
              <FiLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input name="uazapiUrl" value={config.uazapiUrl} onChange={handleChange} className="input-field pl-10" placeholder="https://liaautomacoes.uazapi.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token de acesso</label>
            <div className="relative">
              <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input name="uazapiToken" type="password" value={config.uazapiToken} onChange={handleChange} className="input-field pl-10" placeholder="Seu token da Uazapi" />
            </div>
          </div>
        </form>

        {/* Dispatch Settings */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FiMessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Configuração de Envio</h3>
              <p className="text-sm text-gray-500">Ajuste os parâmetros de disparo</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do remetente</label>
            <input name="nomeRemetente" value={config.nomeRemetente} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo aleatório entre envios (segundos)</label>
            <div className="grid grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                <input type="number" name="intervaloMin" value={config.intervaloMin} onChange={handleChange} className="input-field" min="1" max="120" />
              </div>
              <div className="flex items-end justify-center pb-2">
                <span className="text-sm text-gray-400 font-medium">até</span>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                <input type="number" name="intervaloMax" value={config.intervaloMax} onChange={handleChange} className="input-field" min="1" max="120" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Cada envio terá um delay aleatório entre {config.intervaloMin}s e {config.intervaloMax}s para evitar bloqueios</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de disparos/dia</label>
            <input type="number" name="maxDisparosDia" value={config.maxDisparosDia} onChange={handleChange} className="input-field" min="1" />
          </div>

          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <FiSave className="w-4 h-4" /> Salvar Configurações
          </button>
        </div>

        {/* Quiet Hours */}
        <div className="card space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FiMoon className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Horário de silêncio</h3>
              <p className="text-sm text-gray-500">Bloqueia disparos automáticos em horários inadequados (LGPD)</p>
            </div>
            <button
              onClick={() => setQuietHours(q => ({ ...q, enabled: !q.enabled }))}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                quietHours.enabled ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                quietHours.enabled ? 'left-[26px]' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Início (h)</label>
              <input
                type="number" min="0" max="23"
                value={quietHours.inicio}
                onChange={e => setQuietHours(q => ({ ...q, inicio: Number(e.target.value) }))}
                disabled={!quietHours.enabled}
                className="input-field disabled:opacity-50"
              />
            </div>
            <div className="flex items-end justify-center pb-2">
              <span className="text-sm text-gray-400">até</span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fim (h)</label>
              <input
                type="number" min="0" max="23"
                value={quietHours.fim}
                onChange={e => setQuietHours(q => ({ ...q, fim: Number(e.target.value) }))}
                disabled={!quietHours.enabled}
                className="input-field disabled:opacity-50"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {quietHours.enabled
              ? `Disparos serão bloqueados das ${quietHours.inicio}h às ${quietHours.fim}h.`
              : 'Disparos permitidos em qualquer horário.'}
          </p>
          <button onClick={handleSaveQuietHours} disabled={savingQuiet} className="btn-primary flex items-center gap-2">
            <FiSave className="w-4 h-4" /> {savingQuiet ? 'Salvando...' : 'Salvar horário de silêncio'}
          </button>
        </div>
      </div>
    </div>
  )
}
