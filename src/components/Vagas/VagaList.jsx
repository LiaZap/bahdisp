import { useState, useEffect } from 'react'
import Header from '../Layout/Header'
import VagaForm from './VagaForm'
import toast from 'react-hot-toast'
import { vagasApi } from '../../services/api'
import ConfirmModal from '../ui/ConfirmModal'
import EmptyState from '../ui/EmptyState'
import {
  FiPlus, FiEdit2, FiTrash2, FiSend, FiClock,
  FiMapPin, FiDollarSign, FiAlertTriangle, FiSearch, FiBriefcase
} from 'react-icons/fi'

export default function VagaList() {
  const [vagas, setVagas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busca, setBusca] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function fetchVagas() {
    try {
      const { data } = await vagasApi.list()
      setVagas(Array.isArray(data) ? data : [])
    } catch {
      setVagas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVagas() }, [])

  const vagasFiltradas = vagas.filter(v =>
    v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    v.local.toLowerCase().includes(busca.toLowerCase()) ||
    v.especialidade.toLowerCase().includes(busca.toLowerCase())
  )

  async function handleSave(data) {
    try {
      if (editando) {
        await vagasApi.update(editando._id, data)
        toast.success('Vaga atualizada!')
      } else {
        await vagasApi.create(data)
        toast.success('Vaga criada!')
      }
      fetchVagas()
    } catch {
      toast.error('Erro ao salvar vaga')
    }
    setShowForm(false)
    setEditando(null)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    try {
      await vagasApi.delete(deleteTarget._id)
      toast.success('Vaga removida!')
    } catch {
      toast.error('Erro ao remover vaga')
    }
    setDeleteTarget(null)
    fetchVagas()
  }

  if (!loading && vagas.length === 0 && !showForm) {
    return (
      <div>
        <Header title="Gerenciamento de Vagas" />
        <div className="p-6">
          <EmptyState
            icon={FiBriefcase}
            title="Nenhuma vaga cadastrada"
            description="Crie sua primeira vaga para comecar a disparar"
            action="Nova Vaga"
            onAction={() => setShowForm(true)}
          />
          {showForm && (
            <VagaForm
              vaga={editando}
              onSave={handleSave}
              onClose={() => { setShowForm(false); setEditando(null) }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Gerenciamento de Vagas" />
      <div className="p-6 space-y-5">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-field pl-10"
              placeholder="Buscar vagas..."
            />
          </div>
          <button onClick={() => { setEditando(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Nova Vaga
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-blue-700">{vagas.length}</p>
            <p className="text-xs text-blue-600 font-medium">Total de vagas</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-green-700">{vagas.filter(v => v.status === 'aberta').length}</p>
            <p className="text-xs text-green-600 font-medium">Abertas</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-gray-700">{vagas.filter(v => v.status === 'preenchida').length}</p>
            <p className="text-xs text-gray-600 font-medium">Preenchidas</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-red-700">{vagas.filter(v => v.urgente).length}</p>
            <p className="text-xs text-red-600 font-medium">Urgentes</p>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Vagas Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vagasFiltradas.map((vaga) => (
              <div key={vaga._id} className={`card hover:shadow-md transition-shadow ${vaga.urgente ? 'border-l-4 border-l-red-500' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {vaga.urgente && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <FiAlertTriangle className="w-3 h-3" /> URGENTE
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        vaga.status === 'aberta' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {vaga.status === 'aberta' ? 'Aberta' : 'Preenchida'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900">{vaga.titulo}</h4>
                    <p className="text-sm text-gray-500">{vaga.especialidade}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <FiMapPin className="w-3.5 h-3.5 text-gray-400" /> {vaga.local}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <FiClock className="w-3.5 h-3.5 text-gray-400" /> {vaga.horarioInicio} - {vaga.horarioFim}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <FiDollarSign className="w-3.5 h-3.5 text-gray-400" /> R$ {Number(vaga.valor).toLocaleString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <FiSend className="w-3.5 h-3.5 text-gray-400" /> {vaga.disparos || 0} disparos
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setEditando(vaga); setShowForm(true) }}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => setDeleteTarget(vaga)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                  {vaga.status === 'aberta' && (
                    <button className="ml-auto flex items-center gap-1.5 text-sm text-whatsapp font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                      <FiSend className="w-3.5 h-3.5" /> Disparar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty search results */}
        {!loading && vagas.length > 0 && vagasFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FiSearch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma vaga encontrada para "{busca}"</p>
          </div>
        )}

        {showForm && (
          <VagaForm
            vaga={editando}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditando(null) }}
          />
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Excluir vaga"
          message={`Tem certeza que deseja excluir "${deleteTarget?.titulo}"?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  )
}
