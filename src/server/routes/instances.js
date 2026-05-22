import { Router } from 'express'
import Instance from '../models/Instance.js'
import auth from '../middleware/auth.js'
import {
  criarInstancia, deletarInstancia, conectarInstancia, statusInstancia,
} from '../services/uazapi.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const list = await Instance.find({ ativo: true }).sort({ createdAt: -1 })
    // não expor o token completo no list (mascarar)
    res.json(list.map(i => ({
      ...i.toObject(),
      token: i.token ? i.token.slice(0, 4) + '...' + i.token.slice(-4) : '',
    })))
  } catch {
    res.status(500).json({ message: 'Erro ao listar instâncias' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { nome, adminField01 = '', adminField02 = '' } = req.body
    if (!nome) return res.status(400).json({ message: 'Nome obrigatório' })

    if (!process.env.UAZAPI_ADMIN_TOKEN) {
      return res.status(500).json({ message: 'UAZAPI_ADMIN_TOKEN não configurado no servidor' })
    }

    const resp = await criarInstancia({ name: nome, adminField01, adminField02 })
    const token = resp?.token || resp?.instance?.token || resp?.data?.token
    const instanceId = resp?.id || resp?.instance?.id || resp?.instanceId

    if (!token) {
      return res.status(500).json({ message: 'Uazapi não retornou token', raw: resp })
    }

    const total = await Instance.countDocuments({ ativo: true })
    const instance = await Instance.create({
      nome,
      token,
      instanceId,
      adminField01,
      adminField02,
      padrao: total === 0, // primeira instância vira padrão
      criadoPor: req.user._id,
    })

    res.status(201).json({
      ...instance.toObject(),
      token: token.slice(0, 4) + '...' + token.slice(-4),
    })
  } catch (err) {
    console.error('Erro criar instancia:', err.message)
    res.status(500).json({ message: 'Erro ao criar instância: ' + err.message })
  }
})

router.post('/:id/connect', auth, async (req, res) => {
  try {
    const instance = await Instance.findById(req.params.id)
    if (!instance) return res.status(404).json({ message: 'Instância não encontrada' })

    const { phone } = req.body
    const resp = await conectarInstancia(phone || instance.phone || process.env.UAZAPI_PHONE, instance.token)

    if (phone) instance.phone = phone
    if (resp?.qrcode || resp?.base64) instance.status = 'aguardando'
    if (resp?.connected || resp?.status === 'CONNECTED') instance.status = 'conectado'
    await instance.save()

    res.json(resp)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id/status', auth, async (req, res) => {
  try {
    const instance = await Instance.findById(req.params.id)
    if (!instance) return res.status(404).json({ message: 'Instância não encontrada' })

    const resp = await statusInstancia(instance.token)
    const conn = resp?.connected || resp?.status === 'CONNECTED'
    instance.status = conn ? 'conectado' : (instance.status === 'conectado' ? 'desconectado' : instance.status)
    await instance.save()

    res.json({ ...resp, dbStatus: instance.status })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/default', auth, async (req, res) => {
  try {
    await Instance.updateMany({}, { padrao: false })
    const updated = await Instance.findByIdAndUpdate(req.params.id, { padrao: true }, { new: true })
    if (!updated) return res.status(404).json({ message: 'Instância não encontrada' })
    res.json({ message: 'Definida como padrão', instance: updated })
  } catch {
    res.status(500).json({ message: 'Erro ao definir padrão' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const instance = await Instance.findById(req.params.id)
    if (!instance) return res.status(404).json({ message: 'Instância não encontrada' })

    // Tenta deletar na Uazapi também (best-effort)
    try {
      await deletarInstancia(instance.token)
    } catch { /* segue mesmo se falhar */ }

    instance.ativo = false
    await instance.save()
    res.json({ message: 'Instância removida' })
  } catch {
    res.status(500).json({ message: 'Erro ao remover instância' })
  }
})

export default router
