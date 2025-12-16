import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Send, Paperclip, Sparkles, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'

interface ComposeEmailProps {
  replyTo?: {
    id: number
    email: string
    subject: string
    message: string
    gmail_id?: string
  }
  onClose: () => void
  onSent: () => void
}

export default function ComposeEmail({ replyTo, onClose, onSent }: ComposeEmailProps) {
  const [to, setTo] = useState(replyTo?.email || '')
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject}` : ''
  )
  const [body, setBody] = useState('')
  const [isGeneratingReply, setIsGeneratingReply] = useState(false)

  const sendMutation = useMutation({
    mutationFn: () => api.sendEmail({
      to,
      subject,
      body,
      replyTo: replyTo?.gmail_id,
    }),
    onSuccess: () => {
      onSent()
    },
  })

  const handleGenerateReply = async () => {
    if (!replyTo) return
    
    setIsGeneratingReply(true)
    try {
      const response = await api.getSuggestedReply({
        message: replyTo.message,
        context: replyTo.subject,
      })
      setBody(response.reply)
    } catch (error) {
      console.error('Failed to generate reply:', error)
    } finally {
      setIsGeneratingReply(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!to || !subject || !body) return
    sendMutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          {replyTo ? 'Reply' : 'New Message'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Fields */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 w-12">To:</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 py-1 text-sm border-0 focus:ring-0 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 w-12">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="flex-1 py-1 text-sm border-0 focus:ring-0 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* AI Suggestion Button */}
        {replyTo && (
          <div className="px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-purple-50">
            <button
              type="button"
              onClick={handleGenerateReply}
              disabled={isGeneratingReply}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              {isGeneratingReply ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGeneratingReply ? 'Generating reply...' : 'Generate AI Reply'}
            </button>
          </div>
        )}

        {/* Message Body */}
        <div className="p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here..."
            className="w-full h-64 resize-none border-0 focus:ring-0 focus:outline-none text-sm leading-relaxed"
            required
          />
        </div>

        {/* Original Message Quote */}
        {replyTo && (
          <div className="px-4 pb-4">
            <div className="border-l-4 border-gray-300 pl-4 py-2 text-sm text-gray-500">
              <p className="font-medium mb-1">
                On {new Date().toLocaleDateString()}, {replyTo.email} wrote:
              </p>
              <p className="whitespace-pre-wrap">
                {replyTo.message?.substring(0, 500)}
                {replyTo.message?.length > 500 ? '...' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sendMutation.isPending || !to || !subject || !body}
            className="btn btn-primary"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
      </div>

      {/* Error Message */}
      {sendMutation.isError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          Failed to send email. Please try again.
        </div>
      )}
    </form>
  )
}

