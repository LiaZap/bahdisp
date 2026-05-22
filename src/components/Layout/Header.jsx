import { useState, useEffect } from 'react'
import { FiWifi, FiWifiOff, FiBell, FiSearch, FiX } from 'react-icons/fi'

export default function Header({ title }) {
  const [apiStatus, setApiStatus] = useState('checking')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    checkApiStatus()
    const interval = setInterval(checkApiStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function checkApiStatus() {
    try {
      const res = await fetch('/api/health')
      setApiStatus(res.ok ? 'connected' : 'disconnected')
    } catch {
      setApiStatus('disconnected')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <FiSearch className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-sm text-gray-600 w-48 placeholder-gray-400"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* API Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            apiStatus === 'connected'
              ? 'bg-green-50 text-green-700 border-green-200'
              : apiStatus === 'checking'
              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {apiStatus === 'connected' ? (
            <FiWifi className="w-3.5 h-3.5" />
          ) : (
            <FiWifiOff className="w-3.5 h-3.5" />
          )}
          {apiStatus === 'connected'
            ? 'API Conectada'
            : apiStatus === 'checking'
            ? 'Verificando...'
            : 'API Desconectada'}
        </div>
      </div>
    </header>
  )
}
