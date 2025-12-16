import { 
  Mail, 
  MessageCircle, 
  Inbox, 
  Users, 
  Megaphone, 
  Zap, 
  BarChart3, 
  Settings,
  ChevronDown,
  ChevronRight,
  Folder,
  Star,
  Archive,
  AlertCircle,
  Clock,
  HelpCircle,
  DollarSign,
  UserPlus,
  MessageSquare,
  ThumbsUp
} from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import type { ViewType } from '../../types'

interface NavItem {
  id: ViewType
  label: string
  icon: React.ReactNode
  badge?: number
  shortcut?: string
}

interface AIFolder {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  count: number
}

const navItems: NavItem[] = [
  { id: 'email', label: 'Email', icon: <Mail className="w-5 h-5" />, badge: 12, shortcut: 'Ctrl+E' },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, badge: 5, shortcut: 'Ctrl+W' },
  { id: 'unified', label: 'Unified Inbox', icon: <Inbox className="w-5 h-5" />, badge: 17, shortcut: 'Ctrl+U' },
  { id: 'patients', label: 'Patients', icon: <Users className="w-5 h-5" />, shortcut: 'Ctrl+P' },
  { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" /> },
  { id: 'automation', label: 'Automation', icon: <Zap className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

const aiFolders: AIFolder[] = [
  { id: 'new-patient', label: 'New Patients', icon: <UserPlus className="w-4 h-4" />, color: 'bg-emerald-500', count: 3 },
  { id: 'appointment', label: 'Appointments', icon: <Clock className="w-4 h-4" />, color: 'bg-blue-500', count: 8 },
  { id: 'followup', label: 'Follow-Up', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-amber-500', count: 4 },
  { id: 'question', label: 'Questions', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-cyan-500', count: 6 },
  { id: 'feedback', label: 'Feedback', icon: <ThumbsUp className="w-4 h-4" />, color: 'bg-pink-500', count: 2 },
  { id: 'billing', label: 'Billing', icon: <DollarSign className="w-4 h-4" />, color: 'bg-purple-500', count: 1 },
  { id: 'urgent', label: 'Urgent', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-red-500', count: 1 },
]

const emailFolders = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, count: 24 },
  { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" />, count: 5 },
  { id: 'sent', label: 'Sent', icon: <Mail className="w-4 h-4" />, count: 0 },
  { id: 'archive', label: 'Archive', icon: <Archive className="w-4 h-4" />, count: 0 },
]

export default function Sidebar() {
  const { activeView, setActiveView, selectedEmailFolder, setSelectedEmailFolder, isSidebarCollapsed } = useAppStore()
  const [showAIFolders, setShowAIFolders] = useState(true)
  const [showEmailFolders, setShowEmailFolders] = useState(true)

  if (isSidebarCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col py-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`relative p-3 mx-2 rounded-lg transition-all ${
              activeView === item.id
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title={item.label}
          >
            {item.icon}
            {item.badge && item.badge > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </aside>
    )
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Main Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        <div className="px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full sidebar-item ${activeView === item.id ? 'active' : ''}`}
              title={item.shortcut}
            >
              <span className={activeView === item.id ? 'text-primary-600' : 'text-gray-500'}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Email Folders (shown when email view is active) */}
        {activeView === 'email' && (
          <div className="mt-6 px-3">
            <button
              onClick={() => setShowEmailFolders(!showEmailFolders)}
              className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-full hover:text-gray-700"
            >
              {showEmailFolders ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Folders
            </button>
            
            {showEmailFolders && (
              <div className="mt-1 space-y-0.5">
                {emailFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedEmailFolder(folder.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedEmailFolder === folder.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-400">{folder.icon}</span>
                    <span className="flex-1 text-left">{folder.label}</span>
                    {folder.count > 0 && (
                      <span className="text-xs text-gray-400">{folder.count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Categories */}
        {(activeView === 'email' || activeView === 'unified') && (
          <div className="mt-6 px-3">
            <button
              onClick={() => setShowAIFolders(!showAIFolders)}
              className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-full hover:text-gray-700"
            >
              {showAIFolders ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Zap className="w-3 h-3" />
              AI Categories
            </button>
            
            {showAIFolders && (
              <div className="mt-1 space-y-0.5">
                {aiFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedEmailFolder(folder.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedEmailFolder === folder.id
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${folder.color}`} />
                    <span className="flex-1 text-left">{folder.label}</span>
                    {folder.count > 0 && (
                      <span className="text-xs text-gray-400">{folder.count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">M</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Mondzorg Sloterweg</p>
            <p className="text-xs text-gray-500">Professional Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

