import { create } from 'zustand'
import type { ViewType, Email, WhatsAppChat, WhatsAppMessage, Patient, Notification } from '../types'

interface AppState {
  // Navigation
  activeView: ViewType
  setActiveView: (view: ViewType) => void

  // Email state
  selectedEmailId: number | null
  setSelectedEmailId: (id: number | null) => void
  selectedEmailFolder: string
  setSelectedEmailFolder: (folder: string) => void
  emails: Email[]
  setEmails: (emails: Email[]) => void
  addEmail: (email: Email) => void
  updateEmail: (id: number, updates: Partial<Email>) => void

  // WhatsApp state
  selectedChatId: string | null
  setSelectedChatId: (id: string | null) => void
  chats: WhatsAppChat[]
  setChats: (chats: WhatsAppChat[]) => void
  updateChat: (id: string, updates: Partial<WhatsAppChat>) => void
  messages: Record<string, WhatsAppMessage[]>
  setMessages: (chatId: string, messages: WhatsAppMessage[]) => void
  addMessage: (chatId: string, message: WhatsAppMessage) => void

  // Patient state
  selectedPatientId: number | null
  setSelectedPatientId: (id: number | null) => void
  patients: Patient[]
  setPatients: (patients: Patient[]) => void

  // UI state
  isComposing: boolean
  setIsComposing: (value: boolean) => void
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // Gmail connection
  isGmailConnected: boolean
  setGmailConnected: (value: boolean) => void

  // WhatsApp connection
  isWhatsAppConnected: boolean
  setWhatsAppConnected: (value: boolean) => void
  whatsAppQR: string | null
  setWhatsAppQR: (qr: string | null) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  loadingMessage: string
  setLoadingMessage: (message: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  activeView: 'unified',
  setActiveView: (view) => set({ activeView: view }),

  // Email state
  selectedEmailId: null,
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  selectedEmailFolder: 'inbox',
  setSelectedEmailFolder: (folder) => set({ selectedEmailFolder: folder }),
  emails: [],
  setEmails: (emails) => set({ emails }),
  addEmail: (email) => set((state) => ({ emails: [email, ...state.emails] })),
  updateEmail: (id, updates) => set((state) => ({
    emails: state.emails.map((e) => e.id === id ? { ...e, ...updates } : e)
  })),

  // WhatsApp state
  selectedChatId: null,
  setSelectedChatId: (id) => set({ selectedChatId: id }),
  chats: [],
  setChats: (chats) => set({ chats }),
  updateChat: (id, updates) => set((state) => ({
    chats: state.chats.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  messages: {},
  setMessages: (chatId, messages) => set((state) => ({
    messages: { ...state.messages, [chatId]: messages }
  })),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),

  // Patient state
  selectedPatientId: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  patients: [],
  setPatients: (patients) => set({ patients }),

  // UI state
  isComposing: false,
  setIsComposing: (value) => set({ isComposing: value }),
  isSidebarCollapsed: false,
  setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Notifications
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications.slice(0, 49)]
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  })),
  clearNotifications: () => set({ notifications: [] }),

  // Gmail connection
  isGmailConnected: false,
  setGmailConnected: (value) => set({ isGmailConnected: value }),

  // WhatsApp connection
  isWhatsAppConnected: false,
  setWhatsAppConnected: (value) => set({ isWhatsAppConnected: value }),
  whatsAppQR: null,
  setWhatsAppQR: (qr) => set({ whatsAppQR: qr }),

  // Loading states
  isLoading: false,
  setIsLoading: (value) => set({ isLoading: value }),
  loadingMessage: '',
  setLoadingMessage: (message) => set({ loadingMessage: message }),
}))

