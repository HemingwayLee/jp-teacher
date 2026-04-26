import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import Navigation from './components/Navigation'
import Chat from './components/Chat'
import Vocabulary from './components/Vocabulary'
import Translate from './components/Translate'
import Settings from './components/Settings'

export default function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/translate" element={<Translate />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Box>
    </Box>
  )
}
