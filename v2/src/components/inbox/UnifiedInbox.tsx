import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Mail, 
  MessageCircle, 
  Search, 
  Filter, 
  Star,
  Clock,
  User,
  Zap,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { api } from '../../lib/api'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

interface UnifiedMessage {
  id: number
  type: 'email' | 'whatsapp'
  from: string
  from_name?: string
  subject?: string
  preview: string
  timestamp: string
  is_read: boolean
  is_starred: boolean
  category?: string
  patient_id?: number
}

export default function UnifiedInbox() {
  const { searchQuery, setActiveView, setSelectedEmailId, setSelectedChatId } = useAppStore()
  const [localSearch, setLocalSearch] = useState('')
  const [filterChannel, setFilterChannel] = useState<'all' | 'email' | 'whatsapp'>('all')
  const [selectedMessage, setSelectedMessage] = useState<UnifiedMessage | null>(null)

  // Fetch emails
  const { data: emailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ['emails'],
    queryFn: () => api.getEmails(),
  })

  // Transform emails to unified format - handle both array and object response
  const emailsArray = Array.isArray(emailsData) ? emailsData : (emailsData?.emails || emailsData || [])
  const emails: UnifiedMessage[] = (Array.isArray(emailsArray) ? emailsArray : []).map((email: any) => ({
    id: email.id,
    type: 'email' as const,
    from: email.email,
    from_name: email.from_name,
    subject: email.subject,
    preview: email.message?.substring(0, 100) || '',
    timestamp: email.timestamp,
    is_read: !!email.read_status,
    is_starred: !!email.starred,
    category: email.category,
    patient_id: email.patient_id,
  }))

  // Mock WhatsApp messages (replace with real API)
  const whatsappMessages: UnifiedMessage[] = [
    {
      id: 1001,
      type: 'whatsapp',
      from: '+31612345678',
      from_name: 'Jan de Vries',
      preview: 'Bedankt voor de afspraak bevestiging!',
      timestamp: new Date().toISOString(),
      is_read: false,
      is_starred: false,
      category: 'Afspraak maken',
    },
    {
      id: 1002,
      type: 'whatsapp',
      from: '+31623456789',
      from_name: 'Maria Jansen',
      preview: 'Kan ik mijn afspraak verzetten naar volgende week?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      is_read: true,
      is_starred: true,
      category: 'Afspraak maken',
    },
  ]

  // Combine and sort all messages
  const allMessages = [...emails, ...whatsappMessages]
    .filter(msg => {
      if (filterChannel !== 'all' && msg.type !== filterChannel) return false
      
      const search = (localSearch || searchQuery).toLowerCase()
      if (!search) return true
      
      return (
        msg.from.toLowerCase().includes(search) ||
        msg.from_name?.toLowerCase().includes(search) ||
        msg.subject?.toLowerCase().includes(search) ||
        msg.preview.toLowerCase().includes(search)
      )
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Format date
  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM d')
    }
  }

  // Get category color
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-500'
    const colors: Record<string, string> = {
      'Afspraak maken': 'bg-blue-500',
      'Behandeling informatie': 'bg-purple-500',
      'Spoedzorg': 'bg-red-500',
      'Tarieven': 'bg-amber-500',
      'Verzekering': 'bg-cyan-500',
      'Klacht': 'bg-pink-500',
      'Algemene vraag': 'bg-gray-500',
    }
    return colors[category] || 'bg-gray-500'
  }

  // Handle message click
  const handleMessageClick = (msg: UnifiedMessage) => {
    setSelectedMessage(msg)
    if (msg.type === 'email') {
      setSelectedEmailId(msg.id)
    } else {
      // For WhatsApp, we'd set the chat ID
    }
  }

  // Open in dedicated view
  const handleOpenInView = (msg: UnifiedMessage) => {
    if (msg.type === 'email') {
      setSelectedEmailId(msg.id)
      setActiveView('email')
    } else {
      setActiveView('whatsapp')
    }
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Message List */}
      <div className="w-[450px] bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Unified Inbox</h2>
            <span className="text-sm text-gray-500">
              {allMessages.filter(m => !m.is_read).length} unread
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search all messages..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterChannel('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterChannel === 'all'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterChannel('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterChannel === 'email'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setFilterChannel('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterChannel === 'whatsapp'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {emailsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-sm text-gray-500">Loading messages...</p>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No messages found</p>
            </div>
          ) : (
            allMessages.map((msg) => (
              <div
                key={`${msg.type}-${msg.id}`}
                onClick={() => handleMessageClick(msg)}
                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !msg.is_read ? 'bg-blue-50/50' : ''
                } ${selectedMessage?.id === msg.id && selectedMessage?.type === msg.type ? 'bg-primary-50' : ''}`}
              >
                {/* Channel Icon */}
                <div className={`mt-1 p-1.5 rounded-full ${
                  msg.type === 'email' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {msg.type === 'email' ? (
                    <Mail className="w-4 h-4 text-blue-600" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-sm truncate ${!msg.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {msg.from_name || msg.from}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {msg.is_starred && (
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      )}
                      <span className="text-xs text-gray-500">
                        {formatMessageDate(msg.timestamp)}
                      </span>
                    </div>
                  </div>

                  {msg.subject && (
                    <p className={`text-sm truncate mb-0.5 ${!msg.is_read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {msg.subject}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {msg.category && (
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getCategoryColor(msg.category)}`} />
                    )}
                    <p className="text-xs text-gray-500 truncate">
                      {msg.preview}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail / Stats */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <MessageDetail 
            message={selectedMessage} 
            onOpenInView={() => handleOpenInView(selectedMessage)}
          />
        ) : (
          <InboxStats emails={emails} whatsappMessages={whatsappMessages} />
        )}
      </div>
    </div>
  )
}

// Message Detail Component
function MessageDetail({ message, onOpenInView }: { message: UnifiedMessage; onOpenInView: () => void }) {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              message.type === 'email' ? 'bg-blue-100' : 'bg-green-100'
            }`}>
              {message.type === 'email' ? (
                <Mail className="w-5 h-5 text-blue-600" />
              ) : (
                <MessageCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {message.from_name || message.from}
              </h3>
              <p className="text-sm text-gray-500">{message.from}</p>
            </div>
          </div>
          
          <button
            onClick={onOpenInView}
            className="btn btn-secondary text-sm"
          >
            Open in {message.type === 'email' ? 'Email' : 'WhatsApp'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {message.subject && (
          <h2 className="text-lg font-medium text-gray-900 mt-4">
            {message.subject}
          </h2>
        )}

        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {format(new Date(message.timestamp), 'PPpp')}
          </span>
          {message.category && (
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              {message.category}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {message.preview}
        </p>
      </div>
    </div>
  )
}

// Inbox Stats Component
function InboxStats({ emails, whatsappMessages }: { emails: UnifiedMessage[]; whatsappMessages: UnifiedMessage[] }) {
  const totalMessages = emails.length + whatsappMessages.length
  const unreadEmails = emails.filter(e => !e.is_read).length
  const unreadWhatsApp = whatsappMessages.filter(m => !m.is_read).length

  // Category breakdown
  const categoryCount: Record<string, number> = {}
  ;[...emails, ...whatsappMessages].forEach(msg => {
    const cat = msg.category || 'Uncategorized'
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Unified Inbox Overview
          </h2>
          <p className="text-gray-500">
            All your patient communications in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{emails.length}</span>
            </div>
            <p className="text-sm text-gray-500">Emails</p>
            {unreadEmails > 0 && (
              <p className="text-xs text-blue-600 mt-1">{unreadEmails} unread</p>
            )}
          </div>

          <div className="card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{whatsappMessages.length}</span>
            </div>
            <p className="text-sm text-gray-500">WhatsApp</p>
            {unreadWhatsApp > 0 && (
              <p className="text-xs text-green-600 mt-1">{unreadWhatsApp} unread</p>
            )}
          </div>
        </div>

        {/* AI Categories */}
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary-500" />
            AI Categories
          </h3>
          <div className="space-y-2">
            {Object.entries(categoryCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Select a message to view details
        </p>
      </div>
    </div>
  )
}

