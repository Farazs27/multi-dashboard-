import { useState, useEffect } from 'react'
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Mail, 
  MessageCircle, 
  Phone,
  Users,
  Calendar,
  Send,
  Save,
  Eye,
  Sparkles,
  Image,
  Link,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Type,
  Palette,
  Layout,
  Columns,
  Square,
  Circle,
  Minus,
  Plus,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  Settings,
  Zap,
  FileText,
  Code
} from 'lucide-react'

interface CampaignEditorProps {
  campaign?: any
  onClose: () => void
  onSave: (campaign: any) => void
}

type EditorStep = 'setup' | 'audience' | 'content' | 'schedule' | 'review'

interface EmailBlock {
  id: string
  type: 'header' | 'text' | 'image' | 'button' | 'divider' | 'columns' | 'spacer'
  content: any
}

const defaultBlocks: EmailBlock[] = [
  {
    id: '1',
    type: 'header',
    content: { text: 'Welcome to Mondzorg Sloterweg', level: 'h1', align: 'center' }
  },
  {
    id: '2',
    type: 'text',
    content: { 
      html: '<p>Dear {patient_name},</p><p>We hope this email finds you well. Thank you for being a valued patient at our clinic.</p>' 
    }
  },
  {
    id: '3',
    type: 'button',
    content: { text: 'Book Appointment', url: '#', align: 'center', color: '#3b82f6' }
  }
]

const segments = [
  { id: 1, name: 'All Patients', count: 1250 },
  { id: 2, name: 'Active Patients', count: 890 },
  { id: 3, name: 'New Patients (Last 30 days)', count: 45 },
  { id: 4, name: 'Upcoming Appointments', count: 128 },
  { id: 5, name: 'Overdue for Checkup', count: 234 },
  { id: 6, name: 'Interested in Orthodontics', count: 67 },
  { id: 7, name: 'Birthday This Month', count: 38 },
]

const emailTemplates = [
  { id: 1, name: 'Appointment Reminder', preview: 'Remind patients about upcoming appointments' },
  { id: 2, name: 'Welcome New Patient', preview: 'Welcome email for new registrations' },
  { id: 3, name: 'Treatment Follow-up', preview: 'Check on patient after treatment' },
  { id: 4, name: 'Recall Notice', preview: '6-month checkup reminder' },
  { id: 5, name: 'Holiday Greeting', preview: 'Seasonal greetings message' },
  { id: 6, name: 'Special Offer', preview: 'Promotional campaign template' },
]

const whatsappTemplates = [
  { id: 1, name: 'Appointment Reminder', message: 'Hi {name}! Reminder: Your appointment is on {date} at {time}. Reply YES to confirm.' },
  { id: 2, name: 'Welcome Message', message: 'Welcome to Mondzorg Sloterweg, {name}! We\'re excited to have you. Questions? Just reply!' },
  { id: 3, name: 'Follow-up', message: 'Hi {name}, how are you feeling after your visit? Let us know if you have any concerns.' },
]

export default function CampaignEditor({ campaign, onClose, onSave }: CampaignEditorProps) {
  const [step, setStep] = useState<EditorStep>('setup')
  const [campaignData, setCampaignData] = useState({
    name: campaign?.name || '',
    channel: campaign?.channel || 'email',
    subject: '',
    preheader: '',
    segment: null as number | null,
    scheduledAt: '',
    sendNow: true,
  })
  const [emailBlocks, setEmailBlocks] = useState<EmailBlock[]>(defaultBlocks)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showAiAssist, setShowAiAssist] = useState(false)

  const steps: { key: EditorStep; label: string }[] = [
    { key: 'setup', label: 'Setup' },
    { key: 'audience', label: 'Audience' },
    { key: 'content', label: 'Content' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'review', label: 'Review' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  const canProceed = () => {
    switch (step) {
      case 'setup':
        return campaignData.name.length > 0
      case 'audience':
        return campaignData.segment !== null
      case 'content':
        return campaignData.channel === 'email' 
          ? emailBlocks.length > 0 && campaignData.subject.length > 0
          : whatsappMessage.length > 0
      case 'schedule':
        return campaignData.sendNow || campaignData.scheduledAt.length > 0
      default:
        return true
    }
  }

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type)
    }
    setEmailBlocks([...emailBlocks, newBlock])
    setSelectedBlock(newBlock.id)
  }

  const getDefaultContent = (type: EmailBlock['type']) => {
    switch (type) {
      case 'header':
        return { text: 'New Header', level: 'h2', align: 'left' }
      case 'text':
        return { html: '<p>Add your text here...</p>' }
      case 'image':
        return { src: '', alt: '', width: '100%' }
      case 'button':
        return { text: 'Click Here', url: '#', align: 'center', color: '#3b82f6' }
      case 'divider':
        return { style: 'solid', color: '#e5e7eb' }
      case 'columns':
        return { columns: 2, content: ['', ''] }
      case 'spacer':
        return { height: 20 }
      default:
        return {}
    }
  }

  const updateBlock = (id: string, content: any) => {
    setEmailBlocks(blocks => 
      blocks.map(b => b.id === id ? { ...b, content } : b)
    )
  }

  const deleteBlock = (id: string) => {
    setEmailBlocks(blocks => blocks.filter(b => b.id !== id))
    setSelectedBlock(null)
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = emailBlocks.findIndex(b => b.id === id)
    if (direction === 'up' && index > 0) {
      const newBlocks = [...emailBlocks]
      ;[newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]
      setEmailBlocks(newBlocks)
    } else if (direction === 'down' && index < emailBlocks.length - 1) {
      const newBlocks = [...emailBlocks]
      ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]
      setEmailBlocks(newBlocks)
    }
  }

  const selectedSegment = segments.find(s => s.id === campaignData.segment)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full h-full max-w-[1400px] max-h-[900px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {campaign ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
              <p className="text-sm text-gray-500">
                {campaignData.name || 'Untitled Campaign'}
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => setStep(s.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    step === s.key
                      ? 'bg-primary-100 text-primary-700'
                      : i < currentStepIndex
                      ? 'text-primary-600 hover:bg-gray-100'
                      : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </button>
                {i < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-secondary">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            {step === 'review' ? (
              <button 
                onClick={() => onSave(campaignData)}
                className="btn btn-primary"
              >
                <Send className="w-4 h-4" />
                {campaignData.sendNow ? 'Send Now' : 'Schedule'}
              </button>
            ) : (
              <button 
                onClick={() => setStep(steps[currentStepIndex + 1].key)}
                disabled={!canProceed()}
                className="btn btn-primary"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Setup Step */}
          {step === 'setup' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                    placeholder="e.g., December Newsletter"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Channel
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'email', icon: Mail, label: 'Email', desc: 'Send rich HTML emails' },
                      { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', desc: 'Send WhatsApp messages' },
                      { id: 'sms', icon: Phone, label: 'SMS', desc: 'Send text messages' },
                    ].map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setCampaignData({ ...campaignData, channel: channel.id })}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          campaignData.channel === channel.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <channel.icon className={`w-6 h-6 mb-2 ${
                          campaignData.channel === channel.id ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <p className="font-medium text-gray-900">{channel.label}</p>
                        <p className="text-sm text-gray-500">{channel.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {campaignData.channel === 'email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={campaignData.subject}
                        onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                        placeholder="e.g., Your appointment reminder"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preheader Text
                        <span className="text-gray-400 font-normal ml-2">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={campaignData.preheader}
                        onChange={(e) => setCampaignData({ ...campaignData, preheader: e.target.value })}
                        placeholder="Preview text shown in inbox"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Audience Step */}
          {step === 'audience' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Audience</h3>
                <div className="grid grid-cols-2 gap-4">
                  {segments.map((segment) => (
                    <button
                      key={segment.id}
                      onClick={() => setCampaignData({ ...campaignData, segment: segment.id })}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        campaignData.segment === segment.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Users className={`w-5 h-5 ${
                          campaignData.segment === segment.id ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <span className="text-sm font-medium text-gray-500">
                          {segment.count.toLocaleString()} contacts
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{segment.name}</p>
                    </button>
                  ))}
                </div>

                {selectedSegment && (
                  <div className="mt-6 p-4 bg-primary-50 rounded-xl">
                    <p className="text-sm text-primary-700">
                      <strong>{selectedSegment.count.toLocaleString()}</strong> recipients will receive this campaign
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Step - Email Editor */}
          {step === 'content' && campaignData.channel === 'email' && (
            <div className="h-full flex">
              {/* Block Palette */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add Block</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'header', icon: Type, label: 'Header' },
                    { type: 'text', icon: FileText, label: 'Text' },
                    { type: 'image', icon: Image, label: 'Image' },
                    { type: 'button', icon: Square, label: 'Button' },
                    { type: 'divider', icon: Minus, label: 'Divider' },
                    { type: 'columns', icon: Columns, label: 'Columns' },
                    { type: 'spacer', icon: Layout, label: 'Spacer' },
                  ].map((block) => (
                    <button
                      key={block.type}
                      onClick={() => addBlock(block.type as EmailBlock['type'])}
                      className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <block.icon className="w-5 h-5 text-gray-500" />
                      <span className="text-xs text-gray-600">{block.label}</span>
                    </button>
                  ))}
                </div>

                <h4 className="text-sm font-medium text-gray-700 mt-6 mb-3">Templates</h4>
                <div className="space-y-2">
                  {emailTemplates.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{template.preview}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAiAssist(true)}
                  className="w-full mt-4 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Assist
                </button>
              </div>

              {/* Email Canvas */}
              <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
                <div className="max-w-[600px] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
                  {/* Email Preview Header */}
                  <div className="bg-gray-800 text-white px-4 py-2 text-sm">
                    <p className="font-medium">{campaignData.subject || 'Subject line preview'}</p>
                    <p className="text-gray-400 text-xs">{campaignData.preheader || 'Preheader text preview'}</p>
                  </div>

                  {/* Email Body */}
                  <div className="p-6">
                    {emailBlocks.map((block, index) => (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlock(block.id)}
                        className={`relative group mb-4 cursor-pointer transition-all ${
                          selectedBlock === block.id
                            ? 'ring-2 ring-primary-500 ring-offset-2 rounded'
                            : 'hover:ring-2 hover:ring-gray-200 hover:ring-offset-2 rounded'
                        }`}
                      >
                        {/* Block Controls */}
                        {selectedBlock === block.id && (
                          <div className="absolute -right-12 top-0 flex flex-col gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }}
                              disabled={index === 0}
                              className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                              <MoveUp className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }}
                              disabled={index === emailBlocks.length - 1}
                              className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                              <MoveDown className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
                              className="p-1.5 bg-white border border-gray-200 rounded hover:bg-red-50 hover:border-red-200"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        )}

                        {/* Block Content */}
                        {block.type === 'header' && (
                          <div style={{ textAlign: block.content.align }}>
                            {block.content.level === 'h1' && (
                              <h1 className="text-2xl font-bold text-gray-900">{block.content.text}</h1>
                            )}
                            {block.content.level === 'h2' && (
                              <h2 className="text-xl font-semibold text-gray-900">{block.content.text}</h2>
                            )}
                            {block.content.level === 'h3' && (
                              <h3 className="text-lg font-medium text-gray-900">{block.content.text}</h3>
                            )}
                          </div>
                        )}

                        {block.type === 'text' && (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: block.content.html }}
                          />
                        )}

                        {block.type === 'image' && (
                          <div style={{ textAlign: 'center' }}>
                            {block.content.src ? (
                              <img 
                                src={block.content.src} 
                                alt={block.content.alt}
                                style={{ width: block.content.width }}
                                className="inline-block"
                              />
                            ) : (
                              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Click to add image</p>
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === 'button' && (
                          <div style={{ textAlign: block.content.align }}>
                            <a
                              href={block.content.url}
                              className="inline-block px-6 py-3 rounded-lg text-white font-medium"
                              style={{ backgroundColor: block.content.color }}
                            >
                              {block.content.text}
                            </a>
                          </div>
                        )}

                        {block.type === 'divider' && (
                          <hr 
                            style={{ 
                              borderStyle: block.content.style,
                              borderColor: block.content.color
                            }}
                            className="border-t"
                          />
                        )}

                        {block.type === 'spacer' && (
                          <div style={{ height: block.content.height }} />
                        )}
                      </div>
                    ))}

                    {emailBlocks.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <Layout className="w-12 h-12 mx-auto mb-3" />
                        <p>Drag blocks here to build your email</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Block Editor Panel */}
              {selectedBlock && (
                <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Edit Block</h4>
                  {(() => {
                    const block = emailBlocks.find(b => b.id === selectedBlock)
                    if (!block) return null

                    return (
                      <div className="space-y-4">
                        {block.type === 'header' && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Text</label>
                              <input
                                type="text"
                                value={block.content.text}
                                onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
                              <select
                                value={block.content.level}
                                onChange={(e) => updateBlock(block.id, { ...block.content, level: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              >
                                <option value="h1">Heading 1</option>
                                <option value="h2">Heading 2</option>
                                <option value="h3">Heading 3</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Alignment</label>
                              <div className="flex gap-1">
                                {['left', 'center', 'right'].map((align) => (
                                  <button
                                    key={align}
                                    onClick={() => updateBlock(block.id, { ...block.content, align })}
                                    className={`flex-1 p-2 border rounded ${
                                      block.content.align === align ? 'bg-primary-50 border-primary-300' : 'border-gray-200'
                                    }`}
                                  >
                                    {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                                    {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                                    {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {block.type === 'text' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                                <button className="p-1.5 hover:bg-gray-200 rounded"><Bold className="w-4 h-4" /></button>
                                <button className="p-1.5 hover:bg-gray-200 rounded"><Italic className="w-4 h-4" /></button>
                                <button className="p-1.5 hover:bg-gray-200 rounded"><Underline className="w-4 h-4" /></button>
                                <span className="w-px h-4 bg-gray-300 mx-1" />
                                <button className="p-1.5 hover:bg-gray-200 rounded"><Link className="w-4 h-4" /></button>
                              </div>
                              <textarea
                                value={block.content.html.replace(/<[^>]*>/g, '')}
                                onChange={(e) => updateBlock(block.id, { ...block.content, html: `<p>${e.target.value}</p>` })}
                                className="w-full px-3 py-2 text-sm min-h-[120px] resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {block.type === 'button' && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Button Text</label>
                              <input
                                type="text"
                                value={block.content.text}
                                onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
                              <input
                                type="text"
                                value={block.content.url}
                                onChange={(e) => updateBlock(block.id, { ...block.content, url: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                placeholder="https://"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                              <input
                                type="color"
                                value={block.content.color}
                                onChange={(e) => updateBlock(block.id, { ...block.content, color: e.target.value })}
                                className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                              />
                            </div>
                          </>
                        )}

                        {block.type === 'spacer' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Height (px)</label>
                            <input
                              type="number"
                              value={block.content.height}
                              onChange={(e) => updateBlock(block.id, { ...block.content, height: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Content Step - WhatsApp Editor */}
          {step === 'content' && campaignData.channel === 'whatsapp' && (
            <div className="h-full flex">
              <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-3">WhatsApp Templates</h4>
                <div className="space-y-2">
                  {whatsappTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setWhatsappMessage(template.message)}
                      className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.message}</p>
                    </button>
                  ))}
                </div>

                <h4 className="text-sm font-medium text-gray-700 mt-6 mb-3">Variables</h4>
                <div className="flex flex-wrap gap-2">
                  {['{name}', '{date}', '{time}', '{clinic}', '{doctor}'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setWhatsappMessage(m => m + ' ' + v)}
                      className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center bg-gray-100 p-6">
                <div className="w-[375px] bg-[#e5ddd5] rounded-2xl overflow-hidden shadow-xl">
                  {/* Phone Header */}
                  <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full" />
                    <div>
                      <p className="font-medium">Mondzorg Sloterweg</p>
                      <p className="text-xs text-green-200">online</p>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="h-[400px] p-4 overflow-y-auto">
                    {whatsappMessage && (
                      <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[80%] ml-auto shadow">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{whatsappMessage}</p>
                        <p className="text-xs text-gray-500 text-right mt-1">12:00 ✓✓</p>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="bg-[#f0f0f0] px-4 py-3">
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 bg-white rounded-full text-sm resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Step */}
          {step === 'schedule' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-xl mx-auto space-y-6">
                <div>
                  <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-gray-300">
                    <input
                      type="radio"
                      checked={campaignData.sendNow}
                      onChange={() => setCampaignData({ ...campaignData, sendNow: true })}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Send Now</p>
                      <p className="text-sm text-gray-500">Send immediately after review</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-gray-300">
                    <input
                      type="radio"
                      checked={!campaignData.sendNow}
                      onChange={() => setCampaignData({ ...campaignData, sendNow: false })}
                      className="w-4 h-4 text-primary-600 mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Schedule for Later</p>
                      <p className="text-sm text-gray-500 mb-3">Choose a specific date and time</p>
                      
                      {!campaignData.sendNow && (
                        <input
                          type="datetime-local"
                          value={campaignData.scheduledAt}
                          onChange={(e) => setCampaignData({ ...campaignData, scheduledAt: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-2xl mx-auto">
                <div className="card p-6 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Campaign Summary</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      Ready to Send
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Campaign Name</p>
                      <p className="font-medium text-gray-900">{campaignData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Channel</p>
                      <p className="font-medium text-gray-900 capitalize flex items-center gap-2">
                        {campaignData.channel === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                        {campaignData.channel === 'whatsapp' && <MessageCircle className="w-4 h-4 text-green-500" />}
                        {campaignData.channel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Audience</p>
                      <p className="font-medium text-gray-900">{selectedSegment?.name}</p>
                      <p className="text-sm text-gray-500">{selectedSegment?.count.toLocaleString()} recipients</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Schedule</p>
                      <p className="font-medium text-gray-900">
                        {campaignData.sendNow ? 'Send Immediately' : new Date(campaignData.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {campaignData.channel === 'email' && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Subject Line</p>
                      <p className="font-medium text-gray-900">{campaignData.subject}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="btn btn-secondary w-full"
                    >
                      <Eye className="w-4 h-4" />
                      Preview Campaign
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

