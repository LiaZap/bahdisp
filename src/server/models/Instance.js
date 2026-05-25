import mongoose from 'mongoose'

const instanceSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  // Token retornado pela Uazapi após criar a instância (cada instância tem o seu)
  token: { type: String, required: true },
  // ID interno da Uazapi (se vier no response)
  instanceId: { type: String },
  // Número conectado (preenchido após scanear QR)
  phone: { type: String, default: '' },
  // Status: 'pendente' (criada mas sem QR), 'aguardando' (QR gerado), 'conectado', 'desconectado'
  status: {
    type: String,
    enum: ['pendente', 'aguardando', 'conectado', 'desconectado'],
    default: 'pendente',
  },
  // Marca a instância padrão (usada quando o usuário não especifica)
  padrao: { type: Boolean, default: false },
  // URL do webhook para receber eventos (delivery, leitura, respostas)
  webhookUrl: { type: String, default: '' },
  // Metadados livres
  adminField01: { type: String, default: '' },
  adminField02: { type: String, default: '' },
  ativo: { type: Boolean, default: true },
  criadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.model('Instance', instanceSchema)
