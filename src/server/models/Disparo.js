import mongoose from 'mongoose'

const disparoSchema = new mongoose.Schema({
  // Modo "vaga + médico cadastrado"
  vaga: { type: mongoose.Schema.Types.ObjectId, ref: 'Vaga' },
  medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Medico' },
  // Modo "número direto" (disparo simples)
  numero: { type: String },
  // Instância usada
  instance: { type: mongoose.Schema.Types.ObjectId, ref: 'Instance' },

  protocolo: { type: String, required: true, index: true },
  mensagem: { type: String, required: true },
  status: {
    type: String,
    enum: ['pendente', 'enviando', 'enviado', 'entregue', 'lido', 'respondido', 'erro'],
    default: 'pendente',
    index: true,
  },
  enviadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enviadoEm: { type: Date },
  entregueEm: { type: Date },
  lidoEm: { type: Date },
  respondidoEm: { type: Date },
  erro: { type: String },
}, { timestamps: true })

disparoSchema.index({ protocolo: 1, status: 1 })

export default mongoose.model('Disparo', disparoSchema)
