import { Router } from 'express'
import Agendamento from '../models/Agendamento.js'
import auth from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const list = await Agendamento.find()
      .sort({ agendadoPara: 1 })
      .populate('vaga', 'titulo local')
      .populate('medicoIds', 'nome especialidade')
    res.json(list)
  } catch {
    res.status(500).json({ message: 'Erro ao listar agendamentos' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { vagaId, medicoIds, templateId, mensagemCustom, antiBlock, agendadoPara, instanceId } = req.body
    if (!vagaId || !medicoIds?.length || !agendadoPara) {
      return res.status(400).json({ message: 'Dados incompletos' })
    }
    const ag = await Agendamento.create({
      vaga: vagaId,
      medicoIds,
      instanceId: instanceId || undefined,
      templateId: Number(templateId) || 1,
      mensagemCustom: mensagemCustom || '',
      antiBlock: antiBlock !== false,
      agendadoPara: new Date(agendadoPara),
      criadoPor: req.user._id,
    })
    res.status(201).json(ag)
  } catch {
    res.status(500).json({ message: 'Erro ao criar agendamento' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await Agendamento.findByIdAndUpdate(req.params.id, { status: 'cancelado' })
    res.json({ message: 'Agendamento cancelado' })
  } catch {
    res.status(500).json({ message: 'Erro ao cancelar agendamento' })
  }
})

export default router
