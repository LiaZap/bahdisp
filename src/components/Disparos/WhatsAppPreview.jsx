import { FiCamera, FiPhone, FiMoreVertical, FiSmile, FiMic, FiPaperclip, FiEye } from 'react-icons/fi'

export default function WhatsAppPreview({ mensagem, nomeRemetente, destinatario }) {
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <FiEye className="w-3.5 h-3.5 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-600">Preview (apenas visualização)</h4>
      </div>

      {/* Phone Frame */}
      <div className="w-[320px] bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl shadow-gray-400/30">
        {/* Status Bar */}
        <div className="bg-[#075e54] rounded-t-[2rem] px-5 pt-3 pb-0">
          <div className="flex items-center justify-between text-white text-[10px] mb-2">
            <span>{hora}</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M2 17h2v5H2zm4-5h2v10H6zm4-4h2v14h-2zm4-3h2v17h-2zm4-2h2v19h-2z"/></svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="flex items-center gap-3 pb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <div className="w-9 h-9 bg-gray-400 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{destinatario || 'Destinatário'}</p>
              <p className="text-green-200 text-[10px]">online</p>
            </div>
            <div className="flex items-center gap-4 text-white">
              <FiCamera className="w-4 h-4" />
              <FiPhone className="w-4 h-4" />
              <FiMoreVertical className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Chat Background */}
        <div className="bg-[#e5ddd5] min-h-[380px] px-3 py-4 relative"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9c2b8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          {/* System Message */}
          <div className="flex justify-center mb-3">
            <span className="bg-[#e1f2fb] text-[10px] text-gray-600 px-3 py-1 rounded-lg shadow-sm">
              As mensagens são protegidas com criptografia de ponta a ponta.
            </span>
          </div>

          {/* Message Bubble */}
          <div className="flex justify-start mb-2">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm max-w-[85%] px-3 py-2 relative">
              <p className="text-[11px] text-green-700 font-semibold mb-1">
                {nomeRemetente || 'bah!'}
              </p>
              <div className="text-[12.5px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                {mensagem || (
                  <span className="italic text-gray-400">
                    A mensagem que você digitar aparecerá aqui...
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-400">{hora}</span>
                <svg className="w-4 h-3 text-blue-500" fill="currentColor" viewBox="0 0 16 11">
                  <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146l-.311.31a.445.445 0 0 0-.14.337c0 .136.046.249.14.337l2.995 2.83a.63.63 0 0 0 .233.146c.085.029.178.043.281.043a.63.63 0 0 0 .281-.043.55.55 0 0 0 .233-.146l6.87-8.474a.478.478 0 0 0 .126-.337.392.392 0 0 0-.126-.285l-.323-.311z"/>
                  <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.2-1.136-.311.311 1.789 1.688a.63.63 0 0 0 .233.146c.085.029.178.043.281.043a.63.63 0 0 0 .281-.043.55.55 0 0 0 .233-.146l6.87-8.474a.478.478 0 0 0 .126-.337.392.392 0 0 0-.126-.285l-.323-.311z" opacity=".35"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="bg-[#f0f0f0] rounded-b-[2rem] px-3 py-2 flex items-center gap-2">
          <FiSmile className="w-5 h-5 text-gray-500" />
          <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-gray-400 flex-1">Mensagem</span>
            <FiPaperclip className="w-4 h-4 text-gray-400" />
            <FiCamera className="w-4 h-4 text-gray-400" />
          </div>
          <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center">
            <FiMic className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
