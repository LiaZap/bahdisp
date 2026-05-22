import { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { ESPECIALIDADES } from '../../constants/specialties'

export default function VagaForm({ vaga, onSave, onClose }) {
  const [form, setForm] = useState(vaga || {
    titulo: '', especialidade: '', local: '', endereco: '',
    data: '', horarioInicio: '', horarioFim: '',
    valor: '', descricao: '', urgente: false
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {vaga ? 'Editar Vaga' : 'Nova Vaga'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titulo da vaga</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} className="input-field" placeholder="Ex: Plantao UTI Adulto" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
              <select name="especialidade" value={form.especialidade} onChange={handleChange} className="input-field" required>
                <option value="">Selecione...</option>
                {ESPECIALIDADES.map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
              <input name="local" value={form.local} onChange={handleChange} className="input-field" placeholder="Nome do hospital/clinica" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereco</label>
              <input name="endereco" value={form.endereco} onChange={handleChange} className="input-field" placeholder="Endereco completo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input type="date" name="data" value={form.data} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input type="number" name="valor" value={form.valor} onChange={handleChange} className="input-field" placeholder="0,00" step="0.01" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horario inicio</label>
              <input type="time" name="horarioInicio" value={form.horarioInicio} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horario fim</label>
              <input type="time" name="horarioFim" value={form.horarioFim} onChange={handleChange} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} className="input-field min-h-[80px]" placeholder="Detalhes adicionais..." />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="urgente" checked={form.urgente} onChange={handleChange} className="rounded border-gray-300 text-red-500 focus:ring-red-500" />
                <span className="text-sm font-medium text-gray-700">Vaga urgente</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">
              {vaga ? 'Salvar alteracoes' : 'Criar vaga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
