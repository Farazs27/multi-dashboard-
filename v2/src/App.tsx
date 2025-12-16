import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import EmailView from './components/inbox/EmailView'
import WhatsAppView from './components/inbox/WhatsAppView'
import UnifiedInbox from './components/inbox/UnifiedInbox'
import PatientsView from './components/patients/PatientsView'
import CampaignsView from './components/campaigns/CampaignsView'
import AutomationView from './components/automation/AutomationView'
import AnalyticsView from './components/analytics/AnalyticsView'
import SettingsView from './components/settings/SettingsView'
import { useAppStore } from './store/appStore'
import { useSocketConnection } from './hooks/useSocketConnection'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { activeView, setActiveView } = useAppStore()
  
  // Initialize socket connection for real-time updates
  useSocketConnection()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts with Ctrl
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'e':
            e.preventDefault()
            setActiveView('email')
            break
          case 'w':
            e.preventDefault()
            setActiveView('whatsapp')
            break
          case 'u':
            e.preventDefault()
            setActiveView('unified')
            break
          case 'p':
            e.preventDefault()
            setActiveView('patients')
            break
          case 'k':
            e.preventDefault()
            // Focus search
            document.getElementById('global-search')?.focus()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActiveView])

  const renderView = () => {
    switch (activeView) {
      case 'email':
        return <EmailView />
      case 'whatsapp':
        return <WhatsAppView />
      case 'unified':
        return <UnifiedInbox />
      case 'patients':
        return <PatientsView />
      case 'campaigns':
        return <CampaignsView />
      case 'automation':
        return <AutomationView />
      case 'analytics':
        return <AnalyticsView />
      case 'settings':
        return <SettingsView />
      default:
        return <UnifiedInbox />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Bar */}
      <TopBar />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main View */}
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
