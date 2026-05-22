import Agendamento from '../models/Agendamento.js'
import Vaga from '../models/Vaga.js'
import Medico from '../models/Medico.js'
import Disparo from '../models/Disparo.js'
import { enviarMensagemComDelay } from './uazapi.js'
import { gerarMensagem, variarCustom } from '../../utils/messageVariation.js'
import { getQuietHours, isQuietNow } from '../utils/quietHours.js'

const TICK_MS = 30 * 1000 // 30s

async function processAgendamento(ag) {
  const vaga = await Vaga.findById(ag.vaga)
  if (!vaga) {
    ag.status = 'erro'
    ag.erro = 'Vaga nao encontrada'
    await ag.save()
    return
  }

  const medicos = await Medico.find({ _id: { $in: ag.medicoIds }, ativo: true })
  if (medicos.length === 0) {
    ag.status = 'erro'
    ag.erro = 'Nenhum medico ativo'
    await ag.save()
    return
  }

  const mensagensPorMedico = medicos.map(m => {
    if (!ag.antiBlock) {
      return { medico: m, texto: ag.mensagemCustom || gerarMensagem(vaga.toObject(), ag.templateId, 'static') }
    }
    if (ag.mensagemCustom) return { medico: m, texto: variarCustom(ag.mensagemCustom, String(m._id)) }
    return { medico: m, texto: gerarMensagem(vaga.toObject(), ag.templateId, String(m._id)) }
  })

  const protocolo = ag.protocolo || `LMD-${Math.floor(Math.random() * 9000 + 1000)}`

  await Disparo.insertMany(
    mensagensPorMedico.map(({ medico, texto }) => ({
      vaga: ag.vaga,
      medico: medico._id,
      protocolo,
      mensagem: texto,
      enviadoPor: ag.criadoPor,
    }))
  )

  const resultados = await enviarMensagemComDelay(mensagensPorMedico, 3000, 12000)

  for (const r of resultados) {
    await Disparo.findOneAndUpdate(
      { medico: r.medicoId, protocolo },
      {
        status: r.status === 'enviado' ? 'enviado' : 'erro',
        enviadoEm: r.status === 'enviado' ? new Date() : undefined,
        erro: r.erro,
      }
    )
  }

  await Vaga.findByIdAndUpdate(ag.vaga, { $inc: { totalDisparos: medicos.length } })

  ag.status = 'enviado'
  ag.protocolo = protocolo
  ag.executadoEm = new Date()
  await ag.save()
}

async function tick() {
  try {
    const quiet = await getQuietHours()
    if (isQuietNow(quiet)) return

    const agora = new Date()
    const pendentes = await Agendamento.find({
      status: 'pendente',
      agendadoPara: { $lte: agora },
    }).limit(5)

    for (const ag of pendentes) {
      try {
        await processAgendamento(ag)
      } catch (err) {
        ag.status = 'erro'
        ag.erro = err.message
        await ag.save()
      }
    }
  } catch (err) {
    console.error('Scheduler tick error:', err.message)
  }
}

export function startScheduler() {
  console.log('Scheduler iniciado (tick a cada 30s)')
  setInterval(tick, TICK_MS)
  tick()
}
