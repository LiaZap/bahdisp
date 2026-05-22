import mongoose from 'mongoose'

const vagaSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  especialidade: { type: String, required: true },
  local: { type: String, required: true },
  endereco: { type: String },
  data: { type: Date, required: true },
  horarioInicio: { type: String },
  horarioFim: { type: String },
  valor: { type: Number, required: true },
  descricao: { type: String },
  urgente: { type: Boolean, default: false },
  status: { type: String, enum: ['aberta', 'preenchida', 'cancelada'], default: 'aberta' },
  totalDisparos: { type: Number, default: 0 },
  criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.model('Vaga', vagaSchema)
