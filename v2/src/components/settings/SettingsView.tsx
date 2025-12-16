import { useState } from 'react'
import { 
  Mail, 
  MessageCircle, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Key,
  Users,
  Zap,
  Check,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { api } from '../../lib/api'

export default function SettingsView() {
  const { isGmailConnected, setGmailConnected, isWhatsAppConnected } = useAppStore()
  const [activeTab, setActiveTab] = useState('integrations')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectGmail = async () => {
    setIsConnecting(true)
    try {
      const { url } = await api.getGmailAuthUrl()
      window.location.href = url
    } catch (error) {
      console.error('Failed to get auth URL:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectGmail = async () => {
    try {
      await api.disconnectGmail()
      setGmailConnected(false)
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error)
    }
  }

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          {activeTab === 'integrations' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Integrations</h2>
              
              {/* Gmail Integration */}
              <div className="card p-6 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <Mail className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Gmail</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Connect your Gmail account to send and receive emails directly in the dashboard
                      </p>
                      {isGmailConnected && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          Connected
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isGmailConnected ? (
                    <button
                      onClick={handleDisconnectGmail}
                      className="btn btn-secondary text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGmail}
                      disabled={isConnecting}
                      className="btn btn-primary"
                    >
                      {isConnecting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Connect Gmail
                    </button>
                  )}
                </div>
              </div>

              {/* WhatsApp Integration */}
              <div className="card p-6 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">WhatsApp Business</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Connect WhatsApp to send messages and engage with patients
                      </p>
                      {isWhatsAppConnected ? (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                          <Check className="w-4 h-4" />
                          Connected
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <X className="w-4 h-4" />
                          Not connected
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className="btn btn-whatsapp">
                    <ExternalLink className="w-4 h-4" />
                    {isWhatsAppConnected ? 'Manage' : 'Connect WhatsApp'}
                  </button>
                </div>
              </div>

              {/* Google Gemini AI */}
              <div className="card p-6 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Google Gemini AI</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        AI-powered message categorization and response suggestions
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        Active
                      </div>
                    </div>
                  </div>
                  
                  <button className="btn btn-secondary">
                    Configure
                  </button>
                </div>
              </div>

              {/* API Keys */}
              <h3 className="font-semibold text-gray-900 mt-8 mb-4">API Keys</h3>
              <div className="card p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gemini API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value="AIza••••••••••••••••••••"
                        readOnly
                        className="flex-1 input bg-gray-50"
                      />
                      <button className="btn btn-secondary">
                        <Key className="w-4 h-4" />
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
              
              <div className="card p-6">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-semibold text-primary-600">FS</span>
                  </div>
                  <div>
                    <button className="btn btn-secondary text-sm">
                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Farbod"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Sharifi"
                      className="input"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="farbod@mondzorgsloterweg.nl"
                      className="input"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      defaultValue="Administrator"
                      className="input bg-gray-50"
                      disabled
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                  <button className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'team' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Members</h2>
              
              <div className="card">
                <div className="p-4 border-b border-gray-200">
                  <button className="btn btn-primary text-sm">
                    <User className="w-4 h-4" />
                    Invite Member
                  </button>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {[
                    { name: 'Dr. Farbod Sharifi', email: 'farbod@mondzorgsloterweg.nl', role: 'Admin' },
                    { name: 'Dr. Fati Soltani', email: 'fati@mondzorgsloterweg.nl', role: 'Dentist' },
                    { name: 'Reception', email: 'info@mondzorgsloterweg.nl', role: 'Receptionist' },
                  ].map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {member.role}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              
              <div className="card p-6 space-y-6">
                {[
                  { title: 'New email received', description: 'Get notified when a new email arrives' },
                  { title: 'New WhatsApp message', description: 'Get notified for new WhatsApp messages' },
                  { title: 'Appointment reminders', description: 'Reminders for upcoming patient appointments' },
                  { title: 'Campaign completion', description: 'Notification when a campaign finishes sending' },
                  { title: 'Weekly analytics', description: 'Weekly summary of your performance metrics' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
              
              <div className="card p-6 mb-4">
                <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input type="password" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input type="password" className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input type="password" className="input" />
                  </div>
                  <button className="btn btn-primary">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Add an extra layer of security to your account
                </p>
                <button className="btn btn-secondary">
                  Enable 2FA
                </button>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance</h2>
              
              <div className="card p-6">
                <h3 className="font-medium text-gray-900 mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['Light', 'Dark', 'System'].map((theme) => (
                    <button
                      key={theme}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        theme === 'Light'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-8 mx-auto mb-2 rounded ${
                        theme === 'Light' ? 'bg-white border border-gray-200' :
                        theme === 'Dark' ? 'bg-gray-900' :
                        'bg-gradient-to-r from-white to-gray-900'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

