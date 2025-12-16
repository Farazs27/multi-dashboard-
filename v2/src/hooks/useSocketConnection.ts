import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '../store/appStore'

const SOCKET_URL = 'http://localhost:4000'

export function useSocketConnection() {
  const socketRef = useRef<Socket | null>(null)
  const { 
    addEmail, 
    addMessage, 
    updateChat, 
    addNotification,
    setWhatsAppConnected,
    setWhatsAppQR 
  } = useAppStore()

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    // Email events
    socket.on('email_received', (email) => {
      console.log('New email received:', email)
      addEmail(email)
      addNotification({
        id: `email-${email.id}-${Date.now()}`,
        type: 'email',
        title: 'New Email',
        message: `From: ${email.from_email}\n${email.subject}`,
        read: false,
        created_at: new Date().toISOString(),
      })
      
      // Play notification sound
      playNotificationSound()
    })

    socket.on('email_updated', (data) => {
      console.log('Email updated:', data)
    })

    // WhatsApp events
    socket.on('whatsapp_connected', () => {
      console.log('WhatsApp connected')
      setWhatsAppConnected(true)
      setWhatsAppQR(null)
    })

    socket.on('whatsapp_disconnected', () => {
      console.log('WhatsApp disconnected')
      setWhatsAppConnected(false)
    })

    socket.on('whatsapp_qr', (qr: string) => {
      console.log('WhatsApp QR received')
      setWhatsAppQR(qr)
    })

    socket.on('whatsapp_message', (message) => {
      console.log('WhatsApp message received:', message)
      addMessage(message.chat_id, message)
      updateChat(message.chat_id, {
        last_message: message.message_text,
        last_message_time: message.sent_at,
        unread_count: message.is_from_patient ? 1 : 0,
      })
      
      if (message.is_from_patient) {
        addNotification({
          id: `whatsapp-${message.id}-${Date.now()}`,
          type: 'whatsapp',
          title: 'New WhatsApp Message',
          message: message.message_text.substring(0, 100),
          read: false,
          created_at: new Date().toISOString(),
        })
        playNotificationSound()
      }
    })

    socket.on('whatsapp_status_update', (data) => {
      console.log('WhatsApp status update:', data)
      // Update message status (sent → delivered → read)
    })

    socket.on('typing', (data) => {
      console.log('User typing:', data)
    })

    return () => {
      socket.disconnect()
    }
  }, [addEmail, addMessage, updateChat, addNotification, setWhatsAppConnected, setWhatsAppQR])

  return socketRef.current
}

function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignore audio play errors (e.g., autoplay policy)
    })
  } catch (error) {
    // Ignore audio errors
  }
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  const emit = (event: string, data?: unknown) => {
    socketRef.current?.emit(event, data)
  }

  const on = (event: string, callback: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, callback)
  }

  const off = (event: string) => {
    socketRef.current?.off(event)
  }

  return { emit, on, off, socket: socketRef.current }
}

