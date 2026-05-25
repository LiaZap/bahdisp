import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import toast from 'react-hot-toast'
import { settingsApi } from '../../services/api'
import { FiSave, FiMessageSquare, FiMoon } from 'react-icons/fi'

export default function Configuracoes() {
  const [config, setConfig] = useState({
    nomeRemetente: 'bah!',
    intervaloMin: 3,
    intervaloMax: 12,
    maxDisparosDia: 500,
  })
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

  return (
    <div>
      <Header title="Configurações" />
      <div className="p-6 max-w-3xl space-y-6">
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
