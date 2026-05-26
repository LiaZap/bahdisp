import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const vagasApi = {
  list: () => api.get('/vagas'),
  create: (data) => api.post('/vagas', data),
  update: (id, data) => api.put(`/vagas/${id}`, data),
  delete: (id) => api.delete(`/vagas/${id}`),
}

export const medicosApi = {
  list: (params) => api.get('/medicos', { params }),
  tags: () => api.get('/medicos/tags'),
  create: (data) => api.post('/medicos', data),
  update: (id, data) => api.put(`/medicos/${id}`, data),
  delete: (id) => api.delete(`/medicos/${id}`),
}

export const disparosApi = {
  list: (params) => api.get('/disparos', { params }),
  enviar: (data) => api.post('/disparos/enviar', data),
  enviarSimples: (data) => api.post('/disparos/simples', data),
  statusProtocolo: (protocolo) => api.get(`/disparos/status/${protocolo}`),
  detalhesProtocolo: (protocolo) => api.get(`/disparos/protocolo/${protocolo}`),
  stats: () => api.get('/disparos/stats'),
  historico: () => api.get('/disparos/historico/protocolos'),
  exportCsvUrl: (dias = 30) => `/api/disparos/export.csv?dias=${dias}`,
}

export const templatesApi = {
  list: () => api.get('/templates'),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
}

export const agendamentosApi = {
  list: () => api.get('/agendamentos'),
  create: (data) => api.post('/agendamentos', data),
  cancel: (id) => api.delete(`/agendamentos/${id}`),
}

export const settingsApi = {
  quietHours: () => api.get('/settings/quiet-hours'),
  saveQuietHours: (data) => api.put('/settings/quiet-hours', data),
}

export const instancesApi = {
  list: () => api.get('/instances'),
  create: (data) => api.post('/instances', data),
  connect: (id, phone) => api.post(`/instances/${id}/connect`, { phone }),
  status: (id) => api.get(`/instances/${id}/status`),
  setDefault: (id) => api.post(`/instances/${id}/default`),
  setWebhook: (id, url) => api.post(`/instances/${id}/webhook`, { url }),
  delete: (id) => api.delete(`/instances/${id}`),
}

export default api
