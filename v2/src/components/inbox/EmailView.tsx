import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  RefreshCw, 
  Star, 
  Archive, 
  Trash2, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Reply,
  Forward,
  Paperclip,
  Send,
  X,
  Check,
  CheckCheck,
  Clock,
  Zap,
  ExternalLink
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { api } from '../../lib/api'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import ComposeEmail from './ComposeEmail'

interface EmailItem {
  id: number
  email: string
  from_name?: string
  subject: string
  message: string
  html_message?: string
  category: string
  timestamp: string
  read_status: number
  starred: number
  source: string
  gmail_id?: string
  attachments?: any[]
}

export default function EmailView() {
  const queryClient = useQueryClient()
  const { selectedEmailId, setSelectedEmailId, selectedEmailFolder, searchQuery } = useAppStore()
  const [isComposing, setIsComposing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [localSearch, setLocalSearch] = useState('')

  // Fetch emails
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['emails', selectedEmailFolder, searchQuery],
    queryFn: () => api.getEmails({ folder: selectedEmailFolder }),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Handle both array and object response formats
  const emailsArray = Array.isArray(data) ? data : (data?.emails || data || [])
  const emails: EmailItem[] = Array.isArray(emailsArray) ? emailsArray : []

  // Filter emails based on search
  const filteredEmails = emails.filter(email => {
    const search = (localSearch || searchQuery).toLowerCase()
    if (!search) return true
    return (
      email.email?.toLowerCase().includes(search) ||
      email.subject?.toLowerCase().includes(search) ||
      email.message?.toLowerCase().includes(search)
    )
  })

  // Get selected email
  const selectedEmail = emails.find(e => e.id === selectedEmailId)

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markEmailRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    }
  })

  // Star mutation
  const starMutation = useMutation({
    mutationFn: ({ id, starred }: { id: number; starred: boolean }) => 
      api.starEmail(id, starred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    }
  })

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.archiveEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      setSelectedEmailId(null)
    }
  })

  // Select email and mark as read
  const handleSelectEmail = (email: EmailItem) => {
    setSelectedEmailId(email.id)
    if (!email.read_status) {
      markReadMutation.mutate(email.id)
    }
  }

  // Format date for list
  const formatEmailDate = (dateStr: string) => {
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
  const getCategoryColor = (category: string) => {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault()
          setIsComposing(true)
          break
        case 'r':
          if (selectedEmail) {
            e.preventDefault()
            setIsReplying(true)
          }
          break
        case 'e':
          if (selectedEmail && !e.ctrlKey) {
            e.preventDefault()
            archiveMutation.mutate(selectedEmail.id)
          }
          break
        case 's':
          if (selectedEmail) {
            e.preventDefault()
            starMutation.mutate({ id: selectedEmail.id, starred: !selectedEmail.starred })
          }
          break
        case 'j':
          e.preventDefault()
          navigateEmails(1)
          break
        case 'k':
          e.preventDefault()
          navigateEmails(-1)
          break
        case 'escape':
          setSelectedEmailId(null)
          setIsComposing(false)
          setIsReplying(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEmail, selectedEmailId])

  const navigateEmails = (direction: number) => {
    const currentIndex = filteredEmails.findIndex(e => e.id === selectedEmailId)
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < filteredEmails.length) {
      handleSelectEmail(filteredEmails[newIndex])
    }
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Email List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* List Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search in emails..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsComposing(true)}
              className="btn btn-primary text-sm py-1.5"
            >
              <Send className="w-4 h-4" />
              Compose
            </button>
            <span className="text-xs text-gray-500">
              {filteredEmails.length} emails
            </span>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 mx-auto text-gray-400 animate-spin" />
              <p className="mt-2 text-sm text-gray-500">Loading emails...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No emails found</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={`email-item ${!email.read_status ? 'unread' : ''} ${
                  selectedEmailId === email.id ? 'selected' : ''
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  {/* Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      starMutation.mutate({ id: email.id, starred: !email.starred })
                    }}
                    className={`mt-0.5 ${email.starred ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}
                  >
                    <Star className={`w-4 h-4 ${email.starred ? 'fill-current' : ''}`} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm truncate ${!email.read_status ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {email.from_name || email.email?.split('@')[0] || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatEmailDate(email.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm truncate ${!email.read_status ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {email.subject || '(No subject)'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getCategoryColor(email.category)}`} />
                      <span className="text-xs text-gray-500 truncate">
                        {email.message?.substring(0, 60) || '(No content)'}...
                      </span>
                    </div>
                  </div>

                  {/* Attachment indicator */}
                  {email.attachments && email.attachments.length > 0 && (
                    <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            {/* Detail Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEmailId(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {selectedEmail.subject || '(No subject)'}
                  </h2>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsReplying(true)}
                    className="btn btn-secondary text-sm py-1.5"
                  >
                    <Reply className="w-4 h-4" />
                    Reply
                  </button>
                  <button className="btn btn-ghost text-sm py-1.5">
                    <Forward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => archiveMutation.mutate(selectedEmail.id)}
                    className="btn btn-ghost text-sm py-1.5"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button className="btn btn-ghost text-sm py-1.5 text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sender info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {(selectedEmail.from_name || selectedEmail.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {selectedEmail.from_name || selectedEmail.email?.split('@')[0]}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getCategoryColor(selectedEmail.category)}`}>
                      {selectedEmail.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{selectedEmail.email}</span>
                    <span>•</span>
                    <span>{format(new Date(selectedEmail.timestamp), 'PPpp')}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => starMutation.mutate({ id: selectedEmail.id, starred: !selectedEmail.starred })}
                  className={selectedEmail.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}
                >
                  <Star className={`w-5 h-5 ${selectedEmail.starred ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* AI Insights */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-purple-50 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary-600" />
                <span className="font-medium text-primary-700">AI Analysis:</span>
                <span className="text-gray-600">
                  Categorized as <strong>{selectedEmail.category}</strong>
                </span>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {selectedEmail.html_message ? (
                <div 
                  className="email-content"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(selectedEmail.html_message) 
                  }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {selectedEmail.message}
                </div>
              )}

              {/* Attachments */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Attachments ({selectedEmail.attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att: any, i: number) => (
                      <a
                        key={i}
                        href={att.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{att.filename || 'Attachment'}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply Box */}
            {isReplying && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <ComposeEmail
                  replyTo={selectedEmail}
                  onClose={() => setIsReplying(false)}
                  onSent={() => {
                    setIsReplying(false)
                    refetch()
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select an email</h3>
              <p className="text-sm text-gray-500">Choose an email from the list to view its contents</p>
              <div className="mt-4 text-xs text-gray-400">
                <p>Keyboard shortcuts: J/K to navigate, R to reply, E to archive</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {isComposing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <ComposeEmail
              onClose={() => setIsComposing(false)}
              onSent={() => {
                setIsComposing(false)
                refetch()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Simple HTML sanitizer
function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  // Remove dangerous elements and attributes
  let clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
  
  return clean
}

// Mail icon component for empty state
function Mail({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

