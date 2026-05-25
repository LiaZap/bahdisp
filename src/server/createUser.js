import 'dotenv/config'
import User from './models/User.js'
import connectDB from './config/db.js'

/**
 * Cria um novo usuário operador (cliente Free).
 *
 * Uso:
 *   node src/server/createUser.js "Nome" email@dominio.com senha123
 *   node src/server/createUser.js "Rapimed" rapimed@empresa.com.br rapimed2026
 *
 * Para criar admin:
 *   node src/server/createUser.js "Nome" email@dominio.com senha123 admin
 */

const [, , nome, email, senha, role = 'operador'] = process.argv

if (!nome || !email || !senha) {
  console.error('Uso: node src/server/createUser.js "Nome" email@dominio.com senha [admin|operador]')
  console.error('')
  console.error('Exemplos:')
  console.error('  node src/server/createUser.js "Rapimed" rapimed@empresa.com.br senha123')
  console.error('  node src/server/createUser.js "Joao Admin" joao@bah.com.br senha123 admin')
  process.exit(1)
}

if (senha.length < 6) {
  console.error('Erro: senha deve ter ao menos 6 caracteres')
  process.exit(1)
}

if (!['admin', 'operador'].includes(role)) {
  console.error(`Erro: role inválida "${role}". Use admin ou operador.`)
  process.exit(1)
}

async function run() {
  await connectDB()

  const existente = await User.findOne({ email: email.toLowerCase() })
  if (existente) {
    console.error(`❌ Usuário ${email} já existe (id: ${existente._id})`)
    console.error(`   Role atual: ${existente.role}`)
    process.exit(1)
  }

  const user = await User.create({
    nome,
    email: email.toLowerCase(),
    senha,
    role,
    ativo: true,
  })

  console.log('')
  console.log('✅ Usuário criado com sucesso!')
  console.log('───────────────────────────────────')
  console.log(`  Nome:   ${user.nome}`)
  console.log(`  Email:  ${user.email}`)
  console.log(`  Senha:  ${senha}`)
  console.log(`  Role:   ${user.role} ${role === 'operador' ? '(Free — abas premium borradas)' : '(Admin — vê tudo)'}`)
  console.log(`  ID:     ${user._id}`)
  console.log('───────────────────────────────────')
  console.log('')
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
