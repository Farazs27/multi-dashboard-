import { useState, useRef, useCallback } from 'react'
import { 
  X, 
  Plus,
  Save,
  Play,
  Pause,
  ChevronLeft,
  Mail, 
  MessageCircle, 
  Phone,
  Clock,
  GitBranch,
  Users,
  Calendar,
  UserPlus,
  Gift,
  RefreshCw,
  Zap,
  Trash2,
  Settings,
  Copy,
  GripVertical,
  AlertCircle,
  CheckCircle,
  ArrowDown,
  Bell,
  Tag,
  Filter,
  MoreHorizontal
} from 'lucide-react'

interface FlowEditorProps {
  flow?: any
  onClose: () => void
  onSave: (flow: any) => void
}

interface FlowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  subtype: string
  config: any
  position: { x: number; y: number }
}

interface FlowConnection {
  from: string
  to: string
  label?: string
}

const triggerTypes = [
  { id: 'new_patient', label: 'New Patient Created', icon: UserPlus, color: 'bg-green-100 text-green-600' },
  { id: 'appointment_scheduled', label: 'Appointment Scheduled', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
  { id: 'appointment_completed', label: 'Appointment Completed', icon: CheckCircle, color: 'bg-purple-100 text-purple-600' },
  { id: 'birthday', label: 'Patient Birthday', icon: Gift, color: 'bg-pink-100 text-pink-600' },
  { id: 'time_since_visit', label: 'Time Since Last Visit', icon: Clock, color: 'bg-amber-100 text-amber-600' },
  { id: 'tag_added', label: 'Tag Added', icon: Tag, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'form_submitted', label: 'Form Submitted', icon: RefreshCw, color: 'bg-indigo-100 text-indigo-600' },
]

const actionTypes = [
  { id: 'send_email', label: 'Send Email', icon: Mail, color: 'bg-blue-100 text-blue-600' },
  { id: 'send_whatsapp', label: 'Send WhatsApp', icon: MessageCircle, color: 'bg-green-100 text-green-600' },
  { id: 'send_sms', label: 'Send SMS', icon: Phone, color: 'bg-purple-100 text-purple-600' },
  { id: 'add_tag', label: 'Add Tag', icon: Tag, color: 'bg-amber-100 text-amber-600' },
  { id: 'remove_tag', label: 'Remove Tag', icon: Tag, color: 'bg-red-100 text-red-600' },
  { id: 'notify_team', label: 'Notify Team', icon: Bell, color: 'bg-pink-100 text-pink-600' },
  { id: 'create_task', label: 'Create Task', icon: CheckCircle, color: 'bg-cyan-100 text-cyan-600' },
]

const conditionTypes = [
  { id: 'email_opened', label: 'Email Opened?', icon: Mail },
  { id: 'link_clicked', label: 'Link Clicked?', icon: Mail },
  { id: 'has_tag', label: 'Has Tag?', icon: Tag },
  { id: 'segment_match', label: 'In Segment?', icon: Users },
  { id: 'time_condition', label: 'Time Condition', icon: Clock },
]

const delayOptions = [
  { value: '5m', label: '5 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hours' },
  { value: '1d', label: '1 day' },
  { value: '3d', label: '3 days' },
  { value: '1w', label: '1 week' },
  { value: '2w', label: '2 weeks' },
  { value: '1M', label: '1 month' },
]

export default function FlowEditor({ flow, onClose, onSave }: FlowEditorProps) {
  const [flowName, setFlowName] = useState(flow?.name || 'New Automation Flow')
  const [nodes, setNodes] = useState<FlowNode[]>(flow?.nodes || [])
  const [connections, setConnections] = useState<FlowConnection[]>(flow?.connections || [])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState<{ show: boolean; afterNode?: string; position?: { x: number; y: number } }>({ show: false })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const addNode = (type: FlowNode['type'], subtype: string, afterNodeId?: string) => {
    const newNode: FlowNode = {
      id: Date.now().toString(),
      type,
      subtype,
      config: getDefaultConfig(type, subtype),
      position: { x: 0, y: nodes.length * 120 + 50 }
    }

    setNodes([...nodes, newNode])

    if (afterNodeId) {
      setConnections([...connections, { from: afterNodeId, to: newNode.id }])
    } else if (nodes.length > 0) {
      setConnections([...connections, { from: nodes[nodes.length - 1].id, to: newNode.id }])
    }

    setShowAddMenu({ show: false })
    setSelectedNode(newNode.id)
  }

  const getDefaultConfig = (type: FlowNode['type'], subtype: string) => {
    switch (type) {
      case 'trigger':
        return { triggerType: subtype }
      case 'action':
        if (subtype === 'send_email') return { template: '', subject: '', body: '' }
        if (subtype === 'send_whatsapp') return { template: '', message: '' }
        if (subtype === 'send_sms') return { message: '' }
        return {}
      case 'condition':
        return { conditionType: subtype, trueLabel: 'Yes', falseLabel: 'No' }
      case 'delay':
        return { duration: '1d' }
      default:
        return {}
    }
  }

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n))
  }

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId))
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId))
    setSelectedNode(null)
  }

  const getNodeIcon = (node: FlowNode) => {
    if (node.type === 'trigger') {
      const trigger = triggerTypes.find(t => t.id === node.subtype)
      return trigger?.icon || Zap
    }
    if (node.type === 'action') {
      const action = actionTypes.find(a => a.id === node.subtype)
      return action?.icon || Zap
    }
    if (node.type === 'condition') {
      return GitBranch
    }
    if (node.type === 'delay') {
      return Clock
    }
    return Zap
  }

  const getNodeColor = (node: FlowNode) => {
    if (node.type === 'trigger') {
      return triggerTypes.find(t => t.id === node.subtype)?.color || 'bg-gray-100 text-gray-600'
    }
    if (node.type === 'action') {
      return actionTypes.find(a => a.id === node.subtype)?.color || 'bg-gray-100 text-gray-600'
    }
    if (node.type === 'condition') {
      return 'bg-purple-100 text-purple-600'
    }
    if (node.type === 'delay') {
      return 'bg-gray-100 text-gray-600'
    }
    return 'bg-gray-100 text-gray-600'
  }

  const getNodeLabel = (node: FlowNode) => {
    if (node.type === 'trigger') {
      return triggerTypes.find(t => t.id === node.subtype)?.label || 'Trigger'
    }
    if (node.type === 'action') {
      return actionTypes.find(a => a.id === node.subtype)?.label || 'Action'
    }
    if (node.type === 'condition') {
      return conditionTypes.find(c => c.id === node.subtype)?.label || 'Condition'
    }
    if (node.type === 'delay') {
      const delay = delayOptions.find(d => d.value === node.config.duration)
      return `Wait ${delay?.label || node.config.duration}`
    }
    return 'Node'
  }

  const selectedNodeData = nodes.find(n => n.id === selectedNode)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-full h-full max-w-[1400px] max-h-[900px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
              />
              <p className="text-sm text-gray-500">
                {nodes.length} steps • {nodes.filter(n => n.type === 'action').length} actions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-secondary">
              <Play className="w-4 h-4" />
              Test Flow
            </button>
            <button 
              onClick={() => onSave({ name: flowName, nodes, connections })}
              className="btn btn-primary"
            >
              <Save className="w-4 h-4" />
              Save & Activate
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Node Palette */}
          <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Triggers */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Triggers</h4>
                <div className="space-y-2">
                  {triggerTypes.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => nodes.length === 0 && addNode('trigger', trigger.id)}
                      disabled={nodes.length > 0}
                      className={`w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-left transition-all ${
                        nodes.length > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${trigger.color}`}>
                        <trigger.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{trigger.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</h4>
                <div className="space-y-2">
                  {actionTypes.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => nodes.length > 0 && addNode('action', action.id)}
                      disabled={nodes.length === 0}
                      className={`w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-left transition-all ${
                        nodes.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300 hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Flow Control */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Flow Control</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => nodes.length > 0 && addNode('delay', 'wait')}
                    disabled={nodes.length === 0}
                    className={`w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-left transition-all ${
                      nodes.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Wait / Delay</span>
                  </button>

                  {conditionTypes.map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => nodes.length > 0 && addNode('condition', condition.id)}
                      disabled={nodes.length === 0}
                      className={`w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-left transition-all ${
                        nodes.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{condition.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 bg-[#f8fafc] overflow-auto p-8"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {nodes.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Flow</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select a trigger from the left panel to begin creating your automation
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center min-h-full">
                {nodes.map((node, index) => (
                  <div key={node.id} className="flex flex-col items-center">
                    {/* Node */}
                    <div
                      onClick={() => setSelectedNode(node.id)}
                      className={`relative w-[300px] bg-white border-2 rounded-xl shadow-sm cursor-pointer transition-all ${
                        selectedNode === node.id
                          ? 'border-primary-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Node Header */}
                      <div className={`flex items-center gap-3 p-4 border-b border-gray-100 ${
                        node.type === 'trigger' ? 'bg-gradient-to-r from-amber-50 to-orange-50' :
                        node.type === 'condition' ? 'bg-gradient-to-r from-purple-50 to-pink-50' :
                        node.type === 'delay' ? 'bg-gradient-to-r from-gray-50 to-slate-50' :
                        'bg-gradient-to-r from-blue-50 to-cyan-50'
                      }`}>
                        <div className={`p-2 rounded-lg ${getNodeColor(node)}`}>
                          {(() => {
                            const Icon = getNodeIcon(node)
                            return <Icon className="w-4 h-4" />
                          })()}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            {node.type}
                          </p>
                          <p className="font-medium text-gray-900">{getNodeLabel(node)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNode(node.id) }}
                          className="p-1.5 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>

                      {/* Node Content */}
                      <div className="p-4">
                        {node.type === 'action' && node.subtype === 'send_email' && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              <span className="text-gray-400">Subject:</span>{' '}
                              {node.config.subject || 'Not configured'}
                            </p>
                          </div>
                        )}

                        {node.type === 'action' && node.subtype === 'send_whatsapp' && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {node.config.message || 'Configure message...'}
                          </p>
                        )}

                        {node.type === 'delay' && (
                          <select
                            value={node.config.duration}
                            onChange={(e) => updateNodeConfig(node.id, { duration: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          >
                            {delayOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        )}

                        {node.type === 'condition' && (
                          <p className="text-sm text-gray-500">
                            Configure condition in the panel →
                          </p>
                        )}

                        {node.type === 'trigger' && (
                          <p className="text-sm text-gray-500">
                            Flow starts when this event occurs
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Connection Arrow */}
                    {index < nodes.length - 1 && (
                      <div className="flex flex-col items-center py-2">
                        <div className="w-0.5 h-8 bg-gray-300" />
                        <ArrowDown className="w-4 h-4 text-gray-400 -mt-1" />
                      </div>
                    )}

                    {/* Add Button After Node */}
                    {index === nodes.length - 1 && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowAddMenu({ show: true, afterNode: node.id })}
                          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Step
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Node Editor Panel */}
          {selectedNodeData && (
            <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Configure Step</h4>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Trigger Configuration */}
                {selectedNodeData.type === 'trigger' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trigger Type
                      </label>
                      <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        {getNodeLabel(selectedNodeData)}
                      </p>
                    </div>

                    {selectedNodeData.subtype === 'time_since_visit' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Period
                        </label>
                        <select
                          value={selectedNodeData.config.period || '6M'}
                          onChange={(e) => updateNodeConfig(selectedNodeData.id, { period: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        >
                          <option value="3M">3 months</option>
                          <option value="6M">6 months</option>
                          <option value="1Y">1 year</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Action Configuration */}
                {selectedNodeData.type === 'action' && selectedNodeData.subtype === 'send_email' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Template
                      </label>
                      <select
                        value={selectedNodeData.config.template || ''}
                        onChange={(e) => updateNodeConfig(selectedNodeData.id, { template: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      >
                        <option value="">Select template...</option>
                        <option value="welcome">Welcome Email</option>
                        <option value="reminder">Appointment Reminder</option>
                        <option value="followup">Follow-up</option>
                        <option value="recall">Recall Notice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={selectedNodeData.config.subject || ''}
                        onChange={(e) => updateNodeConfig(selectedNodeData.id, { subject: e.target.value })}
                        placeholder="Enter subject..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Body
                      </label>
                      <textarea
                        value={selectedNodeData.config.body || ''}
                        onChange={(e) => updateNodeConfig(selectedNodeData.id, { body: e.target.value })}
                        placeholder="Write your email..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                      />
                    </div>

                    <div className="text-xs text-gray-500">
                      <p className="font-medium mb-1">Available variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {['{first_name}', '{last_name}', '{appointment_date}', '{clinic_name}'].map(v => (
                          <span key={v} className="px-2 py-0.5 bg-gray-100 rounded">{v}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Action Configuration */}
                {selectedNodeData.type === 'action' && selectedNodeData.subtype === 'send_whatsapp' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message Template
                      </label>
                      <select
                        value={selectedNodeData.config.template || ''}
                        onChange={(e) => updateNodeConfig(selectedNodeData.id, { template: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      >
                        <option value="">Select template...</option>
                        <option value="reminder">Appointment Reminder</option>
                        <option value="welcome">Welcome Message</option>
                        <option value="followup">Follow-up</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={selectedNodeData.config.message || ''}
                        onChange={(e) => updateNodeConfig(selectedNodeData.id, { message: e.target.value })}
                        placeholder="Type your message..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Delay Configuration */}
                {selectedNodeData.type === 'delay' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wait Duration
                      </label>
                      <select
                        value={selectedNodeData.config.duration || '1d'}
                        onChange={(e) => updateNodeConfig(selectedNodeData.id, { duration: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      >
                        {delayOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-700">
                        The flow will pause here and continue after the specified time.
                      </p>
                    </div>
                  </div>
                )}

                {/* Condition Configuration */}
                {selectedNodeData.type === 'condition' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition Type
                      </label>
                      <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        {getNodeLabel(selectedNodeData)}
                      </p>
                    </div>

                    {selectedNodeData.subtype === 'has_tag' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tag Name
                        </label>
                        <input
                          type="text"
                          value={selectedNodeData.config.tagName || ''}
                          onChange={(e) => updateNodeConfig(selectedNodeData.id, { tagName: e.target.value })}
                          placeholder="Enter tag name..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>
                    )}

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">
                        The flow will branch based on this condition. Configure "Yes" and "No" paths.
                      </p>
                    </div>
                  </div>
                )}

                {/* Delete Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => deleteNode(selectedNodeData.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Step
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Step Menu */}
      {showAddMenu.show && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center" onClick={() => setShowAddMenu({ show: false })}>
          <div className="bg-white rounded-xl shadow-2xl w-[500px] max-h-[600px] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Add Step</h3>
              <p className="text-sm text-gray-500">Choose what happens next in your flow</p>
            </div>
            
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {actionTypes.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => addNode('action', action.id, showAddMenu.afterNode)}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Flow Control</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addNode('delay', 'wait', showAddMenu.afterNode)}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-gray-200 text-gray-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Wait / Delay</span>
                  </button>
                  
                  {conditionTypes.slice(0, 3).map((condition) => (
                    <button
                      key={condition.id}
                      onClick={() => addNode('condition', condition.id, showAddMenu.afterNode)}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{condition.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

