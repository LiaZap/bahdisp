import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  senha: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'operador'], default: 'operador' },
  ativo: { type: Boolean, default: true },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next()
  this.senha = await bcrypt.hash(this.senha, 10)
  next()
})

userSchema.methods.compararSenha = function (senha) {
  return bcrypt.compare(senha, this.senha)
}

export default mongoose.model('User', userSchema)
