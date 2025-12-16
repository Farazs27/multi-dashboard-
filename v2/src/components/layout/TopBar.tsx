import { useState, useRef, useEffect } from 'react'
import { 
  Search, 
  Bell, 
  Settings, 
  User,
  Mail,
  MessageCircle,
  X,
  Check,
  RefreshCw,
  QrCode,
  Smartphone
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { api } from '../../lib/api'

export default function TopBar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    notifications,
    markNotificationRead,
    clearNotifications,
    isGmailConnected,
    setGmailConnected,
    isWhatsAppConnected,
    setWhatsAppConnected,
    whatsAppQR,
    setWhatsAppQR,
    setActiveView
  } = useAppStore()
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoadingQR, setIsLoadingQR] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (qrRef.current && !qrRef.current.contains(e.target as Node)) {
        setShowWhatsAppQR(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle WhatsApp QR code connection
  const handleWhatsAppConnect = async () => {
    if (isWhatsAppConnected) return
    
    setIsLoadingQR(true)
    setShowWhatsAppQR(true)
    setWhatsAppQR(null)
    
    try {
      // Call the real WhatsApp connect API
      const response = await api.connectWhatsApp()
      
      if (response?.connected) {
        // Already connected from saved session
        setWhatsAppConnected(true)
        setShowWhatsAppQR(false)
      } else if (response?.qr) {
        // Got QR code, display it
        setWhatsAppQR(response.qr)
        // Start polling for connection status
        startConnectionPolling()
      } else if (response?.error) {
        console.error('WhatsApp connect error:', response.error)
        setWhatsAppQR(null)
      }
    } catch (error) {
      console.error('Failed to connect WhatsApp:', error)
    } finally {
      setIsLoadingQR(false)
    }
  }

  // Poll for WhatsApp connection status
  const startConnectionPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await api.getWhatsAppStatus()
        if (status?.connected) {
          setWhatsAppConnected(true)
          setWhatsAppQR(null)
          setShowWhatsAppQR(false)
          clearInterval(pollInterval)
        } else if (status?.hasQR) {
          // Check if there's a new QR code
          const qrResponse = await api.getWhatsAppQR()
          if (qrResponse?.qr && qrResponse.qr !== whatsAppQR) {
            setWhatsAppQR(qrResponse.qr)
          }
        }
      } catch (error) {
        console.error('Error polling WhatsApp status:', error)
      }
    }, 2000) // Poll every 2 seconds
    
    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
    }, 120000)
  }

  // Refresh QR code
  const refreshQRCode = async () => {
    setIsLoadingQR(true)
    try {
      const response = await api.connectWhatsApp()
      if (response?.qr) {
        setWhatsAppQR(response.qr)
        startConnectionPolling()
      }
    } catch (error) {
      console.error('Failed to refresh QR:', error)
    } finally {
      setIsLoadingQR(false)
    }
  }

  // Check Gmail and WhatsApp status on mount
  useEffect(() => {
    api.getGmailStatus()
      .then(data => setGmailConnected(!!data.authenticated))
      .catch(() => setGmailConnected(false))
    
    api.getWhatsAppStatus()
      .then(data => setWhatsAppConnected(!!data.connected))
      .catch(() => setWhatsAppConnected(false))
  }, [setGmailConnected, setWhatsAppConnected])

  const handleSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      await api.syncGmail()
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img 
            src="/assets/logos/logo.png" 
            alt="Mondzorg Sloterweg" 
            className="h-9 max-w-[200px] object-contain"
            onError={(e) => {
              // Fallback to text if logo fails
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }}
          />
          <span className="text-lg font-semibold text-gray-900 hidden items-center gap-2">
            <span className="text-amber-600">🦷</span> Mondzorg Sloterweg
          </span>
        </div>
        
        {/* Connection Status Indicators - Pulsing dots */}
        <div className="flex items-center gap-3 ml-4">
          {/* Gmail Status */}
          <div 
            className="flex items-center gap-1.5 cursor-pointer group"
            title={isGmailConnected ? 'Gmail Connected' : 'Gmail Disconnected'}
          >
            <Mail className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${
                isGmailConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isGmailConnected && (
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
              )}
            </div>
          </div>

          {/* WhatsApp Status */}
          <div 
            className="flex items-center gap-1.5 cursor-pointer group"
            title={isWhatsAppConnected ? 'WhatsApp Connected' : 'Click to connect WhatsApp'}
            onClick={!isWhatsAppConnected ? handleWhatsAppConnect : undefined}
          >
            <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${
                isWhatsAppConnected ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              {isWhatsAppConnected && (
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="global-search"
            type="text"
            placeholder="Search emails, messages, patients... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-primary-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ${
            isSyncing ? 'animate-spin' : ''
          }`}
          title="Sync emails"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read ? 'font-medium' : ''} text-gray-900`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => setActiveView('settings')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in slide-up">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">Dr. Farbod Sharifi</p>
                <p className="text-sm text-gray-500">admin@mondzorgsloterweg.nl</p>
              </div>
              <div className="py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Profile Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Team Members
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  Billing
                </button>
              </div>
              <div className="border-t border-gray-100 py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp QR Code Modal */}
      {showWhatsAppQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            ref={qrRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Connect WhatsApp</h3>
                  <p className="text-green-100 text-sm">Scan QR code to link</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWhatsAppQR(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoadingQR ? (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-4 text-gray-600">Initializing WhatsApp...</p>
                  <p className="text-xs text-gray-400 mt-2">This may take a moment</p>
                </div>
              ) : (
                <>
                  {/* QR Code Display */}
                  <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center relative">
                    {whatsAppQR && whatsAppQR.startsWith('data:') ? (
                      <img 
                        src={whatsAppQR} 
                        alt="WhatsApp QR Code" 
                        className="w-64 h-64 rounded-lg"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-white rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                        <QrCode className="w-24 h-24 text-gray-400" />
                        <p className="mt-3 text-sm text-gray-500 text-center">
                          {whatsAppQR ? 'Loading QR code...' : 'Click below to generate QR code'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 text-sm font-medium">1</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Open WhatsApp on your phone
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 text-sm font-medium">2</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 text-sm font-medium">3</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Tap <strong>Link a Device</strong> and scan the QR code above
                      </p>
                    </div>
                  </div>

                  {/* Refresh QR Button */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={refreshQRCode}
                      disabled={isLoadingQR}
                      className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoadingQR ? 'animate-spin' : ''}`} />
                      {whatsAppQR ? 'Refresh QR Code' : 'Generate QR Code'}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      QR code expires after 60 seconds. Click refresh if needed.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

