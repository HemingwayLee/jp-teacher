import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const sendMessage = (message, history) =>
  api.post('/chat', { message, history })

export const getVocabulary = () => api.get('/vocabulary')

export const addVocabulary = (word) => api.post('/vocabulary', word)

export const deleteVocabulary = (id) => api.delete(`/vocabulary/${id}`)

export const translateText = (text, direction) =>
  api.post('/translate', { text, direction })

export const getSettings = () => api.get('/settings')

export const saveSettings = (host, model) =>
  api.post('/settings', { host, model })

export const testConnection = (host, model) =>
  api.post('/settings/test', { host, model })

export default api
