import { Router } from 'express'
import Template from '../models/Template.js'
import auth from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const templates = await Template.find({ ativo: true }).sort({ createdAt: -1 })
    res.json(templates)
  } catch {
    res.status(500).json({ message: 'Erro ao buscar templates' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { nome, descricao, conteudo } = req.body
    if (!nome || !conteudo) return res.status(400).json({ message: 'Nome e conteudo obrigatorios' })
    const t = await Template.create({ nome, descricao, conteudo, criadoPor: req.user._id })
    res.status(201).json(t)
  } catch {
    res.status(500).json({ message: 'Erro ao criar template' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const t = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!t) return res.status(404).json({ message: 'Template nao encontrado' })
    res.json(t)
  } catch {
    res.status(500).json({ message: 'Erro ao atualizar template' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await Template.findByIdAndUpdate(req.params.id, { ativo: false })
    res.json({ message: 'Template removido' })
  } catch {
    res.status(500).json({ message: 'Erro ao remover template' })
  }
})

export default router
