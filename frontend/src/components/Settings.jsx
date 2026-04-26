import { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, Button, Paper, Stack,
  CircularProgress, Alert, Chip, Divider,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { getSettings, saveSettings, testConnection } from '../api/client'

export default function Settings() {
  const [host, setHost] = useState('')
  const [model, setModel] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | { status, models?, message }

  useEffect(() => {
    getSettings().then((r) => {
      setHost(r.data.host)
      setModel(r.data.model)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await saveSettings(host, model)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await testConnection(host, model)
      setTestResult(r.data)
    } catch {
      setTestResult({ status: 'error', message: 'Request to backend failed.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Ollama Server Settings
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Ollama Host"
            value={host}
            onChange={(e) => { setHost(e.target.value); setSaved(false); setTestResult(null) }}
            placeholder="http://host.docker.internal:11434"
            fullWidth
          />
          <TextField
            label="Model"
            value={model}
            onChange={(e) => { setModel(e.target.value); setSaved(false); setTestResult(null) }}
            placeholder="gemma3:12b"
            fullWidth
          />

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleTest}
              disabled={testing}
              startIcon={testing ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {testing ? 'Testing…' : 'Test Connection'}
            </Button>
          </Stack>

          {saved && (
            <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
              Settings saved.
            </Alert>
          )}

          {testResult && (
            <>
              <Divider />
              {testResult.status === 'ok' ? (
                <Box>
                  <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ mb: 1.5 }}>
                    Connected to Ollama successfully.
                  </Alert>
                  {testResult.models?.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Available models:
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {testResult.models.map((m) => (
                          <Chip
                            key={m}
                            label={m}
                            size="small"
                            color={m === model ? 'primary' : 'default'}
                            variant={m === model ? 'filled' : 'outlined'}
                            onClick={() => setModel(m)}
                          />
                        ))}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Click a model to select it.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="error" icon={<ErrorOutlineIcon />}>
                  {testResult.message}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
