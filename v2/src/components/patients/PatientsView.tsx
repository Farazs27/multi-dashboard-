import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  MessageCircle,
  Calendar,
  Star,
  MoreHorizontal,
  ChevronRight,
  User,
  Clock,
  Activity,
  FileText
} from 'lucide-react'
import { api } from '../../lib/api'
import { format } from 'date-fns'

interface Patient {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  whatsapp_number?: string
  preferred_channel: string
  engagement_score: number
  last_appointment_date?: string
  next_recall_date?: string
  created_at: string
}

export default function PatientsView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Mock patient data (replace with API call)
  const patients: Patient[] = [
    {
      id: 1,
      first_name: 'Jan',
      last_name: 'de Vries',
      email: 'jan.devries@email.nl',
      phone: '+31612345678',
      whatsapp_number: '+31612345678',
      preferred_channel: 'whatsapp',
      engagement_score: 85,
      last_appointment_date: '2024-11-15',
      next_recall_date: '2025-05-15',
      created_at: '2023-01-15',
    },
    {
      id: 2,
      first_name: 'Maria',
      last_name: 'Jansen',
      email: 'maria.jansen@email.nl',
      phone: '+31623456789',
      whatsapp_number: '+31623456789',
      preferred_channel: 'email',
      engagement_score: 92,
      last_appointment_date: '2024-12-01',
      next_recall_date: '2025-06-01',
      created_at: '2022-06-20',
    },
    {
      id: 3,
      first_name: 'Peter',
      last_name: 'Bakker',
      email: 'peter.bakker@email.nl',
      phone: '+31634567890',
      preferred_channel: 'email',
      engagement_score: 45,
      last_appointment_date: '2024-03-10',
      next_recall_date: '2024-09-10',
      created_at: '2021-11-05',
    },
  ]

  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      patient.first_name.toLowerCase().includes(search) ||
      patient.last_name.toLowerCase().includes(search) ||
      patient.email?.toLowerCase().includes(search) ||
      patient.phone?.includes(search)
    )
  })

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'sms':
        return <Phone className="w-4 h-4 text-purple-500" />
      default:
        return <Mail className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Patient List */}
      <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary text-sm py-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Patient
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedPatient?.id === patient.id ? 'bg-primary-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-medium">
                  {patient.first_name[0]}{patient.last_name[0]}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {patient.first_name} {patient.last_name}
                  </span>
                  {getChannelIcon(patient.preferred_channel)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{patient.email}</span>
                </div>
              </div>

              {/* Engagement Score */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(patient.engagement_score)}`}>
                {patient.engagement_score}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Detail */}
      {selectedPatient ? (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Patient Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-primary-600 font-semibold">
                    {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedPatient.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedPatient.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="btn btn-secondary">
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button className="btn btn-whatsapp">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <button className="btn btn-ghost">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Activity className="w-4 h-4" />
                  Engagement
                </div>
                <div className={`text-lg font-semibold ${
                  selectedPatient.engagement_score >= 80 ? 'text-green-600' :
                  selectedPatient.engagement_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedPatient.engagement_score}%
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  Last Visit
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedPatient.last_appointment_date 
                    ? format(new Date(selectedPatient.last_appointment_date), 'MMM d, yyyy')
                    : 'Never'}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  Next Recall
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedPatient.next_recall_date
                    ? format(new Date(selectedPatient.next_recall_date), 'MMM d, yyyy')
                    : 'Not set'}
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  Patient Since
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {format(new Date(selectedPatient.created_at), 'MMM yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6 gap-6">
              {['Overview', 'Appointments', 'Messages', 'Treatments', 'Documents'].map((tab, i) => (
                <button
                  key={tab}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    i === 0
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Communication Timeline */}
              <div className="card p-4">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary-500" />
                  Recent Communications
                </h3>
                <div className="space-y-3">
                  {[
                    { type: 'email', subject: 'Appointment Confirmation', date: '2 hours ago' },
                    { type: 'whatsapp', subject: 'Reminder sent', date: 'Yesterday' },
                    { type: 'email', subject: 'Treatment plan shared', date: '3 days ago' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      {item.type === 'email' ? (
                        <Mail className="w-4 h-4 text-blue-500" />
                      ) : (
                        <MessageCircle className="w-4 h-4 text-green-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{item.subject}</p>
                        <p className="text-xs text-gray-500">{item.date}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="card p-4">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  Upcoming Appointments
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-primary-900">Regular Checkup</span>
                      <span className="text-xs text-primary-600">Confirmed</span>
                    </div>
                    <p className="text-sm text-primary-700">Dec 20, 2024 at 14:00</p>
                  </div>
                  <button className="w-full btn btn-secondary text-sm">
                    <Plus className="w-4 h-4" />
                    Schedule Appointment
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="card p-4 col-span-2">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  Notes
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Patient is interested in Invisalign treatment. Discussed options during last visit.
                      Follow up in January to check progress.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Added by Dr. Sharifi • Dec 1, 2024</p>
                  </div>
                  <textarea
                    placeholder="Add a note..."
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Select a patient</h3>
            <p className="text-sm text-gray-500">Choose a patient from the list to view their profile</p>
          </div>
        </div>
      )}
    </div>
  )
}

