import { Router } from 'express'
import Vaga from '../models/Vaga.js'
import auth from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const vagas = await Vaga.find().sort({ createdAt: -1 }).populate('criadoPor', 'nome')
    res.json(vagas)
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar vagas' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { titulo, especialidade, local, data, valor } = req.body
    if (!titulo || !especialidade || !local || !data || !valor) {
      return res.status(400).json({ message: 'Campos obrigatórios: titulo, especialidade, local, data, valor' })
    }

    const vaga = await Vaga.create({ ...req.body, criadoPor: req.user._id })
    res.status(201).json(vaga)
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar vaga' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const vaga = await Vaga.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!vaga) return res.status(404).json({ message: 'Vaga não encontrada' })
    res.json(vaga)
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar vaga' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const vaga = await Vaga.findByIdAndDelete(req.params.id)
    if (!vaga) return res.status(404).json({ message: 'Vaga não encontrada' })
    res.json({ message: 'Vaga removida' })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao remover vaga' })
  }
})

export default router
