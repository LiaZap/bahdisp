import { Router } from 'express'
import Medico from '../models/Medico.js'
import auth from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const { especialidade, ativo, tag } = req.query
    const filter = {}
    if (especialidade && typeof especialidade === 'string') filter.especialidade = especialidade
    if (ativo !== undefined) filter.ativo = ativo === 'true'
    if (tag && typeof tag === 'string') filter.tags = tag

    const medicos = await Medico.find(filter).sort({ nome: 1 })
    res.json(medicos)
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar médicos' })
  }
})

router.get('/tags', auth, async (req, res) => {
  try {
    const tags = await Medico.distinct('tags', { ativo: true })
    res.json(tags.filter(Boolean).sort())
  } catch {
    res.status(500).json({ message: 'Erro ao buscar tags' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { nome, crm, especialidade, whatsapp } = req.body
    if (!nome || typeof nome !== 'string' ||
        !crm || typeof crm !== 'string' ||
        !especialidade || typeof especialidade !== 'string' ||
        !whatsapp || typeof whatsapp !== 'string') {
      return res.status(400).json({ message: 'Campos obrigatórios: nome, crm, especialidade, whatsapp' })
    }

    const medico = await Medico.create(req.body)
    res.status(201).json(medico)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'CRM já cadastrado' })
    }
    res.status(500).json({ message: 'Erro ao cadastrar médico' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const medico = await Medico.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!medico) return res.status(404).json({ message: 'Médico não encontrado' })
    res.json(medico)
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar médico' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const medico = await Medico.findByIdAndDelete(req.params.id)
    if (!medico) return res.status(404).json({ message: 'Médico não encontrado' })
    res.json({ message: 'Médico removido' })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover médico' })
  }
})

export default router
