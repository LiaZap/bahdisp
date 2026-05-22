import { Router } from 'express'
import Disparo from '../models/Disparo.js'

const router = Router()

/**
 * Webhook receiver for Uazapi callbacks.
 * Public endpoint (Uazapi cannot send JWT).
 * Updates Disparo status based on incoming events.
 *
 * Expected payloads from Uazapi:
 *  - message.ack: { number, status: 'delivered'|'read', ... }
 *  - message.received: { from, body, ... } (reply from médico)
 */
router.post('/uazapi', async (req, res) => {
  try {
    const event = req.body || {}
    const type = event.event || event.type || event.action

    // Optional secret guard
    if (process.env.WEBHOOK_SECRET) {
      const provided = req.headers['x-webhook-secret']
      if (provided !== process.env.WEBHOOK_SECRET) {
        return res.status(401).json({ message: 'Webhook não autorizado' })
      }
    }

    const numero = (
      event.number || event.from || event.numero || event.recipient || ''
    ).replace(/\D/g, '')

    if (!numero) return res.json({ ok: true, ignored: true })

    // Find most recent disparo for this WhatsApp
    const disparo = await Disparo.findOne()
      .populate({ path: 'medico', match: { whatsapp: numero }, select: '_id whatsapp' })
      .sort({ createdAt: -1 })

    const target = disparo?.medico ? disparo : null
    if (!target) return res.json({ ok: true, notFound: true })

    const status = (event.status || '').toLowerCase()

    if (type?.includes('received') || event.body || event.message) {
      target.status = 'respondido'
      target.respondidoEm = new Date()
      await target.save()
      return res.json({ ok: true, status: 'respondido' })
    }
    if (status === 'delivered' || status === 'entregue') {
      if (target.status !== 'respondido' && target.status !== 'lido') {
        target.status = 'entregue'
        target.entregueEm = new Date()
        await target.save()
      }
    } else if (status === 'read' || status === 'lido') {
      if (target.status !== 'respondido') {
        target.status = 'lido'
        target.lidoEm = new Date()
        await target.save()
      }
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ message: 'Erro processando webhook' })
  }
})

export default router
