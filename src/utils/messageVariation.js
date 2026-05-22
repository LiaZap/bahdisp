/**
 * Engine de variação de mensagens para evitar bloqueio do WhatsApp.
 *
 * Cada destinatário recebe uma versão com palavras, emojis, ordem e formatação
 * ligeiramente diferentes — mantendo o mesmo significado e contexto.
 * A escolha das variações é determinística por destinatário (seedKey),
 * garantindo que reenvios para o mesmo médico não criem mensagens diferentes
 * a cada execução.
 */

const GREETINGS = [
  '',
  '👋 Olá, doutor(a)!\n\n',
  '🩺 Oi, doutor(a)!\n\n',
  'Olá, tudo bem?\n\n',
  'E aí, doutor(a)?\n\n',
  'Bom dia, doutor(a)!\n\n',
]

const NEW_VAGA_HEADERS = [
  '*🔔 NOVA VAGA DISPONÍVEL!*',
  '*📢 OPORTUNIDADE DE PLANTÃO*',
  '*🚨 VAGA ABERTA AGORA*',
  '*✨ VAGA DISPONÍVEL*',
  '*📅 NOVA OPORTUNIDADE*',
  '*🏥 PLANTÃO ABERTO*',
]

const URGENT_HEADERS = [
  '*🚨 URGENTE - VAGA DISPONÍVEL*',
  '*⚠️ ATENÇÃO - VAGA URGENTE*',
  '*🔴 VAGA URGENTE - PRECISAMOS HOJE*',
  '*🆘 URGENTE - PRECISAMOS DE PROFISSIONAL*',
  '*⏰ URGENTE - VAGA ABRINDO AGORA*',
]

const LABELS = {
  vaga: ['*Vaga:*', '*Posição:*', '*Função:*', '*Tipo:*'],
  local: ['*Local:*', '*Onde:*', '*Hospital:*', '*Unidade:*'],
  data: ['*Data:*', '*Quando:*', '*Dia:*'],
  horario: ['*Horário:*', '*Período:*', '*Turno:*'],
  valor: ['*Valor:*', '*Remuneração:*', '*Pagamento:*'],
}

const CTAS = [
  '👉 Interessado? Responda esta mensagem!',
  '✅ Tem interesse? Me chama aqui!',
  '📩 Quer pegar? Responda aqui!',
  '🙏 Pode pegar? Confirma comigo!',
  '📲 Avisa aqui se tiver interesse!',
  '✋ Interesse? Manda mensagem!',
  '📌 Topa? Confirma comigo!',
]

const URGENT_CTAS = [
  '⏰ Responda AGORA para garantir!',
  '🔥 Confirma logo se vai pegar!',
  '⚡ Avisa rápido se tiver interesse!',
  '🚀 Confirma já para não perder!',
  '🆘 Resposta urgente, por favor!',
]

const SIGNOFFS = [
  '_LIAMED - Vagas Médicas_',
  '_LIAMED Plantões_',
  '_Equipe LIAMED_',
  '_LIAMED_',
  '_— LIAMED —_',
]

function hashString(s) {
  const str = String(s ?? Math.random())
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pick(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length]
}

function formatData(d) {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return String(d)
  return date.toLocaleDateString('pt-BR')
}

function formatValor(v) {
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

/**
 * Aplica variações leves em mensagem custom (preserva o texto, só varia
 * saudação e assinatura).
 */
export function variarCustom(texto, seedKey) {
  if (!texto) return ''
  const seed = hashString(seedKey)
  const greeting = pick(GREETINGS, seed)
  const signoff = pick(SIGNOFFS, seed)
  return `${greeting}${texto}\n\n${signoff}`
}

/**
 * Gera mensagem variada baseada no template e na vaga.
 * @param {Object} vaga - { titulo, local, data, horarioInicio, horarioFim, valor }
 * @param {Number} template - 1 padrão, 2 resumido, 3 urgente
 * @param {String} seedKey - chave única do destinatário (ex: medico._id)
 *                            Use null/undefined para variação aleatória.
 * @returns {String}
 */
export function gerarMensagem(vaga, template = 1, seedKey = null) {
  if (!vaga) return ''
  const seed = hashString(seedKey)

  // Template 2 — Resumido
  if (template === 2) {
    const cta = pick(CTAS, seed)
    return [
      pick(GREETINGS, seed).trim(),
      `*${vaga.titulo}*`,
      `📅 ${formatData(vaga.data)} | 💰 R$ ${formatValor(vaga.valor)}`,
      '',
      cta,
    ].filter(line => line !== '').join('\n')
  }

  // Template 3 — Urgente
  if (template === 3) {
    const greeting = pick(GREETINGS, seed)
    const header = pick(URGENT_HEADERS, seed)
    const cta = pick(URGENT_CTAS, seed)
    const signoff = pick(SIGNOFFS, seed)
    return [
      greeting + header,
      '',
      `*${vaga.titulo}*`,
      `📅 ${formatData(vaga.data)}`,
      `💰 R$ ${formatValor(vaga.valor)}`,
      '',
      cta,
      '',
      signoff,
    ].join('\n')
  }

  // Template 1 — Padrão (default)
  const greeting = pick(GREETINGS, seed)
  const header = pick(NEW_VAGA_HEADERS, seed)
  const lblVaga = pick(LABELS.vaga, seed, 1)
  const lblLocal = pick(LABELS.local, seed, 2)
  const lblData = pick(LABELS.data, seed, 3)
  const lblHorario = pick(LABELS.horario, seed, 4)
  const lblValor = pick(LABELS.valor, seed, 5)
  const cta = pick(CTAS, seed)
  const signoff = pick(SIGNOFFS, seed)

  const lines = [
    greeting + header,
    '',
    `${lblVaga} ${vaga.titulo}`,
  ]
  if (vaga.local) lines.push(`${lblLocal} ${vaga.local}`)
  if (vaga.data) lines.push(`${lblData} ${formatData(vaga.data)}`)
  if (vaga.horarioInicio) {
    const horario = vaga.horarioFim
      ? `${vaga.horarioInicio} às ${vaga.horarioFim}`
      : vaga.horarioInicio
    lines.push(`${lblHorario} ${horario}`)
  }
  lines.push(`${lblValor} R$ ${formatValor(vaga.valor)}`)
  lines.push('')
  lines.push(cta)
  lines.push('')
  lines.push(signoff)

  return lines.join('\n')
}

/**
 * Gera N amostras variadas da mesma vaga (para preview do usuário).
 */
export function gerarAmostras(vaga, template = 1, count = 4) {
  const samples = []
  for (let i = 0; i < count; i++) {
    samples.push(gerarMensagem(vaga, template, `sample-${i}-${Date.now()}-${Math.random()}`))
  }
  return samples
}
