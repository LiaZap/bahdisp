import { Router } from 'express'
import Disparo from '../models/Disparo.js'
import Vaga from '../models/Vaga.js'
import Medico from '../models/Medico.js'
import Instance from '../models/Instance.js'
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

// Disparo simples ASSÍNCRONO: persiste disparos, responde rápido, processa em background.
// Frontend usa GET /disparos/status/:protocolo para acompanhar o progresso em tempo real.
router.post('/simples', auth, async (req, res) => {
  try {
    const { phones, mensagem, antiBlock = true, instanceId } = req.body

    if (!Array.isArray(phones) || phones.length === 0 || !mensagem?.trim()) {
      return res.status(400).json({ message: 'Números e mensagem são obrigatórios' })
    }

    const normalizados = phones
      .map(p => String(p).replace(/\D/g, ''))
      .filter(p => p.length >= 10)

    if (normalizados.length === 0) {
      return res.status(400).json({ message: 'Nenhum número válido' })
    }

    const quiet = await getQuietHours()
    if (isQuietNow(quiet) && !req.body.forcar) {
      return res.status(409).json({
        message: `Horário de silêncio ativo (${quiet.inicio}h-${quiet.fim}h). Disparo bloqueado.`,
        quietHours: quiet,
        code: 'QUIET_HOURS',
      })
    }

    let instanceToken = null
    let instanceUsada = null
    if (instanceId) {
      instanceUsada = await Instance.findById(instanceId)
    } else {
      instanceUsada = await Instance.findOne({ padrao: true, ativo: true })
    }
    if (instanceUsada) instanceToken = instanceUsada.token

    const lista = normalizados.map(numero => ({
      numero,
      texto: antiBlock ? variarCustom(mensagem, numero) : mensagem,
    }))

    const protocolo = `LMD-${Math.floor(Math.random() * 9000 + 1000)}-${Date.now().toString(36)}`

    // Persiste todos os disparos como 'pendente' imediatamente
    const disparosCriados = await Disparo.insertMany(
      lista.map(({ numero, texto }) => ({
        protocolo,
        mensagem: texto,
        numero,
        instance: instanceUsada?._id,
        enviadoPor: req.user._id,
        status: 'pendente',
      }))
    )

    // Responde IMEDIATAMENTE com info para o frontend começar a polling
    res.json({
      protocolo,
      total: normalizados.length,
      instancia: instanceUsada?.nome || 'padrão (env)',
      status: 'iniciado',
    })

    // Background: envia mensagens uma a uma, atualizando cada disparo
    setImmediate(async () => {
      const idsPorNumero = {}
      for (const d of disparosCriados) idsPorNumero[d.numero] = d._id

      for (const { numero, texto } of lista) {
        const id = idsPorNumero[numero]
        try {
          await Disparo.findByIdAndUpdate(id, { status: 'enviando' })

          const { enviarMensagem } = await import('../services/uazapi.js')
          await enviarMensagem(numero, texto, instanceToken)

          await Disparo.findByIdAndUpdate(id, {
            status: 'enviado',
            enviadoEm: new Date(),
          })
        } catch (err) {
          await Disparo.findByIdAndUpdate(id, {
            status: 'erro',
            erro: err.message?.slice(0, 200) || 'Erro desconhecido',
          })
        }
        // Delay aleatório entre 3 e 12 segundos
        if (numero !== lista[lista.length - 1].numero) {
          const delay = Math.floor(Math.random() * 9000) + 3000
          await new Promise(r => setTimeout(r, delay))
        }
      }
    })
  } catch (err) {
    console.error('Erro disparo simples:', err)
    res.status(500).json({ message: 'Erro ao iniciar disparos' })
  }
})

// Status agregado de um protocolo (para polling do frontend)
router.get('/status/:protocolo', auth, async (req, res) => {
  try {
    const { protocolo } = req.params
    const counts = await Disparo.aggregate([
      { $match: { protocolo } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    const base = { pendente: 0, enviando: 0, enviado: 0, entregue: 0, lido: 0, respondido: 0, erro: 0 }
    counts.forEach(c => { base[c._id] = c.count })

    const total = Object.values(base).reduce((a, b) => a + b, 0)
    const concluidos = base.enviado + base.entregue + base.lido + base.respondido + base.erro
    const done = total > 0 && concluidos === total

    res.json({
      protocolo,
      total,
      ...base,
      concluidos,
      done,
      progress: total > 0 ? Math.round((concluidos / total) * 100) : 0,
    })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar status' })
  }
})

router.post('/enviar', auth, async (req, res) => {
  try {
    const {
      vagaId, medicoIds, mensagem, mensagemCustom,
      templateId = 1, antiBlock = true, protocolo, instanceId,
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

    // Resolve qual instância usar (escolhida, padrão, ou env)
    let instanceToken = null
    let instanceUsada = null
    if (instanceId) {
      instanceUsada = await Instance.findById(instanceId)
    } else {
      instanceUsada = await Instance.findOne({ padrao: true, ativo: true })
    }
    if (instanceUsada) instanceToken = instanceUsada.token

    const minDelay = (Number(req.body.intervaloMin) || 3) * 1000
    const maxDelay = (Number(req.body.intervaloMax) || 12) * 1000
    const resultados = await enviarMensagemComDelay(mensagensPorMedico, minDelay, maxDelay, instanceToken)

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
      instancia: instanceUsada?.nome || 'padrão (env)',
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
