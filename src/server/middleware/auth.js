import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export default async function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' })
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-senha')
    if (!user || !user.ativo) {
      return res.status(401).json({ message: 'Usuário inválido' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido' })
  }
}
