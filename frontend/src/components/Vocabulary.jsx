import { useState, useEffect } from 'react'
import {
  Box, Paper, TextField, Button, Typography, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { getVocabulary, addVocabulary, deleteVocabulary } from '../api/client'

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1']
const LEVEL_COLORS = { N5: 'success', N4: 'info', N3: 'primary', N2: 'warning', N1: 'error' }

export default function Vocabulary() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ japanese: '', reading: '', english: '', level: 'N5' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const { data } = await getVocabulary()
      setWords(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.japanese || !form.english) return
    setSaving(true)
    try {
      const { data } = await addVocabulary(form)
      setWords((prev) => [...prev, data])
      setOpen(false)
      setForm({ japanese: '', reading: '', english: '', level: 'N5' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await deleteVocabulary(id)
    setWords((prev) => prev.filter((w) => w.id !== id))
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Vocabulary List</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Word
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              {['Japanese', 'Reading', 'English', 'Level', ''].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : words.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No words yet. Add your first vocabulary!
                </TableCell>
              </TableRow>
            ) : (
              words.map((word) => (
                <TableRow key={word.id} hover>
                  <TableCell sx={{ fontSize: '1.2rem', fontFamily: '"Noto Sans JP", sans-serif' }}>
                    {word.japanese}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{word.reading}</TableCell>
                  <TableCell>{word.english}</TableCell>
                  <TableCell>
                    <Chip
                      label={word.level}
                      color={LEVEL_COLORS[word.level] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleDelete(word.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Vocabulary Word</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Japanese"
            value={form.japanese}
            onChange={(e) => setForm({ ...form, japanese: e.target.value })}
            inputProps={{ style: { fontFamily: '"Noto Sans JP", sans-serif', fontSize: '1.1rem' } }}
            required
          />
          <TextField
            label="Reading (Hiragana/Romaji)"
            value={form.reading}
            onChange={(e) => setForm({ ...form, reading: e.target.value })}
          />
          <TextField
            label="English meaning"
            value={form.english}
            onChange={(e) => setForm({ ...form, english: e.target.value })}
            required
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {LEVELS.map((l) => (
              <Chip
                key={l}
                label={l}
                color={LEVEL_COLORS[l]}
                variant={form.level === l ? 'filled' : 'outlined'}
                onClick={() => setForm({ ...form, level: l })}
                clickable
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!form.japanese || !form.english || saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
