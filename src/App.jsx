import { useEffect, useRef, useState } from 'react'
import './App.css'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4'

const FADE_DURATION = 250
const FADE_OUT_THRESHOLD = 0.55
const LOOP_RESTART_DELAY = 100
const MAX_TOKENS = 450
const MAX_CHARS = 3000

function StarIcon(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...props}>
      <path
        d="M6 0.5L7.2 4.3L11 5.5L7.2 6.7L6 10.5L4.8 6.7L1 5.5L4.8 4.3L6 0.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function AiSparkleIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
      <path
        d="M7 1L8.4 5.2L12.5 6.6L8.4 8L7 12.2L5.6 8L1.5 6.6L5.6 5.2L7 1Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ArrowUpIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="#000000" />
      <path
        d="M11 11H21L11 21H21"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VideoBackground() {
  const videoRef = useRef(null)
  const fadingOutRef = useRef(false)
  const rafRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const cancelFade = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    const animateOpacity = (target, duration) => {
      cancelFade()
      const start = parseFloat(video.style.opacity || '0')
      const delta = target - start
      const startTime = performance.now()

      const step = (now) => {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        video.style.opacity = String(start + delta * t)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rafRef.current = null
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    const fadeIn = () => animateOpacity(1, FADE_DURATION)
    const fadeOut = () => animateOpacity(0, FADE_DURATION)

    const handleLoadedData = () => {
      fadeIn()
    }

    const handleTimeUpdate = () => {
      if (fadingOutRef.current) return
      if (!video.duration) return
      const remaining = video.duration - video.currentTime
      if (remaining <= FADE_OUT_THRESHOLD) {
        fadingOutRef.current = true
        fadeOut()
      }
    }

    const handleEnded = () => {
      cancelFade()
      video.style.opacity = '0'
      setTimeout(() => {
        video.currentTime = 0
        video.play()
        fadingOutRef.current = false
        fadeIn()
      }, LOOP_RESTART_DELAY)
    }

    video.style.opacity = '0'
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      cancelFade()
    }
  }, [])

  return (
    <div className="video-background">
      <video
        ref={videoRef}
        className="bg-video"
        src={VIDEO_URL}
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{ opacity: 0 }}
      />
    </div>
  )
}

function Navigation() {
  return (
    <nav className="navbar">
      <div className="brand">
        <LogoMark />
        <span className="brand-name">Zyra</span>
      </div>

      <div className="nav-menu">
        <a href="#docs">Документация</a>
        <a href="#contacts">Контакты</a>
      </div>

      <div className="nav-actions">
        <button className="btn btn-ghost" type="button">
          Начать
        </button>
        <button className="btn btn-dark" type="button">
          Войти
        </button>
      </div>
    </nav>
  )
}

function Badge() {
  return (
    <div className="badge">
      <span className="badge-new">
        <StarIcon />
        New
      </span>
      <span className="badge-text">Узнай, что возможно с Zyra</span>
    </div>
  )
}

function Header() {
  return (
    <>
      <h1 className="hero-title">Диалог с искусственным интеллектом</h1>
      <p className="hero-subtitle">
        Задавай вопросы и получай точные ответы в реальном времени. Zyra —
        интерфейс для общения с искусственным интеллектом.
      </p>
    </>
  )
}

function ChatInput() {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const replyTimerRef = useRef(null)

  const tokensUsed = Math.min(MAX_TOKENS, Math.round(value.length / 4))
  const hasMessages = messages.length > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => () => clearTimeout(replyTimerRef.current), [])

  const sendMessage = () => {
    const trimmed = value.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setValue('')

    // pulse the send button
    setSending(true)
    setTimeout(() => setSending(false), 260)

    // simulate the assistant "thinking", then answer with the stub
    setTyping(true)
    replyTimerRef.current = setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '404 — не найдено' },
      ])
    }, 700)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={`chat-block${hasMessages ? ' chat-block-expanded' : ''}`}>
      <div className="chat-row chat-row-top">
        <span>
          {tokensUsed}/{MAX_TOKENS} токенов
        </span>
        <span className="chat-model">
          <AiSparkleIcon />
          На основе GPT-4o
        </span>
      </div>

      {hasMessages && (
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message chat-message-${m.role}`}>
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="chat-message chat-message-assistant chat-typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="chat-input-wrap">
        <input
          type="text"
          className="chat-input"
          placeholder="Спроси Zyra о чём угодно..."
          value={value}
          maxLength={MAX_CHARS}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={`chat-send-btn${sending ? ' chat-send-btn-active' : ''}`}
          onClick={sendMessage}
          aria-label="Отправить"
        >
          <ArrowUpIcon />
        </button>
      </div>

      <div className="chat-row chat-row-bottom">
        <span />
        <span>
          {value.length}/{MAX_CHARS.toLocaleString('ru-RU')}
        </span>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="hero-page">
      <VideoBackground />

      <Navigation />

      <div className="hero-content">
        <Badge />
        <Header />
        <ChatInput />
      </div>
    </div>
  )
}

export default App
