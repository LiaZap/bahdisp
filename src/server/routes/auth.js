import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()
const SECRET = process.env.JWT_SECRET

function gerarToken(user) {
  return jwt.sign({ id: user._id }, SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Preencha todos os campos' })
    }

    const existe = await User.findOne({ email })
    if (existe) {
      return res.status(400).json({ message: 'E-mail já cadastrado' })
    }

    const user = await User.create({ nome, email, senha })
    const token = gerarToken(user)

    res.status(201).json({
      token,
      user: { _id: user._id, nome: user.nome, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar conta' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body
    if (!email || !senha) {
      return res.status(400).json({ message: 'Preencha todos os campos' })
    }

    const user = await User.findOne({ email })
    if (!user || !(await user.compararSenha(senha))) {
      return res.status(401).json({ message: 'Credenciais inválidas' })
    }

    if (!user.ativo) {
      return res.status(403).json({ message: 'Conta desativada' })
    }

    const token = gerarToken(user)
    res.json({
      token,
      user: { _id: user._id, nome: user.nome, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao fazer login' })
  }
})

export default router
