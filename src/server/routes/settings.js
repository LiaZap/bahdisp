import { Router } from 'express'
import auth from '../middleware/auth.js'
import { getQuietHours, setQuietHours } from '../utils/quietHours.js'

const router = Router()

router.get('/quiet-hours', auth, async (req, res) => {
  res.json(await getQuietHours())
})

router.put('/quiet-hours', auth, async (req, res) => {
  const { enabled, inicio, fim } = req.body
  const doc = await setQuietHours({
    enabled: Boolean(enabled),
    inicio: Number(inicio),
    fim: Number(fim),
  })
  res.json(doc.value)
})

export default router
