import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, AlertCircle } from 'lucide-react';

const WEBHOOK_URL =
  'https://emmanuelb.app.n8n.cloud/webhook/57b03f5e-3d52-434c-80db-bdc8cf5d4f6b';

const SESSION_KEY = 'aeropulse_chat_session_id';

// Genera (o recupera) un sessionId único por visitante
function getOrCreateSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

const SESSION_ID = getOrCreateSessionId();

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: '¡Hola! Soy tu asistente de operaciones. ¿En qué te ayudo?',
};

export default function AiChatWidget({ dashboardContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, loading]);

  // Foco en el input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: SESSION_ID,
          context: dashboardContext,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // El campo de respuesta puede venir como "response" o como texto directo
      const reply =
        data?.response ||
        data?.output ||
        data?.text ||
        (typeof data === 'string' ? data : null) ||
        'Sin respuesta del asistente.';

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: reply },
      ]);
    } catch (err) {
      console.error('[AiChatWidget] Error al contactar el webhook:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          role: 'error',
          text: 'No se pudo conectar con el asistente. Verifica tu conexión e inténtalo de nuevo.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, dashboardContext]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Panel del chat ───────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            width: '360px',
            maxHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            zIndex: 1100,
            overflow: 'hidden',
            border: '1px solid #EEF0E8',
          }}
        >
          {/* Cabecera */}
          <div
            style={{
              background: 'linear-gradient(135deg, #143A32, #1f5247)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'rgba(217,241,117,0.2)',
                border: '1.5px solid rgba(217,241,117,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Bot size={17} color="#D9F175" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
                Asistente AeroPulse
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '1px' }}>
                Powered by n8n · IA Operacional
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
              }}
              title="Cerrar chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#FAFAF8',
            }}
          >
            {messages.map(msg => (
              <ChatBubble key={msg.id} msg={msg} />
            ))}

            {/* "Escribiendo…" */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={avatarStyle('bot')}>
                  <Bot size={13} color="#143A32" />
                </div>
                <div style={{ ...bubbleStyle('assistant'), paddingTop: '10px', paddingBottom: '10px' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #EEF0E8',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              backgroundColor: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                resize: 'none',
                border: '1.5px solid #E8EAE2',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                lineHeight: 1.45,
                backgroundColor: loading ? '#F6F7F2' : '#FFFFFF',
                color: '#191E1A',
                transition: 'border-color 0.15s',
                maxHeight: '100px',
                overflowY: 'auto',
              }}
              onFocus={e => { e.target.style.borderColor = '#143A32'; }}
              onBlur={e => { e.target.style.borderColor = '#E8EAE2'; }}
            />
            <button
              onClick={sendMessage}
              type="button"
              disabled={!input.trim() || loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                border: 'none',
                backgroundColor: !input.trim() || loading ? '#E8EAE2' : '#143A32',
                color: !input.trim() || loading ? '#959E96' : '#D9F175',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'background-color 0.15s',
              }}
              title="Enviar mensaje (Enter)"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Botón flotante ───────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        type="button"
        title={open ? 'Cerrar asistente' : 'Abrir asistente de IA'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          border: 'none',
          background: open
            ? 'linear-gradient(135deg, #EF4444, #DC2626)'
            : 'linear-gradient(135deg, #143A32, #1f5247)',
          color: open ? '#FFFFFF' : '#D9F175',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(20,58,50,0.35), 0 2px 8px rgba(0,0,0,0.12)',
          zIndex: 1100,
          transition: 'all 0.2s ease',
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

/* ── Sub-componentes internos ───────────────────── */

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ ...bubbleStyle('user'), maxWidth: '82%' }}>
          <MessageText text={msg.text} />
        </div>
        <div style={avatarStyle('user')}>
          <User size={13} color="#FFFFFF" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ ...avatarStyle('bot'), backgroundColor: '#FEF2F2', border: '1.5px solid #FECACA' }}>
          <AlertCircle size={13} color="#DC2626" />
        </div>
        <div style={{ ...bubbleStyle('error'), maxWidth: '82%' }}>
          <MessageText text={msg.text} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <div style={avatarStyle('bot')}>
        <Bot size={13} color="#143A32" />
      </div>
      <div style={{ ...bubbleStyle('assistant'), maxWidth: '82%' }}>
        <MessageText text={msg.text} />
      </div>
    </div>
  );
}

// Renderiza saltos de línea dentro del texto
function MessageText({ text }) {
  return (
    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</span>
  );
}

// Indicador "Escribiendo..." con tres puntos animados
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '14px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#143A32',
            opacity: 0.4,
            animation: `apy-bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes apy-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%           { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function avatarStyle(role) {
  return {
    width: 26,
    height: 26,
    borderRadius: '50%',
    backgroundColor: role === 'user' ? '#143A32' : '#F0F3E8',
    border: `1.5px solid ${role === 'user' ? '#1f5247' : '#E0E5D6'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  };
}

function bubbleStyle(role) {
  const base = {
    padding: '9px 13px',
    borderRadius: '14px',
    fontSize: '13px',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  };
  if (role === 'user')      return { ...base, backgroundColor: '#143A32', color: '#FFFFFF', borderBottomRightRadius: '4px' };
  if (role === 'error')     return { ...base, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderBottomLeftRadius: '4px' };
  return { ...base, backgroundColor: '#FFFFFF', color: '#191E1A', border: '1px solid #EEF0E8', borderBottomLeftRadius: '4px' };
}

