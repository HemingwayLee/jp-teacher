import { useState } from 'react'
import {
  Box, Paper, TextField, Button, Typography,
  ToggleButton, ToggleButtonGroup, CircularProgress, Divider,
} from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import TranslateIcon from '@mui/icons-material/Translate'
import { translateText } from '../api/client'

export default function Translate() {
  const [direction, setDirection] = useState('en-ja')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTranslate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult('')
    try {
      const { data } = await translateText(input.trim(), direction)
      setResult(data.translation)
    } catch {
      setResult('Translation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const swap = () => {
    setDirection((d) => (d === 'en-ja' ? 'ja-en' : 'en-ja'))
    setInput(result)
    setResult('')
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Translation
      </Typography>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ToggleButtonGroup
            value={direction}
            exclusive
            onChange={(_, v) => v && setDirection(v)}
            size="small"
          >
            <ToggleButton value="en-ja">English → 日本語</ToggleButton>
            <ToggleButton value="ja-en">日本語 → English</ToggleButton>
          </ToggleButtonGroup>
          <Button startIcon={<SwapHorizIcon />} onClick={swap} size="small" variant="outlined">
            Swap
          </Button>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label={direction === 'en-ja' ? 'English text' : '日本語テキスト'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <TranslateIcon />}
          onClick={handleTranslate}
          disabled={!input.trim() || loading}
          fullWidth
          sx={{ mb: 3 }}
        >
          {loading ? 'Translating…' : 'Translate'}
        </Button>

        {result && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {direction === 'en-ja' ? '日本語' : 'English'} translation:
            </Typography>
            <Paper
              variant="outlined"
              sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}
            >
              <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                {result}
              </Typography>
            </Paper>
          </>
        )}
      </Paper>
    </Box>
  )
}
