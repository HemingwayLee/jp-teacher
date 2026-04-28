import { useState, useRef, useEffect } from 'react'
import {
  Box, Paper, TextField, IconButton, Typography,
  CircularProgress, Avatar, Tooltip, ToggleButton,
  ToggleButtonGroup, Snackbar, Alert,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import PersonIcon from '@mui/icons-material/Person'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import { sendMessage } from '../api/client'

const WELCOME = {
  role: 'assistant',
  content: "こんにちは！I'm your Japanese teacher. Ask me anything — grammar, vocabulary, phrases, or let's practice conversation! You can also speak using the 🎤 button.\n(Hello! How can I help you today?)",
}

const STT_LANGS = [
  { value: 'ja-JP', label: '日本語' },
  { value: 'en-US', label: 'EN' },
]

export default function Chat() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [sttLang, setSttLang] = useState('ja-JP')
  const [interim, setInterim] = useState('')
  const [sttError, setSttError] = useState('')
  const [ttsMode, setTtsMode] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  const recognitionRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interim])

  useEffect(() => () => {
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
  }, [])

  const stripTranslations = (text) =>
    text.replace(/\([^)]*[a-zA-Z][^)]*\)/g, '').replace(/\s+/g, ' ').trim()

  const speak = (text, index) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(stripTranslations(text))
    utter.lang = 'ja-JP'
    utter.rate = 0.9
    utter.onstart = () => setSpeakingIndex(index)
    utter.onend = () => setSpeakingIndex(null)
    utter.onerror = () => setSpeakingIndex(null)
    window.speechSynthesis.speak(utter)
  }

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel()
    setSpeakingIndex(null)
  }

  const submit = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const { data } = await sendMessage(text, history)
      const assistantMsg = { role: 'assistant', content: data.response }
      setMessages((prev) => {
        const updated = [...prev, assistantMsg]
        if (ttsMode) speak(data.response, updated.length - 1)
        return updated
      })
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttError('Speech recognition is not supported. Use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = sttLang
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => { setIsListening(true); setInterim('') }

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalTranscript += t
        else interimTranscript += t
      }
      setInterim(interimTranscript)
      if (finalTranscript) {
        setInput((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript))
        setInterim('')
      }
    }

    recognition.onend = () => { setIsListening(false); setInterim('') }

    recognition.onerror = (e) => {
      setIsListening(false)
      setInterim('')
      if (e.error !== 'no-speech') setSttError(`Microphone error: ${e.error}`)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="h5" fontWeight={600}>
          Practice Conversation
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {speakingIndex !== null && (
            <Tooltip title="Stop speaking">
              <IconButton size="small" onClick={stopSpeaking} color="error">
                <StopCircleIcon />
              </IconButton>
            </Tooltip>
          )}
          <ToggleButtonGroup
            value={ttsMode ? 'voice' : 'text'}
            exclusive
            onChange={(_, v) => {
              if (!v) return
              if (v === 'text') stopSpeaking()
              setTtsMode(v === 'voice')
            }}
            size="small"
          >
            <ToggleButton value="text" sx={{ px: 1.5, gap: 0.5, fontSize: '0.75rem' }}>
              <VolumeOffIcon fontSize="small" />
              Text
            </ToggleButton>
            <ToggleButton value="voice" sx={{ px: 1.5, gap: 0.5, fontSize: '0.75rem' }}>
              <VolumeUpIcon fontSize="small" />
              Text + Voice
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Message list */}
      <Paper
        elevation={2}
        sx={{ flex: 1, overflow: 'auto', p: 2, mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
            }}
          >
            <Avatar sx={{ bgcolor: msg.role === 'user' ? 'secondary.main' : 'primary.main', width: 36, height: 36 }}>
              {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
            </Avatar>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: msg.role === 'user' ? 'secondary.light' : 'background.paper',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  outline: speakingIndex === i ? '2px solid' : 'none',
                  outlineColor: 'primary.main',
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {msg.content}
                </Typography>
              </Paper>

              {/* Replay TTS button for assistant messages */}
              {msg.role === 'assistant' && (
                <Tooltip title={speakingIndex === i ? 'Speaking…' : 'Play voice'}>
                  <IconButton
                    size="small"
                    onClick={() => speakingIndex === i ? stopSpeaking() : speak(msg.content, i)}
                    sx={{ mt: 0.5, color: speakingIndex === i ? 'primary.main' : 'grey.400' }}
                  >
                    {speakingIndex === i
                      ? <GraphicEqIcon fontSize="small" sx={{ animation: 'eq 0.8s steps(3) infinite', '@keyframes eq': { '0%': { opacity: 1 }, '50%': { opacity: 0.4 }, '100%': { opacity: 1 } } }} />
                      : <VolumeUpIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <CircularProgress size={20} />
          </Box>
        )}
        <div ref={bottomRef} />
      </Paper>

      {/* Input row */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <ToggleButtonGroup
          value={sttLang}
          exclusive
          onChange={(_, v) => v && setSttLang(v)}
          size="small"
          sx={{ height: 40, alignSelf: 'center' }}
        >
          {STT_LANGS.map((l) => (
            <ToggleButton key={l.value} value={l.value} sx={{ px: 1.2, fontSize: '0.7rem' }}>
              {l.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Tooltip title={isListening ? 'Stop recording' : `Speak (${sttLang === 'ja-JP' ? '日本語' : 'English'})`}>
          <IconButton
            onClick={toggleListening}
            sx={{
              width: 48, height: 48, flexShrink: 0,
              bgcolor: isListening ? 'error.main' : 'grey.200',
              color: isListening ? 'white' : 'grey.700',
              '&:hover': { bgcolor: isListening ? 'error.dark' : 'grey.300' },
              ...(isListening && {
                animation: 'micPulse 1.4s infinite',
                '@keyframes micPulse': {
                  '0%':   { boxShadow: '0 0 0 0 rgba(211,47,47,0.45)' },
                  '70%':  { boxShadow: '0 0 0 10px rgba(211,47,47,0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(211,47,47,0)' },
                },
              }),
            }}
          >
            {isListening ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>

        <TextField
          fullWidth
          variant="outlined"
          placeholder={isListening ? 'Listening…' : 'Type or speak in English / 日本語…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
          disabled={loading}
          multiline
          maxRows={3}
          helperText={interim ? `…${interim}` : undefined}
          FormHelperTextProps={{ sx: { color: 'text.disabled', fontStyle: 'italic', mt: 0.5 } }}
        />

        <IconButton
          onClick={submit}
          disabled={!input.trim() || loading}
          sx={{
            bgcolor: 'primary.main', color: 'white', borderRadius: 2, px: 2, height: 56, flexShrink: 0,
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>

      <Snackbar open={!!sttError} autoHideDuration={4000} onClose={() => setSttError('')}>
        <Alert severity="warning" onClose={() => setSttError('')}>{sttError}</Alert>
      </Snackbar>
    </Box>
  )
}
