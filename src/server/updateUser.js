import 'dotenv/config'
import User from './models/User.js'
import connectDB from './config/db.js'

/**
 * Atualiza dados de um usuário existente.
 *
 * Uso:
 *   node src/server/updateUser.js <emailAtual> --email=<novoEmail>
 *   node src/server/updateUser.js <emailAtual> --senha=<novaSenha>
 *   node src/server/updateUser.js <emailAtual> --nome=<novoNome>
 *   node src/server/updateUser.js <emailAtual> --role=admin
 *
 * Pode combinar flags:
 *   node src/server/updateUser.js rapimed@old.com --email=rapimed@bahdisp.com.br --senha=nova123
 */

const [, , emailAtual, ...flags] = process.argv

if (!emailAtual || flags.length === 0) {
  console.error('Uso: node src/server/updateUser.js <emailAtual> [--email=...] [--senha=...] [--nome=...] [--role=...]')
  console.error('')
  console.error('Exemplos:')
  console.error('  node src/server/updateUser.js rapimed@empresa.com.br --email=rapimed@bahdisp.com.br')
  console.error('  node src/server/updateUser.js rapimed@bahdisp.com.br --senha=NovaSenh@2026')
  process.exit(1)
}

const updates = {}
for (const flag of flags) {
  const match = flag.match(/^--([^=]+)=(.+)$/)
  if (!match) {
    console.error(`Flag invalida: ${flag}`)
    process.exit(1)
  }
  const [, key, value] = match
  if (!['email', 'senha', 'nome', 'role', 'ativo'].includes(key)) {
    console.error(`Campo nao permitido: ${key}`)
    process.exit(1)
  }
  updates[key] = value
}

if (updates.role && !['admin', 'operador'].includes(updates.role)) {
  console.error(`Erro: role invalida "${updates.role}". Use admin ou operador.`)
  process.exit(1)
}

if (updates.senha && updates.senha.length < 6) {
  console.error('Erro: senha deve ter ao menos 6 caracteres')
  process.exit(1)
}

if (updates.email) updates.email = updates.email.toLowerCase()
if (updates.ativo !== undefined) updates.ativo = updates.ativo === 'true'

async function run() {
  await connectDB()

  const user = await User.findOne({ email: emailAtual.toLowerCase() })
  if (!user) {
    console.error(`❌ Usuario "${emailAtual}" nao encontrado.`)
    process.exit(1)
  }

  // Verifica se novo email ja existe (se mudou)
  if (updates.email && updates.email !== user.email) {
    const conflito = await User.findOne({ email: updates.email })
    if (conflito) {
      console.error(`❌ Email "${updates.email}" ja esta em uso por outro usuario.`)
      process.exit(1)
    }
  }

  console.log('')
  console.log(`Atualizando usuario: ${user.email}`)
  console.log('───────────────────────────────────')

  for (const [key, value] of Object.entries(updates)) {
    const anterior = user[key]
    user[key] = value
    const display = key === 'senha' ? '••••••' : value
    const anteriorDisplay = key === 'senha' ? '••••••' : anterior
    console.log(`  ${key.padEnd(8)}: ${anteriorDisplay} → ${display}`)
  }

  await user.save()

  console.log('───────────────────────────────────')
  console.log('✅ Usuario atualizado com sucesso!')
  console.log('')
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
