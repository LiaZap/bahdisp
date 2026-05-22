import mongoose from 'mongoose'

const agendamentoSchema = new mongoose.Schema({
  vaga: { type: mongoose.Schema.Types.ObjectId, ref: 'Vaga', required: true },
  medicoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medico' }],
  templateId: { type: Number, default: 1 },
  mensagemCustom: { type: String, default: '' },
  antiBlock: { type: Boolean, default: true },
  agendadoPara: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['pendente', 'enviado', 'cancelado', 'erro'],
    default: 'pendente',
  },
  protocolo: { type: String },
  executadoEm: { type: Date },
  erro: { type: String },
  criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.model('Agendamento', agendamentoSchema)
