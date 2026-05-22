import mongoose from 'mongoose'

const templateSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  descricao: { type: String, default: '' },
  conteudo: { type: String, required: true },
  ativo: { type: Boolean, default: true },
  criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.model('Template', templateSchema)
