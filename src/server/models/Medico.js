import mongoose from 'mongoose'

const medicoSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  crm: { type: String, required: true, unique: true },
  especialidade: { type: String, required: true },
  whatsapp: { type: String, required: true },
  cidade: { type: String },
  tags: { type: [String], default: [] },
  ativo: { type: Boolean, default: true },
}, { timestamps: true })

medicoSchema.index({ especialidade: 1, ativo: 1 })
medicoSchema.index({ tags: 1 })

export default mongoose.model('Medico', medicoSchema)
