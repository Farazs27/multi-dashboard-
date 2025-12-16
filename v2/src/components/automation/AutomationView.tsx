import { useState } from 'react'
import { 
  Plus, 
  Play, 
  Pause, 
  Zap, 
  Mail, 
  MessageCircle, 
  Clock,
  Users,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Bell,
  UserPlus,
  RefreshCw,
  Gift,
  Star,
  Edit
} from 'lucide-react'
import FlowEditor from './FlowEditor'

interface Automation {
  id: number
  name: string
  description: string
  trigger: string
  is_active: boolean
  executions: number
  last_run?: string
  steps: number
}

const mockAutomations: Automation[] = [
  {
    id: 1,
    name: 'New Patient Welcome',
    description: 'Send welcome email and WhatsApp on new patient registration',
    trigger: 'New patient created',
    is_active: true,
    executions: 45,
    last_run: '2 hours ago',
    steps: 4,
  },
  {
    id: 2,
    name: 'Appointment Reminder',
    description: 'Send reminders 1 week, 24h, and 2h before appointment',
    trigger: 'Appointment scheduled',
    is_active: true,
    executions: 312,
    last_run: '30 minutes ago',
    steps: 5,
  },
  {
    id: 3,
    name: '6-Month Recall',
    description: 'Remind patients to schedule their regular checkup',
    trigger: '6 months after last visit',
    is_active: true,
    executions: 89,
    last_run: 'Yesterday',
    steps: 3,
  },
  {
    id: 4,
    name: 'Post-Treatment Follow-up',
    description: 'Check on patient wellbeing after treatment',
    trigger: 'Treatment completed',
    is_active: false,
    executions: 23,
    last_run: '1 week ago',
    steps: 4,
  },
  {
    id: 5,
    name: 'Birthday Wishes',
    description: 'Send birthday greetings with special offer',
    trigger: 'Patient birthday',
    is_active: true,
    executions: 156,
    last_run: 'Today',
    steps: 2,
  },
]

const prebuiltFlows = [
  {
    id: 'welcome',
    name: 'New Patient Welcome Series',
    description: 'Day 0 email, Day 1 WhatsApp, Day 3 feedback, Day 7 products',
    icon: UserPlus,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'reminder',
    name: 'Appointment Reminder Sequence',
    description: '1 week email, 24h WhatsApp, 2h SMS',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'followup',
    name: 'Post-Treatment Follow-Up',
    description: 'Day 1 check-in, Day 3 care instructions, Day 7 survey',
    icon: RefreshCw,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'reengagement',
    name: 'Re-Engagement Campaign',
    description: 'Win back inactive patients with personalized offers',
    icon: Star,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'birthday',
    name: 'Birthday Celebration',
    description: 'Send birthday wishes with special discount',
    icon: Gift,
    color: 'bg-pink-100 text-pink-600',
  },
]

export default function AutomationView() {
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations)
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingFlow, setEditingFlow] = useState<any>(null)

  const handleCreateFlow = () => {
    setEditingFlow(null)
    setShowEditor(true)
  }

  const handleEditFlow = (automation: Automation) => {
    setEditingFlow(automation)
    setShowEditor(true)
  }

  const handleSaveFlow = (flowData: any) => {
    if (editingFlow) {
      setAutomations(automations.map(a => 
        a.id === editingFlow.id ? { ...a, name: flowData.name } : a
      ))
    } else {
      const newAutomation: Automation = {
        id: Date.now(),
        name: flowData.name,
        description: 'Custom automation flow',
        trigger: 'Custom trigger',
        is_active: false,
        executions: 0,
        steps: flowData.nodes?.length || 0,
      }
      setAutomations([newAutomation, ...automations])
    }
    setShowEditor(false)
  }

  const toggleAutomation = (id: number) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, is_active: !a.is_active } : a
    ))
  }

  const getTriggerIcon = (trigger: string) => {
    if (trigger.includes('patient')) return <UserPlus className="w-4 h-4" />
    if (trigger.includes('Appointment')) return <Calendar className="w-4 h-4" />
    if (trigger.includes('birthday')) return <Gift className="w-4 h-4" />
    if (trigger.includes('Treatment')) return <Zap className="w-4 h-4" />
    return <Bell className="w-4 h-4" />
  }

  return (
    <>
    {showEditor && (
      <FlowEditor
        flow={editingFlow}
        onClose={() => setShowEditor(false)}
        onSave={handleSaveFlow}
      />
    )}
    <div className="h-full flex bg-gray-50">
      {/* Left Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Automations</h2>
            <button
              onClick={handleCreateFlow}
              className="btn btn-primary text-sm py-1.5"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {automations.filter(a => a.is_active).length} active
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">
              {automations.reduce((acc, a) => acc + a.executions, 0)} total runs
            </span>
          </div>
        </div>

        {/* Automation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {automations.map((automation) => (
            <div
              key={automation.id}
              onClick={() => setSelectedAutomation(automation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedAutomation?.id === automation.id ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${automation.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Zap className={`w-4 h-4 ${automation.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <span className="font-medium text-gray-900 text-sm">
                    {automation.name}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleAutomation(automation.id)
                  }}
                  className={`p-1 rounded ${automation.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                  {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mb-2">{automation.description}</p>
              
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{automation.executions} runs</span>
                {automation.last_run && (
                  <>
                    <span>•</span>
                    <span>Last: {automation.last_run}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pre-built Templates */}
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Pre-built Flows</h3>
          <div className="space-y-2">
            {prebuiltFlows.slice(0, 3).map((flow) => (
              <button
                key={flow.id}
                onClick={handleCreateFlow}
                className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className={`p-1.5 rounded-lg ${flow.color}`}>
                  <flow.icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-gray-700">{flow.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedAutomation ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Automation Header */}
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${selectedAutomation.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Zap className={`w-5 h-5 ${selectedAutomation.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedAutomation.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedAutomation.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedAutomation.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{selectedAutomation.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEditFlow(selectedAutomation)}
                  className="btn btn-secondary"
                >
                  <Edit className="w-4 h-4" />
                  Edit Flow
                </button>
                <button 
                  onClick={() => toggleAutomation(selectedAutomation.id)}
                  className={`btn ${selectedAutomation.is_active ? 'btn-danger' : 'btn-primary'}`}
                >
                  {selectedAutomation.is_active ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Runs</p>
                <p className="text-2xl font-semibold text-gray-900">{selectedAutomation.executions}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Steps</p>
                <p className="text-2xl font-semibold text-gray-900">{selectedAutomation.steps}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Success Rate</p>
                <p className="text-2xl font-semibold text-green-600">98%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Last Run</p>
                <p className="text-2xl font-semibold text-gray-900">{selectedAutomation.last_run || 'Never'}</p>
              </div>
            </div>
          </div>

          {/* Flow Visualization */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-2xl mx-auto">
              {/* Trigger */}
              <div className="card p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    {getTriggerIcon(selectedAutomation.trigger)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Trigger</p>
                    <p className="font-medium text-gray-900">{selectedAutomation.trigger}</p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center my-2">
                <div className="w-0.5 h-8 bg-gray-300" />
              </div>

              {/* Steps */}
              {[
                { type: 'email', title: 'Send Welcome Email', delay: 'Immediately' },
                { type: 'delay', title: 'Wait 1 day', delay: null },
                { type: 'whatsapp', title: 'Send WhatsApp Follow-up', delay: 'After delay' },
                { type: 'condition', title: 'Check if opened email', delay: null },
              ].slice(0, selectedAutomation.steps).map((step, i) => (
                <div key={i}>
                  <div className="card p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        step.type === 'email' ? 'bg-blue-100' :
                        step.type === 'whatsapp' ? 'bg-green-100' :
                        step.type === 'delay' ? 'bg-gray-100' :
                        'bg-purple-100'
                      }`}>
                        {step.type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
                        {step.type === 'whatsapp' && <MessageCircle className="w-4 h-4 text-green-600" />}
                        {step.type === 'delay' && <Clock className="w-4 h-4 text-gray-600" />}
                        {step.type === 'condition' && <ChevronRight className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{step.title}</p>
                        {step.delay && (
                          <p className="text-xs text-gray-500">{step.delay}</p>
                        )}
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {i < selectedAutomation.steps - 1 && (
                    <div className="flex justify-center my-2">
                      <div className="w-0.5 h-8 bg-gray-300" />
                    </div>
                  )}
                </div>
              ))}

              {/* Add Step Button */}
              <div className="flex justify-center mt-4">
                <button className="btn btn-secondary">
                  <Plus className="w-4 h-4" />
                  Add Step
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Automate Your Workflow</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create automated sequences to engage patients at the right time with the right message
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {prebuiltFlows.slice(0, 4).map((flow) => (
                <button
                  key={flow.id}
                  onClick={handleCreateFlow}
                  className="card p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className={`p-2 rounded-lg ${flow.color} w-fit mb-2`}>
                    <flow.icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{flow.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{flow.description}</p>
                </button>
              ))}
            </div>
            
            <button
              onClick={handleCreateFlow}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Create Custom Flow
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

