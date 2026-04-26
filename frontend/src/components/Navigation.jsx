import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Tabs, Tab, Box,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import TranslateIcon from '@mui/icons-material/Translate'
import SettingsIcon from '@mui/icons-material/Settings'

const tabs = [
  { label: 'Chat', path: '/chat', icon: <ChatIcon /> },
  { label: 'Vocabulary', path: '/vocabulary', icon: <MenuBookIcon /> },
  { label: 'Translate', path: '/translate', icon: <TranslateIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
]

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const current = tabs.findIndex((t) => location.pathname.startsWith(t.path))

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ mr: 4, fontWeight: 700, letterSpacing: 1 }}>
          🇯🇵 JP Teacher
        </Typography>
        <Tabs
          value={current === -1 ? 0 : current}
          onChange={(_, v) => navigate(tabs[v].path)}
          textColor="inherit"
          indicatorColor="secondary"
        >
          {tabs.map((t) => (
            <Tab key={t.path} label={t.label} icon={t.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Toolbar>
    </AppBar>
  )
}
