import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Mic, 
  Send,
  Check,
  CheckCheck,
  Clock,
  Star,
  Phone,
  Video,
  Image,
  File,
  X,
  QrCode,
  RefreshCw,
  ArrowDown
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { api } from '../../lib/api'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'

interface Chat {
  id: string
  contact_name: string
  contact_phone: string
  contact_photo?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
  is_pinned: boolean
  is_online?: boolean
}

interface Message {
  id: number
  message_text: string
  is_from_patient: boolean
  status: 'pending' | 'sent' | 'delivered' | 'read'
  sent_at: string
  media_type?: string
  media_url?: string
  quoted_message?: Message
  is_starred: boolean
}

export default function WhatsAppView() {
  const queryClient = useQueryClient()
  const { 
    selectedChatId, 
    setSelectedChatId,
    isWhatsAppConnected,
    whatsAppQR,
    searchQuery 
  } = useAppStore()
  
  const [localSearch, setLocalSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showScrollDown, setShowScrollDown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Mock data for demo (replace with real API calls)
  const chats: Chat[] = [
    {
      id: '1',
      contact_name: 'Jan de Vries',
      contact_phone: '+31612345678',
      last_message: 'Bedankt voor de afspraak bevestiging!',
      last_message_time: new Date().toISOString(),
      unread_count: 2,
      is_pinned: true,
      is_online: true,
    },
    {
      id: '2',
      contact_name: 'Maria Jansen',
      contact_phone: '+31623456789',
      last_message: 'Kan ik mijn afspraak verzetten naar volgende week?',
      last_message_time: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 0,
      is_pinned: false,
      is_online: false,
    },
    {
      id: '3',
      contact_name: 'Peter Bakker',
      contact_phone: '+31634567890',
      last_message: 'Ik heb nog een vraag over de behandeling',
      last_message_time: new Date(Date.now() - 86400000).toISOString(),
      unread_count: 1,
      is_pinned: false,
      is_online: true,
    },
  ]

  const messages: Message[] = selectedChatId ? [
    {
      id: 1,
      message_text: 'Goedemorgen! Ik wil graag een afspraak maken voor een controle.',
      is_from_patient: true,
      status: 'read',
      sent_at: new Date(Date.now() - 7200000).toISOString(),
      is_starred: false,
    },
    {
      id: 2,
      message_text: 'Goedemorgen! Natuurlijk, wanneer zou het u uitkomen? Wij hebben deze week nog beschikbaarheid op woensdag en vrijdag.',
      is_from_patient: false,
      status: 'read',
      sent_at: new Date(Date.now() - 7000000).toISOString(),
      is_starred: false,
    },
    {
      id: 3,
      message_text: 'Vrijdag om 14:00 zou perfect zijn!',
      is_from_patient: true,
      status: 'read',
      sent_at: new Date(Date.now() - 6800000).toISOString(),
      is_starred: false,
    },
    {
      id: 4,
      message_text: 'Uitstekend! Ik heb u ingepland voor vrijdag 20 december om 14:00. U ontvangt nog een bevestiging per email. Tot dan! 😊',
      is_from_patient: false,
      status: 'delivered',
      sent_at: new Date(Date.now() - 6600000).toISOString(),
      is_starred: true,
    },
    {
      id: 5,
      message_text: 'Bedankt voor de afspraak bevestiging!',
      is_from_patient: true,
      status: 'read',
      sent_at: new Date().toISOString(),
      is_starred: false,
    },
  ] : []

  const selectedChat = chats.find(c => c.id === selectedChatId)

  // Filter chats based on search
  const filteredChats = chats.filter(chat => {
    const search = (localSearch || searchQuery).toLowerCase()
    if (!search) return true
    return (
      chat.contact_name.toLowerCase().includes(search) ||
      chat.contact_phone.includes(search) ||
      chat.last_message?.toLowerCase().includes(search)
    )
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle scroll to show/hide scroll down button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Format time for chat list
  const formatChatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'dd/MM/yyyy')
    }
  }

  // Format time for messages
  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm')
  }

  // Get message status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-gray-400" />
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      default:
        return null
    }
  }

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''
    
    msgs.forEach(msg => {
      const msgDate = format(new Date(msg.sent_at), 'yyyy-MM-dd')
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })
    
    return groups
  }

  // Format date divider
  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChatId) return
    // TODO: Send message via API
    console.log('Sending message:', messageInput)
    setMessageInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Show QR code if not connected
  if (!isWhatsAppConnected && whatsAppQR) {
    return (
      <div className="h-full flex items-center justify-center bg-whatsapp-bg">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <QrCode className="w-16 h-16 mx-auto text-whatsapp-green mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect WhatsApp
          </h2>
          <p className="text-gray-500 mb-6">
            Scan this QR code with your WhatsApp mobile app to connect
          </p>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
            <img src={whatsAppQR} alt="WhatsApp QR Code" className="w-48 h-48" />
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Open WhatsApp → Settings → Linked Devices → Link a Device
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-whatsapp-bg">
      {/* Chat List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-3 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Chats</h2>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg text-sm border-0 focus:ring-2 focus:ring-whatsapp-green"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No chats found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    {chat.contact_photo ? (
                      <img src={chat.contact_photo} alt={chat.contact_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl text-white font-medium">
                        {chat.contact_name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  {chat.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate">
                      {chat.contact_name}
                    </span>
                    <span className={`text-xs ${chat.unread_count > 0 ? 'text-whatsapp-green font-medium' : 'text-gray-500'}`}>
                      {chat.last_message_time && formatChatTime(chat.last_message_time)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-sm text-gray-500 truncate">
                      {chat.last_message}
                    </span>
                    {chat.unread_count > 0 && (
                      <span className="w-5 h-5 bg-whatsapp-green text-white text-xs rounded-full flex items-center justify-center">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 px-4 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg text-white font-medium">
                    {selectedChat.contact_name[0].toUpperCase()}
                  </span>
                </div>
                {selectedChat.is_online && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-100" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{selectedChat.contact_name}</h3>
                <p className="text-xs text-gray-500">
                  {selectedChat.is_online ? 'Online' : 'Last seen recently'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 whatsapp-bg custom-scrollbar relative"
          >
            {groupMessagesByDate(messages).map((group) => (
              <div key={group.date}>
                {/* Date Divider */}
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 bg-white/90 rounded-lg text-xs text-gray-600 shadow-sm">
                    {formatDateDivider(group.date)}
                  </span>
                </div>

                {/* Messages */}
                {group.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex mb-1 ${msg.is_from_patient ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`message-bubble ${msg.is_from_patient ? 'received' : 'sent'}`}>
                      {/* Quoted message */}
                      {msg.quoted_message && (
                        <div className="mb-1 p-2 bg-black/5 rounded border-l-4 border-whatsapp-green text-xs">
                          <p className="text-gray-600">{msg.quoted_message.message_text}</p>
                        </div>
                      )}
                      
                      {/* Message text */}
                      <p className="whitespace-pre-wrap">{msg.message_text}</p>
                      
                      {/* Time and status */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {msg.is_starred && (
                          <Star className="w-3 h-3 text-gray-400 fill-current" />
                        )}
                        <span className="text-[10px] text-gray-500">
                          {formatMessageTime(msg.sent_at)}
                        </span>
                        {!msg.is_from_patient && getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />

            {/* Scroll to bottom button */}
            {showScrollDown && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
              >
                <ArrowDown className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-gray-100 border-t border-gray-200">
            <div className="flex items-end gap-2">
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <Smile className="w-6 h-6" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-200 text-gray-600">
                <Paperclip className="w-6 h-6" />
              </button>
              
              <div className="flex-1 bg-white rounded-lg">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message"
                  rows={1}
                  className="w-full px-4 py-2.5 resize-none border-0 rounded-lg focus:ring-0 focus:outline-none text-sm"
                  style={{ maxHeight: '120px' }}
                />
              </div>

              {messageInput.trim() ? (
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-whatsapp-green rounded-full hover:bg-whatsapp-dark text-white transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              ) : (
                <button className="p-3 bg-whatsapp-green rounded-full hover:bg-whatsapp-dark text-white transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center max-w-md">
            <div className="w-64 h-64 mx-auto mb-6">
              <svg viewBox="0 0 303 172" className="w-full h-full text-gray-300">
                <path fill="currentColor" d="M229.565 160.229c32.647 0 59.12-26.473 59.12-59.12 0-32.647-26.473-59.12-59.12-59.12-32.647 0-59.12 26.473-59.12 59.12 0 32.647 26.473 59.12 59.12 59.12z" opacity="0.1"/>
                <path fill="currentColor" d="M73.37 160.229c32.647 0 59.12-26.473 59.12-59.12 0-32.647-26.473-59.12-59.12-59.12-32.647 0-59.12 26.473-59.12 59.12 0 32.647 26.473 59.12 59.12 59.12z" opacity="0.1"/>
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-600 mb-2">WhatsApp Web</h2>
            <p className="text-gray-500">
              Send and receive messages without keeping your phone online.
            </p>
            <p className="text-gray-400 text-sm mt-4">
              Select a chat to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

