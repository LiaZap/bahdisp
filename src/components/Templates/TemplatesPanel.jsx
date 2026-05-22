import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import { templatesApi } from '../../services/api'
import ConfirmModal from '../ui/ConfirmModal'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiFileText, FiInfo } from 'react-icons/fi'

const placeholders = [
  { tag: '{{titulo}}', desc: 'Titulo da vaga' },
  { tag: '{{local}}', desc: 'Local/Hospital' },
  { tag: '{{data}}', desc: 'Data formatada' },
  { tag: '{{valor}}', desc: 'Valor em R$' },
  { tag: '{{horario}}', desc: 'Horario do plantao' },
  { tag: '{{medico}}', desc: 'Nome do medico' },
]

export default function TemplatesPanel() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nome: '', descricao: '', conteudo: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function fetchTemplates() {
    try {
      const { data } = await templatesApi.list()
      setTemplates(Array.isArray(data) ? data : [])
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  function openForm(t) {
    if (t) {
      setEditando(t)
      setForm({ nome: t.nome, descricao: t.descricao || '', conteudo: t.conteudo })
    } else {
      setEditando(null)
      setForm({ nome: '', descricao: '', conteudo: '' })
    }
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      if (editando) {
        await templatesApi.update(editando._id, form)
        toast.success('Template atualizado!')
      } else {
        await templatesApi.create(form)
        toast.success('Template criado!')
      }
      fetchTemplates()
      setShowForm(false)
    } catch {
      toast.error('Erro ao salvar template')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await templatesApi.delete(deleteTarget._id)
      toast.success('Template removido')
      fetchTemplates()
    } catch {
      toast.error('Erro ao remover')
    }
    setDeleteTarget(null)
  }

  function insertPlaceholder(tag) {
    setForm(f => ({ ...f, conteudo: (f.conteudo || '') + tag }))
  }

  return (
    <div>
      <Header title="Templates de Mensagens" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Modelos personalizados</h3>
            <p className="text-sm text-gray-500">Crie modelos de mensagem para reutilizar nos disparos</p>
          </div>
          <button onClick={() => openForm(null)} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Novo Template
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <FiFileText className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">Nenhum template criado</h3>
            <p className="text-sm text-gray-400 mb-6">Crie modelos personalizados de mensagem</p>
            <button onClick={() => openForm(null)} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" /> Criar primeiro template
            </button>
          </div>
        )}

        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t._id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{t.nome}</h4>
                    {t.descricao && <p className="text-xs text-gray-500 mt-0.5">{t.descricao}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openForm(t)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 border border-gray-100 rounded p-3 leading-relaxed line-clamp-6">
                  {t.conteudo}
                </pre>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{editando ? 'Editar Template' : 'Novo Template'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="input-field" placeholder="Ex: Vaga premium" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descricao (opcional)</label>
                  <input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="input-field" placeholder="Para vagas com pagamento alto" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conteudo</label>
                  <textarea
                    value={form.conteudo}
                    onChange={e => setForm({ ...form, conteudo: e.target.value })}
                    className="input-field min-h-[160px] font-mono text-xs"
                    placeholder="*Nova vaga!* {{titulo}} em {{local}} ..."
                    required
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 flex items-center gap-1.5 mb-2">
                    <FiInfo className="w-3.5 h-3.5" /> Placeholders disponiveis (clique para inserir):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {placeholders.map(p => (
                      <button
                        key={p.tag}
                        type="button"
                        onClick={() => insertPlaceholder(p.tag)}
                        className="text-[11px] font-mono bg-white border border-blue-300 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                        title={p.desc}
                      >
                        {p.tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">{editando ? 'Salvar' : 'Criar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Remover template"
          message={`Remover "${deleteTarget?.nome}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  )
}
