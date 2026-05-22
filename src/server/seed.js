import 'dotenv/config'
import User from './models/User.js'
import Vaga from './models/Vaga.js'
import Medico from './models/Medico.js'
import connectDB from './config/db.js'

const FORCE = process.argv.includes('--force')

const medicosSeed = [
  { nome: 'Dr. Carlos Mendes', crm: 'CRM/SP 123456', especialidade: 'Intensivista', whatsapp: '5511987959188', cidade: 'Sao Paulo', tags: ['UTI', 'plantonista'] },
  { nome: 'Dra. Ana Ribeiro', crm: 'CRM/SP 234567', especialidade: 'Clinico Geral', whatsapp: '5511987959189', cidade: 'Sao Paulo', tags: ['UBS'] },
  { nome: 'Dr. Pedro Lima', crm: 'CRM/SP 345678', especialidade: 'Ortopedista', whatsapp: '5511987959190', cidade: 'Campinas', tags: ['cirurgia'] },
  { nome: 'Dra. Maria Santos', crm: 'CRM/SP 456789', especialidade: 'Cardiologista', whatsapp: '5511987959191', cidade: 'Sao Paulo', tags: ['ambulatorio'] },
  { nome: 'Dr. Joao Ferreira', crm: 'CRM/SP 567890', especialidade: 'Intensivista', whatsapp: '5511987959192', cidade: 'Santos', tags: ['UTI', 'plantonista', 'fim de semana'] },
  { nome: 'Dra. Beatriz Souza', crm: 'CRM/RJ 678901', especialidade: 'Pediatra', whatsapp: '5521987959193', cidade: 'Rio de Janeiro', tags: ['pediatria'] },
  { nome: 'Dr. Lucas Oliveira', crm: 'CRM/SP 789012', especialidade: 'Anestesista', whatsapp: '5511987959194', cidade: 'Sao Paulo', tags: ['cirurgia'] },
  { nome: 'Dra. Camila Rocha', crm: 'CRM/MG 890123', especialidade: 'Ginecologista', whatsapp: '5531987959195', cidade: 'Belo Horizonte', tags: ['ambulatorio'] },
  { nome: 'Dr. Rafael Costa', crm: 'CRM/SP 901234', especialidade: 'Clinico Geral', whatsapp: '5511987959196', cidade: 'Guarulhos', tags: ['UBS', 'plantonista'] },
  { nome: 'Dra. Patricia Alves', crm: 'CRM/SP 012345', especialidade: 'Neurologista', whatsapp: '5511987959197', cidade: 'Sao Paulo', tags: ['ambulatorio'] },
]

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(8, 0, 0, 0)
  return d
}

const vagasSeed = [
  { titulo: 'Plantao UTI Adulto', especialidade: 'Intensivista', local: 'Hospital Sao Lucas', endereco: 'Rua das Flores, 123 - Sao Paulo', data: daysFromNow(3), horarioInicio: '19:00', horarioFim: '07:00', valor: 1800, urgente: true, descricao: 'Plantao noturno UTI adulto - 12 leitos' },
  { titulo: 'Clinico Geral - UBS Centro', especialidade: 'Clinico Geral', local: 'UBS Centro', endereco: 'Av. Brasil, 456 - Sao Paulo', data: daysFromNow(5), horarioInicio: '07:00', horarioFim: '19:00', valor: 800, urgente: false, descricao: 'Atendimento ambulatorial' },
  { titulo: 'Ortopedista - Clinica Vida', especialidade: 'Ortopedista', local: 'Clinica Vida', endereco: 'Rua Sao Joao, 789 - Campinas', data: daysFromNow(7), horarioInicio: '08:00', horarioFim: '18:00', valor: 1200, urgente: false, descricao: 'Consultas ambulatoriais' },
  { titulo: 'Plantao PS - Santa Casa', especialidade: 'Clinico Geral', local: 'Santa Casa de Misericordia', endereco: 'Rua XV de Novembro, 321 - Sao Paulo', data: daysFromNow(2), horarioInicio: '19:00', horarioFim: '07:00', valor: 1500, urgente: true, descricao: 'Plantao PS - alta demanda' },
  { titulo: 'Anestesista - Cirurgia Eletiva', especialidade: 'Anestesista', local: 'Hospital Central', endereco: 'Av. Paulista, 1000 - Sao Paulo', data: daysFromNow(10), horarioInicio: '07:00', horarioFim: '13:00', valor: 2200, urgente: false, descricao: 'Cirurgias eletivas - 4 procedimentos' },
  { titulo: 'Cardiologista - Avaliacoes', especialidade: 'Cardiologista', local: 'Centro Cardiologico SP', endereco: 'Rua Augusta, 500 - Sao Paulo', data: daysFromNow(4), horarioInicio: '13:00', horarioFim: '19:00', valor: 1400, urgente: false, descricao: 'Consultas e ECG' },
  { titulo: 'Pediatra - Plantao Final de Semana', especialidade: 'Pediatra', local: 'Hospital Infantil', endereco: 'Rua das Crianças, 222 - Rio de Janeiro', data: daysFromNow(6), horarioInicio: '07:00', horarioFim: '19:00', valor: 1600, urgente: false, descricao: 'Plantao 12h - PS infantil' },
  { titulo: 'Ginecologista - Ambulatorio', especialidade: 'Ginecologista', local: 'Clinica Mulher', endereco: 'Av. Afonso Pena, 800 - Belo Horizonte', data: daysFromNow(8), horarioInicio: '08:00', horarioFim: '17:00', valor: 1300, urgente: false, descricao: 'Consultas ambulatoriais' },
]

async function seed() {
  await connectDB()

  // Admin
  let admin = await User.findOne({ email: 'admin@bah.com.br' })
  if (!admin) {
    admin = await User.create({
      nome: 'Admin bah!',
      email: 'admin@bah.com.br',
      senha: 'admin123',
      role: 'admin',
      ativo: true,
    })
    console.log('✓ Admin criado: admin@bah.com.br / admin123')
  } else {
    console.log('• Admin já existe (mantido)')
  }

  // Médicos
  const totalMedicos = await Medico.countDocuments()
  if (totalMedicos === 0 || FORCE) {
    if (FORCE) await Medico.deleteMany({})
    await Medico.insertMany(medicosSeed)
    console.log(`✓ ${medicosSeed.length} medicos criados`)
  } else {
    console.log(`• ${totalMedicos} medicos ja existem (use --force para recriar)`)
  }

  // Vagas
  const totalVagas = await Vaga.countDocuments()
  if (totalVagas === 0 || FORCE) {
    if (FORCE) await Vaga.deleteMany({})
    await Vaga.insertMany(vagasSeed.map(v => ({ ...v, criadoPor: admin._id })))
    console.log(`✓ ${vagasSeed.length} vagas criadas`)
  } else {
    console.log(`• ${totalVagas} vagas ja existem (use --force para recriar)`)
  }

  console.log('\nSeed concluido!')
  console.log('Login: admin@bah.com.br / admin123')
  process.exit(0)
}

seed().catch(err => {
  console.error('Erro no seed:', err.message)
  process.exit(1)
})
