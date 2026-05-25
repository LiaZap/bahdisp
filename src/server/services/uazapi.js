import axios from 'axios'

const BASE_URL = process.env.UAZAPI_URL || 'https://liaautomacoes.uazapi.com'

/**
 * Cliente axios genérico (sem token).
 * Token é adicionado por chamada (instância ou admin).
 */
const uazapi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

function instanceHeaders(token) {
  return { token: token || process.env.UAZAPI_TOKEN }
}

function adminHeaders() {
  return { admintoken: process.env.UAZAPI_ADMIN_TOKEN }
}

// ─── Admin (gestão de instâncias) ────────────────────────────────────────

export async function criarInstancia({ name, adminField01 = '', adminField02 = '' }) {
  const { data } = await uazapi.post(
    '/instance/create',
    { name, adminField01, adminField02 },
    { headers: adminHeaders() }
  )
  return data
}

export async function deletarInstancia(instanceToken) {
  const { data } = await uazapi.delete('/instance/delete', {
    headers: instanceHeaders(instanceToken),
  })
  return data
}

// ─── Instância (usa o token da instância) ────────────────────────────────

export async function conectarInstancia(phone, instanceToken) {
  const body = phone ? { phone } : {}
  try {
    const { data } = await uazapi.post(
      '/instance/connect',
      body,
      { headers: instanceHeaders(instanceToken) }
    )
    return data
  } catch (err) {
    const detail = err.response?.data || err.message
    throw new Error(`Uazapi /instance/connect falhou: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
  }
}

export async function statusInstancia(instanceToken) {
  try {
    const { data } = await uazapi.get('/instance/status', {
      headers: instanceHeaders(instanceToken),
    })
    return data
  } catch (err) {
    const detail = err.response?.data || err.message
    throw new Error(`Uazapi /instance/status falhou: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
  }
}

/**
 * Configura o webhook de uma instância.
 * Uazapi: POST /webhook com { url, events: [], excludeMessages, addUrlEvents }
 */
export async function configurarWebhook(instanceToken, { url, events = [] } = {}) {
  const body = {
    url,
    enabled: !!url,
    events: events.length > 0 ? events : [
      'messages',
      'messages_update',
      'connection',
      'qrcode',
    ],
  }
  try {
    const { data } = await uazapi.post(
      '/webhook',
      body,
      { headers: instanceHeaders(instanceToken) }
    )
    return data
  } catch (err) {
    const detail = err.response?.data || err.message
    throw new Error(`Uazapi /webhook falhou: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
  }
}

export async function enviarMensagem(numero, mensagem, instanceToken) {
  const { data } = await uazapi.post(
    '/send/text',
    { number: numero, text: mensagem },
    { headers: instanceHeaders(instanceToken) }
  )
  return data
}

export async function verificarConexao() {
  const { data } = await uazapi.post(
    '/instance/connect',
    { phone: process.env.UAZAPI_PHONE || '5511999999999' },
    { headers: instanceHeaders() }
  )
  return data
}

function randomDelay(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

/**
 * Envia mensagens com delay aleatório entre cada uma.
 * Aceita dois formatos de entrada:
 *  - Array<{medico, texto}> — uma mensagem por destinatário (variada)
 *  - Array<medico> + mensagem única (modo legado)
 * @param {String} instanceToken - Token da instância a usar (opcional, usa env por padrão)
 */
export async function enviarMensagemComDelay(destinatarios, mensagemOuMin, minMsOrMax = 3000, maxMs = 12000, instanceToken = null) {
  // Detecta o formato: se primeiro item tem .texto, é o formato novo
  const isVariado = destinatarios.length > 0 && typeof destinatarios[0]?.texto === 'string'

  let lista, minMs
  if (isVariado) {
    lista = destinatarios
    minMs = typeof mensagemOuMin === 'number' ? mensagemOuMin : 3000
    maxMs = typeof minMsOrMax === 'number' ? minMsOrMax : 12000
  } else {
    // Modo legado: destinatarios = [medico], mensagem = string
    const mensagem = mensagemOuMin
    lista = destinatarios.map(m => ({ medico: m, texto: mensagem }))
    minMs = minMsOrMax
  }

  const resultados = []
  for (const { medico, texto } of lista) {
    try {
      const resultado = await enviarMensagem(medico.whatsapp, texto, instanceToken)
      resultados.push({ medicoId: medico._id, status: 'enviado', resultado })
    } catch (err) {
      resultados.push({ medicoId: medico._id, status: 'erro', erro: err.message })
    }
    if (medico !== lista[lista.length - 1].medico) {
      await new Promise(r => setTimeout(r, randomDelay(minMs, maxMs)))
    }
  }
  return resultados
}
