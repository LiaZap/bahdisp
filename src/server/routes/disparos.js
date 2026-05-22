import { Router } from 'express'
import Disparo from '../models/Disparo.js'
import Vaga from '../models/Vaga.js'
import Medico from '../models/Medico.js'
import auth from '../middleware/auth.js'
import { enviarMensagemComDelay } from '../services/uazapi.js'
import { gerarMensagem as gerarMensagemVariada, variarCustom } from '../../utils/messageVariation.js'
import { getQuietHours, isQuietNow } from '../utils/quietHours.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const { protocolo, status, limit = 50 } = req.query
    const filter = {}
    if (protocolo) filter.protocolo = protocolo
    if (status) filter.status = status

    const disparos = await Disparo.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('vaga', 'titulo local')
      .populate('medico', 'nome especialidade')
      .populate('enviadoPor', 'nome')
    res.json(disparos)
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar disparos' })
  }
})

router.post('/enviar', auth, async (req, res) => {
  try {
    const {
      vagaId, medicoIds, mensagem, mensagemCustom,
      templateId = 1, antiBlock = true, protocolo,
    } = req.body

    if (!vagaId || !medicoIds?.length || !mensagem) {
      return res.status(400).json({ message: 'Dados incompletos' })
    }

    const quiet = await getQuietHours()
    if (isQuietNow(quiet) && !req.body.forcar) {
      return res.status(409).json({
        message: `Horario de silencio ativo (${quiet.inicio}h-${quiet.fim}h). Disparo bloqueado.`,
        quietHours: quiet,
        code: 'QUIET_HOURS',
      })
    }

    const vaga = await Vaga.findById(vagaId)
    if (!vaga) return res.status(404).json({ message: 'Vaga não encontrada' })

    const medicos = await Medico.find({ _id: { $in: medicoIds }, ativo: true })
    if (medicos.length === 0) {
      return res.status(400).json({ message: 'Nenhum médico ativo selecionado' })
    }

    // Gera uma mensagem por médico (variada se antiBlock=true)
    const mensagensPorMedico = medicos.map(m => {
      if (!antiBlock) return { medico: m, texto: mensagem }
      if (mensagemCustom) return { medico: m, texto: variarCustom(mensagemCustom, String(m._id)) }
      return { medico: m, texto: gerarMensagemVariada(vaga.toObject(), Number(templateId), String(m._id)) }
    })

    const finalProtocolo = protocolo || `LMD-${Math.floor(Math.random() * 9000 + 1000)}`

    const disparos = await Disparo.insertMany(
      mensagensPorMedico.map(({ medico, texto }) => ({
        vaga: vagaId,
        medico: medico._id,
        protocolo: finalProtocolo,
        mensagem: texto,
        enviadoPor: req.user._id,
      }))
    )

    const minDelay = (Number(req.body.intervaloMin) || 3) * 1000
    const maxDelay = (Number(req.body.intervaloMax) || 12) * 1000
    const resultados = await enviarMensagemComDelay(mensagensPorMedico, minDelay, maxDelay)

    for (const resultado of resultados) {
      await Disparo.findOneAndUpdate(
        { medico: resultado.medicoId, protocolo: finalProtocolo },
        {
          status: resultado.status === 'enviado' ? 'enviado' : 'erro',
          enviadoEm: resultado.status === 'enviado' ? new Date() : undefined,
          erro: resultado.erro,
        }
      )
    }

    await Vaga.findByIdAndUpdate(vagaId, { $inc: { totalDisparos: medicos.length } })

    res.json({
      protocolo: finalProtocolo,
      total: medicos.length,
      enviados: resultados.filter(r => r.status === 'enviado').length,
      erros: resultados.filter(r => r.status === 'erro').length,
      variado: antiBlock,
    })
  } catch (err) {
    console.error('Erro ao enviar disparos:', err)
    res.status(500).json({ message: 'Erro ao enviar disparos' })
  }
})

router.get('/historico/protocolos', auth, async (req, res) => {
  try {
    const grupos = await Disparo.aggregate([
      { $group: {
          _id: '$protocolo',
          vaga: { $first: '$vaga' },
          total: { $sum: 1 },
          enviados: { $sum: { $cond: [{ $eq: ['$status', 'enviado'] }, 1, 0] } },
          entregues: { $sum: { $cond: [{ $eq: ['$status', 'entregue'] }, 1, 0] } },
          lidos: { $sum: { $cond: [{ $eq: ['$status', 'lido'] }, 1, 0] } },
          respondidos: { $sum: { $cond: [{ $eq: ['$status', 'respondido'] }, 1, 0] } },
          erros: { $sum: { $cond: [{ $eq: ['$status', 'erro'] }, 1, 0] } },
          ultimoEnvio: { $max: '$createdAt' },
        } },
      { $sort: { ultimoEnvio: -1 } },
      { $limit: 100 },
      { $lookup: { from: 'vagas', localField: 'vaga', foreignField: '_id', as: 'vaga' } },
      { $unwind: { path: '$vaga', preserveNullAndEmptyArrays: true } },
    ])
    res.json(grupos)
  } catch {
    res.status(500).json({ message: 'Erro ao buscar histórico' })
  }
})

router.get('/export.csv', auth, async (req, res) => {
  try {
    const { dias = 30 } = req.query
    const since = new Date(Date.now() - Number(dias) * 86400000)
    const disparos = await Disparo.find({ createdAt: { $gte: since } })
      .populate('vaga', 'titulo local')
      .populate('medico', 'nome crm whatsapp especialidade')
      .sort({ createdAt: -1 })

    const header = 'Data,Protocolo,Vaga,Local,Medico,CRM,Especialidade,WhatsApp,Status,EnviadoEm,RespondidoEm\n'
    const rows = disparos.map(d => [
      d.createdAt?.toISOString() || '',
      d.protocolo,
      d.vaga?.titulo || '',
      d.vaga?.local || '',
      d.medico?.nome || '',
      d.medico?.crm || '',
      d.medico?.especialidade || '',
      d.medico?.whatsapp || '',
      d.status,
      d.enviadoEm?.toISOString() || '',
      d.respondidoEm?.toISOString() || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=disparos-${Date.now()}.csv`)
    res.send('﻿' + header + rows)
  } catch {
    res.status(500).json({ message: 'Erro ao exportar' })
  }
})

router.get('/stats', auth, async (req, res) => {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const [totalHoje, entreguesHoje, totalGeral, porStatus] = await Promise.all([
      Disparo.countDocuments({ createdAt: { $gte: hoje } }),
      Disparo.countDocuments({ createdAt: { $gte: hoje }, status: { $in: ['entregue', 'lido', 'respondido'] } }),
      Disparo.countDocuments(),
      Disparo.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ])

    res.json({ totalHoje, entreguesHoje, totalGeral, porStatus })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar estatísticas' })
  }
})

export default router
