import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'
import connectDB from './config/db.js'

async function seed() {
  await connectDB()

  const exists = await User.findOne({ email: 'admin@bah.com.br' })
  if (exists) {
    console.log('Admin já existe')
    process.exit(0)
  }

  await User.create({
    nome: 'Admin bah!',
    email: 'admin@bah.com.br',
    senha: 'admin123',
    role: 'admin',
    ativo: true
  })

  console.log('Admin criado: admin@bah.com.br / admin123')
  process.exit(0)
}

seed().catch(err => {
  console.error('Erro no seed:', err.message)
  process.exit(1)
})
