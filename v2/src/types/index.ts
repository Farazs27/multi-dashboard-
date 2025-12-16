// View types
export type ViewType = 
  | 'email' 
  | 'whatsapp' 
  | 'unified' 
  | 'patients' 
  | 'campaigns' 
  | 'automation' 
  | 'analytics' 
  | 'settings'

// Email types
export interface Email {
  id: number
  gmail_message_id?: string
  thread_id?: string
  from_email: string
  from_name?: string
  to_email: string
  subject: string
  body_text: string
  body_html?: string
  is_sent: boolean
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  ai_category?: string
  ai_sentiment?: string
  ai_intent?: string
  labels?: string
  received_at: string
  read_at?: string
  created_at: string
  attachments?: EmailAttachment[]
  patient_id?: number
}

export interface EmailAttachment {
  id: number
  email_id: number
  filename: string
  file_path: string
  mime_type: string
  size: number
}

export interface EmailFolder {
  id: string
  name: string
  icon: string
  count: number
  color?: string
  isAiCategory?: boolean
}

// WhatsApp types
export interface WhatsAppMessage {
  id: number
  whatsapp_message_id?: string
  chat_id: string
  patient_id?: number
  message_text: string
  media_type?: 'image' | 'video' | 'audio' | 'document' | 'sticker'
  media_url?: string
  media_filename?: string
  is_from_patient: boolean
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  sent_at: string
  delivered_at?: string
  read_at?: string
  ai_category?: string
  ai_sentiment?: string
  ai_intent?: string
  quoted_message_id?: number
  quoted_message?: WhatsAppMessage
  is_starred: boolean
  is_archived: boolean
  created_at: string
}

export interface WhatsAppChat {
  id: string
  patient_id?: number
  contact_name: string
  contact_phone: string
  contact_photo?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
  is_pinned: boolean
  is_muted: boolean
  is_archived: boolean
  is_online?: boolean
  last_seen?: string
}

// Patient types
export interface Patient {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  whatsapp_number?: string
  date_of_birth?: string
  preferred_channel: 'email' | 'whatsapp' | 'sms'
  opt_in_email: boolean
  opt_in_whatsapp: boolean
  opt_in_sms: boolean
  engagement_score: number
  last_appointment_date?: string
  next_recall_date?: string
  created_at: string
  updated_at: string
  notes?: PatientNote[]
  dental_history?: DentalHistory[]
  appointments?: Appointment[]
}

export interface PatientNote {
  id: number
  patient_id: number
  user_id: number
  note_text: string
  created_at: string
}

export interface DentalHistory {
  id: number
  patient_id: number
  treatment_type: string
  treatment_date: string
  notes?: string
  cost?: number
}

export interface Appointment {
  id: number
  patient_id: number
  appointment_date: string
  appointment_type: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reminder_sent_email: boolean
  reminder_sent_whatsapp: boolean
  reminder_sent_sms: boolean
  created_at: string
}

// Campaign types
export interface Campaign {
  id: number
  name: string
  channel: 'email' | 'whatsapp' | 'sms' | 'multi'
  segment_id?: number
  subject?: string
  content: string
  html_content?: string
  template_id?: number
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  scheduled_at?: string
  sent_at?: string
  total_recipients: number
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  created_by: number
  created_at: string
}

export interface Segment {
  id: number
  name: string
  description?: string
  rules: SegmentRule[]
  patient_count: number
  created_by: number
  created_at: string
  updated_at: string
}

export interface SegmentRule {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: string | number | string[]
  logic?: 'AND' | 'OR'
}

// Automation types
export interface AutomationFlow {
  id: number
  name: string
  description?: string
  trigger_type: string
  trigger_config: Record<string, unknown>
  is_active: boolean
  flow_steps: AutomationStep[]
  created_by: number
  created_at: string
  updated_at: string
}

export interface AutomationStep {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  config: Record<string, unknown>
  position: { x: number; y: number }
  connections: string[]
}

// Analytics types
export interface AnalyticsData {
  overview: {
    total_emails: number
    total_whatsapp: number
    total_patients: number
    total_campaigns: number
    open_rate: number
    response_rate: number
    conversion_rate: number
  }
  email_performance: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
  }
  whatsapp_performance: {
    sent: number
    delivered: number
    read: number
    responded: number
  }
  trends: {
    date: string
    emails: number
    whatsapp: number
    appointments: number
  }[]
  top_campaigns: {
    id: number
    name: string
    channel: string
    sent: number
    opened: number
    clicked: number
  }[]
}

// AI types
export interface AICategorization {
  category: string
  confidence: number
  sentiment: 'positive' | 'neutral' | 'negative'
  intent?: string
  suggested_reply?: string
  key_points?: string[]
}

// User types
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'dentist' | 'receptionist' | 'marketing'
  created_at: string
}

// Notification types
export interface Notification {
  id: string
  type: 'email' | 'whatsapp' | 'system' | 'reminder'
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
}

// Task types
export interface Task {
  id: number
  patient_id?: number
  assigned_to: number
  title: string
  description?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_by: number
  created_at: string
  completed_at?: string
}

