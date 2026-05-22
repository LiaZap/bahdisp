import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiUser } from 'react-icons/fi'
import BahLogo from '../BahLogo'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const { login, register } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.senha)
        toast.success('Login realizado com sucesso!')
      } else {
        await register(form.nome, form.email, form.senha)
        toast.success('Conta criada com sucesso!')
      }
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#080b14]">
      {/* Left Side - Premium Dark Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0a0f1e]" />

        {/* Animated gradient orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-500/10 blur-[100px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-700/15 to-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-sky-500/8 to-blue-500/5 blur-[80px]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 w-full h-full">
          {/* Top - Logo */}
          <div className="absolute top-12 left-12">
            <BahLogo size="lg" variant="white" />
            <div className="mt-1 ml-1">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/30">
                Disparos &bull; Vagas M&eacute;dicas
              </span>
            </div>
          </div>

          {/* Center - Hero */}
          <div className="max-w-lg">
            <h2 className="text-[2.75rem] font-extrabold leading-[1.1] text-white tracking-tight">
              Conecte vagas<br />
              aos m&eacute;dicos certos,<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                em segundos.
              </span>
            </h2>
            <p className="text-white/40 text-base mt-5 leading-relaxed max-w-sm">
              Dispare vagas m&eacute;dicas via WhatsApp de forma inteligente, automatizada e sem bloqueios.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0c1020] to-[#080b14]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-[150px]" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <BahLogo size="xl" variant="white" />
          </div>

          {/* Form Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8">
              <h3 className="text-[1.625rem] font-bold text-white tracking-tight">
                {isLogin ? 'Acesse sua conta' : 'Criar conta'}
              </h3>
              <p className="text-white/35 text-sm mt-1.5">
                {isLogin
                  ? 'Insira suas credenciais para continuar'
                  : 'Preencha os dados abaixo para começar'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Nome completo
                  </label>
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-[18px] h-[18px] group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20 transition-all"
                      placeholder="Seu nome"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-[18px] h-[18px] group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20 transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Senha
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-[18px] h-[18px] group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="senha"
                    value={form.senha}
                    onChange={handleChange}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-[18px] h-[18px]" /> : <FiEye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" className="peer sr-only" />
                      <div className="w-[18px] h-[18px] rounded-[5px] border border-white/15 bg-white/[0.04] peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all" />
                      <svg className="absolute top-[3px] left-[3px] w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs text-white/35 group-hover:text-white/50 transition-colors">Manter conectado</span>
                  </label>
                  <button type="button" className="text-xs text-blue-400/70 hover:text-blue-400 font-medium transition-colors">
                    Esqueci a senha
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full relative bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2.5 text-sm">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Entrar na plataforma' : 'Criar minha conta'}
                      <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-white/20 uppercase tracking-wider font-medium">ou</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Toggle */}
            <p className="text-center text-sm text-white/30">
              {isLogin ? 'Ainda não tem acesso?' : 'Já possui uma conta?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                {isLogin ? 'Solicitar acesso' : 'Fazer login'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[11px] text-white/15 tracking-wide">
              &copy; {new Date().getFullYear()} bah! &mdash; Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

