import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import vagaRoutes from './routes/vagas.js'
import medicoRoutes from './routes/medicos.js'
import disparoRoutes from './routes/disparos.js'
import templateRoutes from './routes/templates.js'
import agendamentoRoutes from './routes/agendamentos.js'
import settingsRoutes from './routes/settings.js'
import webhookRoutes from './routes/webhooks.js'
import { startScheduler } from './services/scheduler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DIST_DIR = path.resolve(__dirname, '../../dist')

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet({
  contentSecurityPolicy: false, // permite scripts inline da SPA
  crossOriginEmbedderPolicy: false,
}))
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '1mb' }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Muitas tentativas. Tente novamente em 15 minutos.' }
})
app.use('/api/auth', authLimiter)

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
})
app.use('/api', apiLimiter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/uazapi/test', async (req, res) => {
  try {
    const { verificarConexao } = await import('./services/uazapi.js')
    const result = await verificarConexao()
    res.json({ connected: true, result })
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message })
  }
})

app.post('/api/uazapi/qrcode', async (req, res) => {
  try {
    const { conectarInstancia } = await import('./services/uazapi.js')
    const { phone } = req.body
    const result = await conectarInstancia(phone || process.env.UAZAPI_PHONE)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/vagas', vagaRoutes)
app.use('/api/medicos', medicoRoutes)
app.use('/api/disparos', disparoRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/agendamentos', agendamentoRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/webhooks', webhookRoutes)

// Em produção, serve o frontend buildado (dist/) do mesmo Express
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(DIST_DIR, { maxAge: '7d', index: false }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET não definido no .env')
  process.exit(1)
}

if (!process.env.UAZAPI_TOKEN) {
  console.error('FATAL: UAZAPI_TOKEN não definido no .env')
  process.exit(1)
}

async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Servidor bah! rodando na porta ${PORT}`)
      startScheduler()
    })
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err.message)
    process.exit(1)
  }
}

start()
