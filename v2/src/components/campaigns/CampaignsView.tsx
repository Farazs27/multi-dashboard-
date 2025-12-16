import { useState } from 'react'
import { 
  Plus, 
  Search, 
  Mail, 
  MessageCircle, 
  Phone,
  Calendar,
  Users,
  BarChart2,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Send,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import CampaignEditor from './CampaignEditor'

interface Campaign {
  id: number
  name: string
  channel: 'email' | 'whatsapp' | 'sms' | 'multi'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  segment: string
  recipients: number
  sent: number
  opened: number
  clicked: number
  scheduled_at?: string
  sent_at?: string
}

const mockCampaigns: Campaign[] = [
  {
    id: 1,
    name: 'December Holiday Greetings',
    channel: 'email',
    status: 'sent',
    segment: 'All Patients',
    recipients: 450,
    sent: 448,
    opened: 312,
    clicked: 89,
    sent_at: '2024-12-15T10:00:00',
  },
  {
    id: 2,
    name: 'Appointment Reminder - This Week',
    channel: 'whatsapp',
    status: 'sending',
    segment: 'Upcoming Appointments',
    recipients: 28,
    sent: 15,
    opened: 12,
    clicked: 0,
  },
  {
    id: 3,
    name: 'New Year Promotion',
    channel: 'multi',
    status: 'scheduled',
    segment: 'Active Patients',
    recipients: 320,
    sent: 0,
    opened: 0,
    clicked: 0,
    scheduled_at: '2025-01-01T09:00:00',
  },
  {
    id: 4,
    name: 'Invisalign Special Offer',
    channel: 'email',
    status: 'draft',
    segment: 'Interested in Orthodontics',
    recipients: 85,
    sent: 0,
    opened: 0,
    clicked: 0,
  },
]

const templates = [
  { id: 1, name: 'Appointment Reminder', channel: 'whatsapp' },
  { id: 2, name: 'Welcome New Patient', channel: 'email' },
  { id: 3, name: 'Treatment Follow-up', channel: 'email' },
  { id: 4, name: '6-Month Recall', channel: 'multi' },
  { id: 5, name: 'Birthday Wishes', channel: 'whatsapp' },
]

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'draft' | 'completed'>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  const handleCreateCampaign = () => {
    setEditingCampaign(null)
    setShowEditor(true)
  }

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setShowEditor(true)
  }

  const handleSaveCampaign = (campaignData: any) => {
    if (editingCampaign) {
      setCampaigns(campaigns.map(c => 
        c.id === editingCampaign.id ? { ...c, ...campaignData } : c
      ))
    } else {
      const newCampaign: Campaign = {
        id: Date.now(),
        name: campaignData.name,
        channel: campaignData.channel,
        status: campaignData.sendNow ? 'sending' : 'scheduled',
        segment: 'Custom Segment',
        recipients: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        scheduled_at: campaignData.scheduledAt,
      }
      setCampaigns([newCampaign, ...campaigns])
    }
    setShowEditor(false)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'sms':
        return <Phone className="w-4 h-4 text-purple-500" />
      case 'multi':
        return (
          <div className="flex -space-x-1">
            <Mail className="w-3 h-3 text-blue-500" />
            <MessageCircle className="w-3 h-3 text-green-500" />
          </div>
        )
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
      sending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-green-100 text-green-700',
      paused: 'bg-red-100 text-red-700',
    }
    return styles[status] || styles.draft
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-3 h-3" />
      case 'scheduled':
        return <Clock className="w-3 h-3" />
      case 'sending':
        return <Play className="w-3 h-3" />
      case 'sent':
        return <CheckCircle className="w-3 h-3" />
      case 'paused':
        return <Pause className="w-3 h-3" />
      default:
        return null
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return c.status === 'sending'
    if (activeTab === 'scheduled') return c.status === 'scheduled'
    if (activeTab === 'draft') return c.status === 'draft'
    if (activeTab === 'completed') return c.status === 'sent'
    return true
  })

  return (
    <>
    {showEditor && (
      <CampaignEditor
        campaign={editingCampaign}
        onClose={() => setShowEditor(false)}
        onSave={handleSaveCampaign}
      />
    )}
    <div className="h-full flex bg-gray-50">
      {/* Left Panel - Campaign List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
            <button
              onClick={handleCreateCampaign}
              className="btn btn-primary text-sm py-1.5"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {['all', 'active', 'scheduled', 'draft'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedCampaign?.id === campaign.id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getChannelIcon(campaign.channel)}
                  <span className="font-medium text-gray-900 text-sm">
                    {campaign.name}
                  </span>
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(campaign.status)}`}>
                  {getStatusIcon(campaign.status)}
                  {campaign.status}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {campaign.recipients}
                </span>
                {campaign.sent > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.round((campaign.opened / campaign.sent) * 100)}% opened</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Templates Section */}
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Templates</h3>
          <div className="space-y-2">
            {templates.slice(0, 3).map((template) => (
              <button
                key={template.id}
                className="w-full flex items-center gap-2 p-2 text-left text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {getChannelIcon(template.channel)}
                {template.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedCampaign ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Campaign Header */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {getChannelIcon(selectedCampaign.channel)}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedCampaign.name}
                  </h2>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedCampaign.status)}`}>
                    {getStatusIcon(selectedCampaign.status)}
                    {selectedCampaign.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Segment: {selectedCampaign.segment} • {selectedCampaign.recipients} recipients
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedCampaign.status === 'draft' && (
                  <>
                    <button className="btn btn-secondary">
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </button>
                    <button className="btn btn-primary">
                      <Send className="w-4 h-4" />
                      Send Now
                    </button>
                  </>
                )}
                {selectedCampaign.status === 'scheduled' && (
                  <button 
                    onClick={() => handleEditCampaign(selectedCampaign)}
                    className="btn btn-secondary"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {selectedCampaign.status === 'draft' && (
                  <button 
                    onClick={() => handleEditCampaign(selectedCampaign)}
                    className="btn btn-ghost"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                <button className="btn btn-ghost">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            {selectedCampaign.sent > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Sent</p>
                  <p className="text-2xl font-semibold text-gray-900">{selectedCampaign.sent}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((selectedCampaign.sent / selectedCampaign.recipients) * 100)}% of recipients
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Opened</p>
                  <p className="text-2xl font-semibold text-green-600">{selectedCampaign.opened}</p>
                  <p className="text-xs text-gray-500">
                    {Math.round((selectedCampaign.opened / selectedCampaign.sent) * 100)}% open rate
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Clicked</p>
                  <p className="text-2xl font-semibold text-blue-600">{selectedCampaign.clicked}</p>
                  <p className="text-xs text-gray-500">
                    {selectedCampaign.opened > 0 
                      ? Math.round((selectedCampaign.clicked / selectedCampaign.opened) * 100) 
                      : 0}% click rate
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Bounced</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {selectedCampaign.recipients - selectedCampaign.sent}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(((selectedCampaign.recipients - selectedCampaign.sent) / selectedCampaign.recipients) * 100)}% bounce rate
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Content Preview */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-2xl mx-auto">
              <div className="card p-6">
                <h3 className="font-medium text-gray-900 mb-4">Campaign Content</h3>
                
                {selectedCampaign.channel === 'email' || selectedCampaign.channel === 'multi' ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                      <p className="text-sm text-gray-600">Subject: <strong>Your appointment reminder</strong></p>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-gray-700">
                        Dear {'{patient_name}'},
                        <br /><br />
                        This is a friendly reminder about your upcoming appointment at Mondzorg Sloterweg.
                        <br /><br />
                        <strong>Date:</strong> {'{appointment_date}'}<br />
                        <strong>Time:</strong> {'{appointment_time}'}<br />
                        <strong>Location:</strong> Sloterweg 123, Amsterdam
                        <br /><br />
                        If you need to reschedule, please contact us at least 24 hours in advance.
                        <br /><br />
                        Best regards,<br />
                        The Mondzorg Sloterweg Team
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-whatsapp-bg p-4 rounded-lg">
                    <div className="message-bubble sent max-w-[80%]">
                      <p>
                        Beste {'{patient_name}'}, dit is een herinnering voor uw afspraak morgen om {'{appointment_time}'}. 
                        Tot dan! 😊
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipient List Preview */}
              <div className="card p-6 mt-6">
                <h3 className="font-medium text-gray-900 mb-4">Recipients Preview</h3>
                <div className="space-y-2">
                  {['Jan de Vries', 'Maria Jansen', 'Peter Bakker'].map((name, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-600 font-medium">
                            {name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{name}</span>
                      </div>
                      {selectedCampaign.status === 'sent' && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Delivered
                        </span>
                      )}
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 text-center py-2">
                    +{selectedCampaign.recipients - 3} more recipients
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create a Campaign</h3>
            <p className="text-sm text-gray-500 mb-4">
              Send targeted messages to your patients via Email, WhatsApp, or SMS
            </p>
            <button
              onClick={handleCreateCampaign}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

