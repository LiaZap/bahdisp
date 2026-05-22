import axios from 'axios'

const uazapi = axios.create({
  baseURL: process.env.UAZAPI_URL || 'https://liaautomacoes.uazapi.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

uazapi.interceptors.request.use((config) => {
  config.headers['token'] = process.env.UAZAPI_TOKEN
  return config
})

export async function conectarInstancia(phone) {
  const { data } = await uazapi.post('/instance/connect', { phone })
  return data
}

export async function enviarMensagem(numero, mensagem) {
  const { data } = await uazapi.post('/send/text', {
    number: numero,
    text: mensagem
  })
  return data
}

export async function verificarConexao() {
  const { data } = await uazapi.post('/instance/connect', {
    phone: process.env.UAZAPI_PHONE || '5511999999999'
  })
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
 */
export async function enviarMensagemComDelay(destinatarios, mensagemOuMin, minMsOrMax = 3000, maxMs = 12000) {
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
      const resultado = await enviarMensagem(medico.whatsapp, texto)
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
