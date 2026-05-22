import mongoose from 'mongoose'

const disparoSchema = new mongoose.Schema({
  vaga: { type: mongoose.Schema.Types.ObjectId, ref: 'Vaga', required: true },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Medico', required: true },
  protocolo: { type: String, required: true },
  mensagem: { type: String, required: true },
  status: { type: String, enum: ['pendente', 'enviado', 'entregue', 'lido', 'respondido', 'erro'], default: 'pendente' },
  enviadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enviadoEm: { type: Date },
  entregueEm: { type: Date },
  lidoEm: { type: Date },
  respondidoEm: { type: Date },
  erro: { type: String },
}, { timestamps: true })

export default mongoose.model('Disparo', disparoSchema)
