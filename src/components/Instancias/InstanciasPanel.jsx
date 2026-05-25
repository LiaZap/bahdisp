import { useState, useEffect, useRef } from 'react'
import Header from '../Layout/Header'
import { instancesApi } from '../../services/api'
import toast from 'react-hot-toast'
import ConfirmModal from '../ui/ConfirmModal'
import {
  FiPlus, FiSmartphone, FiCheckCircle, FiXCircle, FiClock,
  FiTrash2, FiStar, FiRefreshCw, FiX, FiWifi, FiAlertCircle, FiLink, FiCopy
} from 'react-icons/fi'

const statusConfig = {
  conectado: { classes: 'bg-green-50 text-green-700 border-green-200', icon: FiCheckCircle, label: 'Conectado' },
  aguardando: { classes: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: FiClock, label: 'Aguardando QR' },
  pendente: { classes: 'bg-gray-50 text-gray-700 border-gray-200', icon: FiAlertCircle, label: 'Pendente' },
  desconectado: { classes: 'bg-red-50 text-red-700 border-red-200', icon: FiXCircle, label: 'Desconectado' },
}

export default function InstanciasPanel() {
  const [instances, setInstances] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', adminField01: '', adminField02: '', webhookUrl: '' })
  const [creating, setCreating] = useState(false)
  const [qrModal, setQrModal] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState(null)
  const [webhookModal, setWebhookModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const pollRef = useRef(null)

  // URL padrao do webhook (preenche automatico no form)
  const defaultWebhookUrl = `${window.location.origin}/api/webhooks/uazapi`

  async function fetchInstances() {
    try {
      const { data } = await instancesApi.list()
      setInstances(Array.isArray(data) ? data : [])
    } catch {
      setInstances([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInstances() }, [])

  // Cleanup poll on unmount
  useEffect(() => () => clearInterval(pollRef.current), [])

  function openCreateForm() {
    setForm({
      nome: '',
      adminField01: '',
      adminField02: '',
      webhookUrl: defaultWebhookUrl,
    })
    setShowForm(true)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.nome) return toast.error('Nome obrigatorio')
    setCreating(true)
    try {
      await instancesApi.create(form)
      toast.success('Instancia criada!')
      setShowForm(false)
      fetchInstances()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao criar')
    } finally {
      setCreating(false)
    }
  }

  async function openQrCode(instance) {
    setQrModal({ instance, qrcode: null, phone: instance.phone || '' })
    setQrError(null)
    setQrLoading(true)
    clearInterval(pollRef.current)

    try {
      const { data } = await instancesApi.connect(instance._id, instance.phone)
      const qrcode = data.qrcode || data.base64 || data.image || data?.instance?.qrcode

      if (data.connected || data.status === 'CONNECTED') {
        toast.success('Instancia ja conectada!')
        setQrModal(null)
        fetchInstances()
        return
      }

      if (qrcode) {
        setQrModal(prev => ({ ...prev, qrcode }))
        // Inicia polling para detectar quando conectar
        pollRef.current = setInterval(async () => {
          try {
            const { data: status } = await instancesApi.status(instance._id)
            if (status.connected || status.status === 'CONNECTED' || status.dbStatus === 'conectado') {
              toast.success('🎉 WhatsApp conectado!')
              clearInterval(pollRef.current)
              setQrModal(null)
              fetchInstances()
            }
          } catch { /* ignora erros de polling */ }
        }, 3000)
      } else {
        setQrError('A Uazapi nao retornou QR Code. Verifique o painel da Uazapi diretamente, ou tente recriar a instancia.')
        console.log('Uazapi response:', data)
      }
    } catch (err) {
      setQrError(err.response?.data?.message || err.message || 'Erro desconhecido')
    } finally {
      setQrLoading(false)
    }
  }

  function closeQr() {
    clearInterval(pollRef.current)
    setQrModal(null)
    setQrError(null)
  }

  async function checkStatus(instance) {
    try {
      const { data } = await instancesApi.status(instance._id)
      const conn = data.connected || data.status === 'CONNECTED'
      toast.success(conn ? 'Conectada!' : `Status: ${data.dbStatus || 'desconhecido'}`)
      fetchInstances()
    } catch {
      toast.error('Erro ao verificar status')
    }
  }

  async function setAsDefault(instance) {
    try {
      await instancesApi.setDefault(instance._id)
      toast.success(`"${instance.nome}" definida como padrao`)
      fetchInstances()
    } catch {
      toast.error('Erro ao definir padrao')
    }
  }

  function openWebhook(instance) {
    setWebhookModal({
      instance,
      url: instance.webhookUrl || defaultWebhookUrl,
      saving: false,
    })
  }

  async function saveWebhook() {
    if (!webhookModal?.url) return toast.error('URL obrigatoria')
    setWebhookModal(prev => ({ ...prev, saving: true }))
    try {
      await instancesApi.setWebhook(webhookModal.instance._id, webhookModal.url)
      toast.success('Webhook configurado!')
      setWebhookModal(null)
      fetchInstances()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao configurar webhook')
      setWebhookModal(prev => ({ ...prev, saving: false }))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await instancesApi.delete(deleteTarget._id)
      toast.success('Instancia removida')
      fetchInstances()
    } catch {
      toast.error('Erro ao remover')
    }
    setDeleteTarget(null)
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  return (
    <div>
      <Header title="Instancias WhatsApp" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Gerenciar numeros conectados</h3>
            <p className="text-sm text-gray-500">Adicione multiplas instancias para usar varios numeros</p>
          </div>
          <button onClick={openCreateForm} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Nova Instancia
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && instances.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiSmartphone className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Nenhuma instancia criada</h3>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-sm">
              Crie sua primeira instancia para conectar um numero do WhatsApp
            </p>
            <button onClick={openCreateForm} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Criar primeira instancia
            </button>
          </div>
        )}

        {!loading && instances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map(inst => {
              const cfg = statusConfig[inst.status] || statusConfig.pendente
              const StatusIcon = cfg.icon
              return (
                <div key={inst._id} className={`card relative ${inst.padrao ? 'border-2 border-primary-400' : ''}`}>
                  {inst.padrao && (
                    <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FiStar className="w-3 h-3 fill-white" /> PADRAO
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-whatsapp/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiSmartphone className="w-5 h-5 text-whatsapp" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 truncate">{inst.nome}</h4>
                      <p className="text-xs text-gray-500 truncate">
                        {inst.phone || 'Sem numero conectado'}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 w-fit border ${cfg.classes}`}>
                    <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
                  </div>

                  <div className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded mb-2">
                    Token: {inst.token}
                  </div>

                  {inst.webhookUrl && (
                    <div className="text-[11px] text-gray-500 flex items-center gap-1 mb-3 truncate">
                      <FiLink className="w-3 h-3 flex-shrink-0 text-green-600" />
                      <span className="truncate" title={inst.webhookUrl}>{inst.webhookUrl}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openQrCode(inst)}
                      className="text-xs font-medium text-whatsapp bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <FiWifi className="w-3.5 h-3.5" /> Conectar
                    </button>
                    <button
                      onClick={() => checkStatus(inst)}
                      className="text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <FiRefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openWebhook(inst)}
                      className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <FiLink className="w-3.5 h-3.5" /> Webhook
                    </button>
                    {!inst.padrao && (
                      <button
                        onClick={() => setAsDefault(inst)}
                        className="text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <FiStar className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(inst)}
                      className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 ml-auto"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
                <h3 className="text-lg font-bold text-gray-900">Nova Instancia</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da instancia *</label>
                  <input
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="input-field"
                    placeholder="Ex: comercial-sp"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Identificador unico (sem espacos)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <FiLink className="w-3.5 h-3.5" /> URL do Webhook
                  </label>
                  <input
                    value={form.webhookUrl}
                    onChange={e => setForm({ ...form, webhookUrl: e.target.value })}
                    className="input-field text-sm font-mono"
                    placeholder={defaultWebhookUrl}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Recebe eventos de entrega, leitura e respostas. Deixe o padrao para usar este servidor.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metadado 1 (opcional)</label>
                  <input
                    value={form.adminField01}
                    onChange={e => setForm({ ...form, adminField01: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Filial Sao Paulo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metadado 2 (opcional)</label>
                  <input
                    value={form.adminField02}
                    onChange={e => setForm({ ...form, adminField02: e.target.value })}
                    className="input-field"
                    placeholder="Ex: Responsavel: Joao"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <strong>Apos criar</strong>, clique em "Conectar" no card da instancia para escanear o QR Code e parear o numero.
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" disabled={creating} className="btn-primary">
                    {creating ? 'Criando...' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {qrModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  Conectar: {qrModal.instance.nome}
                </h3>
                <button onClick={closeQr} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero do WhatsApp (opcional)</label>
                  <input
                    value={qrModal.phone}
                    onChange={e => setQrModal(p => ({ ...p, phone: e.target.value }))}
                    className="input-field"
                    placeholder="5511999999999"
                  />
                </div>

                {qrLoading && (
                  <div className="w-64 h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                )}

                {!qrLoading && qrModal.qrcode && (
                  <>
                    <div className="bg-white p-3 rounded-xl border-2 border-green-200">
                      <img
                        src={qrModal.qrcode.startsWith('data:') ? qrModal.qrcode : `data:image/png;base64,${qrModal.qrcode}`}
                        alt="QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Aguardando voce escanear...
                    </div>
                  </>
                )}

                {!qrLoading && !qrModal.qrcode && qrError && (
                  <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                    <p className="font-semibold mb-1">⚠ Erro ao gerar QR Code</p>
                    <p className="text-xs">{qrError}</p>
                  </div>
                )}

                {!qrLoading && !qrModal.qrcode && !qrError && (
                  <div className="w-64 h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 px-4 text-center">
                    <FiSmartphone className="w-10 h-10 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      Clique em "Gerar QR" para conectar este numero
                    </p>
                  </div>
                )}

                <button
                  onClick={() => openQrCode({ ...qrModal.instance, phone: qrModal.phone })}
                  disabled={qrLoading}
                  className="btn-whatsapp flex items-center gap-2"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  {qrModal.qrcode ? 'Atualizar QR Code' : 'Gerar QR Code'}
                </button>

                {qrModal.qrcode && (
                  <p className="text-xs text-gray-500 text-center max-w-xs">
                    WhatsApp &gt; Menu &gt; Dispositivos conectados &gt; Conectar dispositivo
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Webhook Modal */}
        {webhookModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiLink className="text-blue-600" /> Configurar Webhook
                </h3>
                <button onClick={() => setWebhookModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Instancia: <strong>{webhookModal.instance.nome}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL do webhook</label>
                  <div className="flex gap-2">
                    <input
                      value={webhookModal.url}
                      onChange={e => setWebhookModal(prev => ({ ...prev, url: e.target.value }))}
                      className="input-field flex-1 text-sm font-mono"
                      placeholder="https://seu-dominio.com/api/webhooks/uazapi"
                    />
                    <button
                      onClick={() => copyToClipboard(webhookModal.url)}
                      className="btn-secondary flex items-center gap-1"
                      title="Copiar"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWebhookModal(prev => ({ ...prev, url: defaultWebhookUrl }))}
                    className="text-xs text-primary-600 hover:underline mt-1"
                  >
                    Usar URL deste servidor
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
                  <p className="font-semibold">Eventos capturados:</p>
                  <ul className="list-disc list-inside text-blue-700">
                    <li>Entrega de mensagens</li>
                    <li>Leitura (visto)</li>
                    <li>Respostas dos contatos</li>
                    <li>Mudancas de conexao (online/offline)</li>
                    <li>Atualizacoes do QR Code</li>
                  </ul>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setWebhookModal(null)} className="btn-secondary">Cancelar</button>
                <button
                  onClick={saveWebhook}
                  disabled={webhookModal.saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {webhookModal.saving ? 'Salvando...' : 'Salvar webhook'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Remover instancia"
          message={`Remover "${deleteTarget?.nome}"? Esta acao desconecta o numero da Uazapi.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  )
}
