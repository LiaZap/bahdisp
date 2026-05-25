import { Router } from 'express'
import Instance from '../models/Instance.js'
import auth from '../middleware/auth.js'
import {
  criarInstancia, deletarInstancia, conectarInstancia, statusInstancia,
  configurarWebhook,
} from '../services/uazapi.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const list = await Instance.find({ ativo: true }).sort({ createdAt: -1 })
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
    const { nome, adminField01 = '', adminField02 = '', webhookUrl = '' } = req.body
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
      webhookUrl,
      padrao: total === 0,
      criadoPor: req.user._id,
    })

    // Se webhookUrl foi informado, configura na Uazapi imediatamente
    if (webhookUrl) {
      try {
        await configurarWebhook(token, { url: webhookUrl })
      } catch (err) {
        console.warn('Webhook setup falhou (instancia criada mesmo assim):', err.message)
      }
    }

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
    const phoneToUse = phone || instance.phone || undefined

    const resp = await conectarInstancia(phoneToUse, instance.token)
    console.log('[Uazapi connect response]', JSON.stringify(resp).slice(0, 500))

    if (phone) instance.phone = phone

    // Procura QR em vários formatos possíveis
    const qrcode = resp?.qrcode
      || resp?.base64
      || resp?.image
      || resp?.instance?.qrcode
      || resp?.data?.qrcode

    const isConnected = resp?.connected
      || resp?.status === 'CONNECTED'
      || resp?.status === 'connected'
      || resp?.instance?.status === 'CONNECTED'

    if (isConnected) instance.status = 'conectado'
    else if (qrcode) instance.status = 'aguardando'

    await instance.save()

    res.json({
      ...resp,
      qrcode,
      connected: isConnected,
      dbStatus: instance.status,
    })
  } catch (err) {
    console.error('Erro connect instancia:', err.message)
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id/status', auth, async (req, res) => {
  try {
    const instance = await Instance.findById(req.params.id)
    if (!instance) return res.status(404).json({ message: 'Instância não encontrada' })

    const resp = await statusInstancia(instance.token)
    const conn = resp?.connected
      || resp?.status === 'CONNECTED'
      || resp?.status === 'connected'
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

/**
 * Configura webhook da instância na Uazapi.
 * Body: { url }
 */
router.post('/:id/webhook', auth, async (req, res) => {
  try {
    const instance = await Instance.findById(req.params.id)
    if (!instance) return res.status(404).json({ message: 'Instância não encontrada' })

    const { url } = req.body
    if (!url) return res.status(400).json({ message: 'URL do webhook obrigatória' })

    const resp = await configurarWebhook(instance.token, { url })

    instance.webhookUrl = url
    await instance.save()

    res.json({ message: 'Webhook configurado', resp })
  } catch (err) {
    console.error('Erro webhook:', err.message)
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const instance = await Instance.findById(req.params.id)
    if (!instance) return res.status(404).json({ message: 'Instância não encontrada' })

    try {
      await deletarInstancia(instance.token)
    } catch { /* best-effort */ }

    instance.ativo = false
    await instance.save()
    res.json({ message: 'Instância removida' })
  } catch {
    res.status(500).json({ message: 'Erro ao remover instância' })
  }
})

export default router
