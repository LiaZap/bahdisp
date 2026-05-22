import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import toast from 'react-hot-toast'
import { medicosApi } from '../../services/api'
import ConfirmModal from '../ui/ConfirmModal'
import { ESPECIALIDADES } from '../../constants/specialties'
import Papa from 'papaparse'
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone,
  FiUser, FiX, FiCheck, FiUpload, FiUsers
} from 'react-icons/fi'

export default function MedicoList() {
  const [medicos, setMedicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nome: '', crm: '', especialidade: '', whatsapp: '', cidade: '', tags: '' })
  const [filtroTag, setFiltroTag] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function fetchMedicos() {
    try {
      const { data } = await medicosApi.list()
      setMedicos(Array.isArray(data) ? data : [])
    } catch {
      setMedicos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMedicos() }, [])

  const filtrados = medicos.filter(m => {
    const matchBusca =
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.especialidade.toLowerCase().includes(busca.toLowerCase()) ||
      m.crm.toLowerCase().includes(busca.toLowerCase())
    const matchTag = !filtroTag || (m.tags || []).includes(filtroTag)
    return matchBusca && matchTag
  })

  const todasTags = [...new Set(medicos.flatMap(m => m.tags || []))].sort()

  function openForm(medico) {
    if (medico) {
      setEditando(medico)
      setForm({
        nome: medico.nome,
        crm: medico.crm,
        especialidade: medico.especialidade,
        whatsapp: medico.whatsapp,
        cidade: medico.cidade,
        tags: (medico.tags || []).join(', '),
      })
    } else {
      setEditando(null)
      setForm({ nome: '', crm: '', especialidade: '', whatsapp: '', cidade: '', tags: '' })
    }
    setShowForm(true)
  }

  function parseFormPayload() {
    const tags = (form.tags || '')
      .split(',').map(t => t.trim()).filter(Boolean)
    return { ...form, tags }
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = parseFormPayload()
    try {
      if (editando) {
        await medicosApi.update(editando._id, payload)
        toast.success('Medico atualizado!')
      } else {
        await medicosApi.create(payload)
        toast.success('Medico cadastrado!')
      }
      fetchMedicos()
    } catch {
      toast.error('Erro ao salvar medico')
    }
    setShowForm(false)
  }

  async function toggleAtivo(medico) {
    try {
      await medicosApi.update(medico._id, { ativo: !medico.ativo })
      fetchMedicos()
    } catch {
      setMedicos(prev => prev.map(m => m._id === medico._id ? { ...m, ativo: !m.ativo } : m))
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    try {
      await medicosApi.delete(deleteTarget._id)
      toast.success('Medico removido!')
    } catch {
      toast.error('Erro ao remover medico')
    }
    setDeleteTarget(null)
    fetchMedicos()
  }

  function handleCSVImport(e) {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        let count = 0
        for (const row of data) {
          try {
            await medicosApi.create({
              nome: row.nome || row.Nome,
              crm: row.crm || row.CRM,
              especialidade: row.especialidade || row.Especialidade || 'Clinico Geral',
              whatsapp: row.whatsapp || row.WhatsApp || row.telefone || row.Telefone,
              cidade: row.cidade || row.Cidade || '',
            })
            count++
          } catch { /* skip duplicates */ }
        }
        toast.success(`${count} medicos importados!`)
        fetchMedicos()
      }
    })
    e.target.value = ''
  }

  function formatWhatsapp(num) {
    if (!num) return ''
    return num.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 ($1) $2-$3')
  }

  if (!loading && medicos.length === 0 && !showForm) {
    return (
      <div>
        <Header title="Cadastro de Medicos" />
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <FiUsers className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Nenhum medico cadastrado</h3>
            <p className="text-sm text-gray-400 mb-6 text-center max-w-sm">
              Cadastre seu primeiro medico ou importe uma lista via CSV
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button onClick={() => openForm(null)} className="btn-primary flex items-center gap-2">
                <FiPlus className="w-4 h-4" /> Novo Medico
              </button>
              <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" id="csv-import" />
              <label htmlFor="csv-import" className="btn-secondary flex items-center gap-2 cursor-pointer">
                <FiUpload className="w-4 h-4" /> Importar CSV
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Formato CSV: nome, crm, especialidade, whatsapp, cidade
            </p>
          </div>
        </div>
      </div>
    )
  }

  function renderFormFields() {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="input-field" placeholder="Dr(a). Nome Completo" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CRM</label>
            <input value={form.crm} onChange={e => setForm({...form, crm: e.target.value})} className="input-field" placeholder="CRM/UF 000000" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
            <select value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})} className="input-field" required>
              <option value="">Selecione...</option>
              {ESPECIALIDADES.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className="input-field" placeholder="5511999999999" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} className="input-field" placeholder="Sao Paulo" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por virgula)</label>
          <input
            value={form.tags}
            onChange={e => setForm({...form, tags: e.target.value})}
            className="input-field"
            placeholder="UTI, plantonista, fim de semana"
          />
          <p className="text-xs text-gray-400 mt-1">Use para agrupar medicos (ex: "UTI plantonistas SP")</p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          <button type="submit" className="btn-primary">{editando ? 'Salvar' : 'Cadastrar'}</button>
        </div>
      </>
    )
  }

  return (
    <div>
      <Header title="Cadastro de Medicos" />
      <div className="p-6 space-y-5">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} className="input-field pl-10" placeholder="Buscar medicos..." />
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" id="csv-import" />
            <label htmlFor="csv-import" className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
              <FiUpload className="w-4 h-4" /> Importar CSV
            </label>
            <button onClick={() => openForm(null)} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Novo Medico
            </button>
          </div>
        </div>

        {/* Tag filters */}
        {todasTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Filtrar por tag:</span>
            <button
              onClick={() => setFiltroTag('')}
              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                !filtroTag ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {todasTags.map(t => (
              <button
                key={t}
                onClick={() => setFiltroTag(filtroTag === t ? '' : t)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  filtroTag === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-blue-700">{medicos.length}</p>
            <p className="text-xs text-blue-600 font-medium">Total cadastrados</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-green-700">{medicos.filter(m => m.ativo).length}</p>
            <p className="text-xs text-green-600 font-medium">Ativos</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-gray-700">{medicos.filter(m => !m.ativo).length}</p>
            <p className="text-xs text-gray-600 font-medium">Inativos</p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Medico</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">CRM</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Especialidade</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">WhatsApp</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtrados.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{m.nome}</p>
                            <p className="text-xs text-gray-500">{m.cidade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{m.crm}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">{m.especialidade}</span>
                          {(m.tags || []).map(t => (
                            <span key={t} className="text-[10px] font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-gray-600">
                          <FiPhone className="w-3.5 h-3.5 text-whatsapp" />
                          {formatWhatsapp(m.whatsapp)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleAtivo(m)} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          m.ativo ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                          {m.ativo ? <><FiCheck className="w-3 h-3" /> Ativo</> : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openForm(m)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(m)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty search results */}
        {!loading && medicos.length > 0 && filtrados.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FiSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum medico encontrado para "{busca}"</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editando ? 'Editar Medico' : 'Novo Medico'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FiX className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {renderFormFields()}
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Excluir medico"
          message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  )
}
